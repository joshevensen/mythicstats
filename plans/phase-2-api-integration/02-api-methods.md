# API Methods

## Overview

Implement all API wrapper methods in JustTCGService. These methods wrap the SDK and automatically persist data to the database.

## Step-by-Step Plan

### 1. Implement `getGames()` Method

**File**: `app/services/JustTCGService.ts`

**Purpose**: Fetch all available games and persist to database

**SDK Method**: `client.v1.games.list()`

**Implementation**:

```typescript
async getGames(): Promise<JustTCGApiResponse<Game[]>> {
  // Check rate limit
  if (!(await this.checkRateLimit())) {
    throw new Error('Rate limit exceeded')
  }

  // Call SDK
  const response = await this.client.v1.games.list()

  // Update rate limit info
  await this.updateRateLimitInfo(response)

  // Upsert games to database
  for (const gameData of response.data) {
    await Game.updateOrCreate(
      { justTcgGameId: gameData.id },
      {
        justTcgGameId: gameData.id,
        name: gameData.name,
        cardsCount: gameData.cards_count,
        setsCount: gameData.sets_count,
        lastUpdatedAt: gameData.last_updated_at,
      }
    )
  }

  return response
}
```

**Reference**: [Services - getGames()](../../docs/05-services.md#getgames)

---

### 2. Implement `getSets()` Method

**File**: `app/services/JustTCGService.ts`

**Purpose**: Fetch all sets for a specific game and persist to database

**SDK Method**: `client.v1.sets.list({ game: gameId })`

**Parameters**:

- `gameId`: Database game ID (string)
- `trackedGame`: Optional TrackedGame instance

**Implementation**:

```typescript
async getSets(gameId: string, trackedGame?: TrackedGame): Promise<JustTCGApiResponse<Set[]>> {
  // Check rate limit
  if (!(await this.checkRateLimit())) {
    throw new Error('Rate limit exceeded')
  }

  // Get game to find JustTCG ID
  const game = await Game.findOrFail(gameId)

  // Call SDK
  const response = await this.client.v1.sets.list({ game: game.justTcgGameId })

  // Update rate limit info
  await this.updateRateLimitInfo(response)

  // Upsert sets to database
  for (const setData of response.data) {
    await Set.updateOrCreate(
      { justTcgSetId: setData.id },
      {
        gameId: game.id,
        justTcgSetId: setData.id,
        name: setData.name,
        cardsCount: setData.cards_count,
        releaseDate: setData.release_date,
      }
    )
  }

  // Update tracked game timestamp if provided
  if (trackedGame) {
    await trackedGame.markDiscoveryComplete()
  }

  return response
}
```

**Reference**: [Services - getSets()](../../docs/05-services.md#getsetsgameid-string-trackedgame-trackedgame)

---

### 3. Implement `getCardsBySet()` Method

**File**: `app/services/JustTCGService.ts`

**Purpose**: Fetch cards for a specific set with pagination and persist to database

**SDK Method**: `client.v1.cards.get({ set: setId, limit, offset })`

**Key Features**:

- Handles pagination automatically
- Batch size: 20 (free) or 100 (paid) based on user plan
- Updates rate limit info after each page
- Upserts cards and variants

**Implementation**:

```typescript
async getCardsBySet(setId: string, trackedSet?: TrackedSet): Promise<JustTCGApiResponse<Card[]>> {
  // Get set to find JustTCG ID
  const set = await Set.findOrFail(setId)

  // Determine batch size based on plan
  const batchSize = this.user.apiPlan === 'Free Tier' ? 20 : 100

  let offset = 0
  let allCards: Card[] = []
  let hasMore = true

  while (hasMore) {
    // Check rate limit before each page
    if (!(await this.checkRateLimit())) {
      throw new Error('Rate limit exceeded')
    }

    // Call SDK with pagination
    const response = await this.client.v1.cards.get({
      set: set.justTcgSetId,
      limit: batchSize,
      offset: offset,
    })

    // Update rate limit info after each page
    await this.updateRateLimitInfo(response)

    // Process cards and variants
    for (const cardData of response.data) {
      // Upsert card
      const card = await Card.updateOrCreate(
        { justTcgCardId: cardData.id },
        {
          setId: set.id,
          justTcgCardId: cardData.id,
          name: cardData.name,
          number: cardData.number,
          rarity: cardData.rarity,
          details: cardData.details,
          tcgplayerId: cardData.tcgplayer_id,
          mtgjsonId: cardData.mtgjson_id,
          scryfallId: cardData.scryfall_id,
        }
      )

      // Upsert variants
      if (cardData.variants) {
        for (const variantData of cardData.variants) {
          await CardVariant.updateOrCreate(
            { justTcgVariantId: variantData.id },
            {
              cardId: card.id,
              justTcgVariantId: variantData.id,
              // ... map all variant fields from API response
            }
          )
        }
      }

      allCards.push(card)
    }

    // Check if more pages
    hasMore = response.data.length === batchSize
    offset += batchSize
  }

  // Update tracked set timestamp if provided
  if (trackedSet) {
    await trackedSet.markSynced()
  }

  // Return final response (combine all pages)
  return {
    data: allCards,
    usage: response.usage, // Use last page's usage info
  }
}
```

**Reference**: [Services - getCardsBySet()](../../docs/05-services.md#getcardsbysetsetid-string-trackedset-trackedset)

**Note**: Map all variant fields from JustTCG API response. See [Database Schema - card_variants](../../docs/03-database-schema.md#6-card_variants) for complete field list.

---

### 4. Implement `getCardsByGame()` Method

**File**: `app/services/JustTCGService.ts`

**Purpose**: Fetch cards for a specific game with pagination (for bulk operations)

**SDK Method**: `client.v1.cards.get({ game: gameId, limit, offset })`

**Implementation**: Similar to `getCardsBySet()` but uses `game` parameter instead of `set`

**Reference**: [Services - getCardsByGame()](../../docs/05-services.md#getcardsbygamegameid-string)

---

### 5. Implement `getCardsBatch()` Method

**File**: `app/services/JustTCGService.ts`

**Purpose**: Batch fetch multiple cards by JustTCG IDs

**SDK Method**: `client.v1.cards.get()` with array of IDs (POST request)

**Key Features**:

- Handles batching (20 for free, 100 for paid)
- Splits large arrays into batches
- Updates rate limit after each batch

**Implementation**:

```typescript
async getCardsBatch(justTcgIds: string[]): Promise<JustTCGApiResponse<Card[]>> {
  // Determine batch size
  const batchSize = this.user.apiPlan === 'Free Tier' ? 20 : 100

  let allCards: Card[] = []

  // Process in batches
  for (let i = 0; i < justTcgIds.length; i += batchSize) {
    const batch = justTcgIds.slice(i, i + batchSize)

    // Check rate limit before each batch
    if (!(await this.checkRateLimit())) {
      throw new Error('Rate limit exceeded')
    }

    // Call SDK with batch
    const response = await this.client.v1.cards.get(batch)

    // Update rate limit info
    await this.updateRateLimitInfo(response)

    // Process cards and variants (same as getCardsBySet)
    // ... upsert logic
  }

  return { data: allCards, usage: response.usage }
}
```

**Reference**: [Services - getCardsBatch()](../../docs/05-services.md#getcardsbatchjusttcgids-string)

---

### 6. Implement `getCard()` Method

**File**: `app/services/JustTCGService.ts`

**Purpose**: Fetch single card by JustTCG ID (rare use only)

**SDK Method**: `client.v1.cards.get({ cardId: justTcgId })` or `{ variantId: justTcgId }`

**Implementation**: Similar to batch but for single card

**Reference**: [Services - getCard()](../../docs/05-services.md#getcardjusttcgid-string-options-cardoptions)

**Note**: Prefer batch operations when possible.

---

## Testing

Test each method:

```typescript
// In REPL
const User = await import('#models/user')
const JustTCGService = await import('#services/JustTCGService')

const user = await User.default.first()
const service = new JustTCGService.default(user)

// Test getGames
const gamesResponse = await service.getGames()
console.log('Games:', gamesResponse.data.length)

// Test getSets
const game = gamesResponse.data[0]
const setsResponse = await service.getSets(game.id)
console.log('Sets:', setsResponse.data.length)
```

---

## Completion Checklist

- [ ] `getGames()` implemented
- [ ] `getSets()` implemented
- [ ] `getCardsBySet()` implemented with pagination
- [ ] `getCardsByGame()` implemented
- [ ] `getCardsBatch()` implemented with batching
- [ ] `getCard()` implemented
- [ ] All methods persist data to database
- [ ] All methods update rate limit info
- [ ] Pagination working correctly
- [ ] Batching working correctly
- [ ] Methods tested with real API calls
