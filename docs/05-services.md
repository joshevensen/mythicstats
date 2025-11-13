# Services Architecture

## Overview

Services provide reusable business logic that can be used by both background jobs and on-demand operations (controllers, user actions). This separation ensures code reuse and consistent behavior across the application.

## Service Principles

- **Shared Logic**: Services contain business logic used by both jobs and controllers
- **Stateless**: Services should be stateless (no instance state between calls)
- **Error Handling**: Services handle errors and return consistent error types
- **Rate Limiting**: Services check rate limits before making API calls
- **Database Updates**: Services handle database operations (create, update, upsert)

---

## 1. JustTCGService (`app/services/JustTCGService.ts`)

Wrapper service around the official [JustTCG TypeScript SDK](https://justtcg.com/docs/sdk) (`justtcg-js`).

### Purpose

Handles all interactions with the JustTCG API, including rate limit checking, response transformation, and **automatic database persistence**.

### Dependencies

- `justtcg-js` SDK
- `JUSTTCG_API_KEY` environment variable
- Lucid models (Game, Set, Card, CardVariant, TrackedGame, TrackedSet)

### Key Behavior

**JustTCGService automatically updates the database** when fetching data from the API. It upserts games, sets, cards, and variants, and optionally updates tracking timestamps.

### Methods

#### `getGames()`

- **Purpose**: Fetch all available games and persist to database
- **SDK Method**: `client.v1.games.list()`
- **Returns**: `JustTCGApiResponse<Game[]>` (with database records)
- **Database**: Upserts games in `games` table
- **Rate Limit**: Updates user rate limit info from response `usage` object
- **Used By**: Jobs (initial setup), Controllers (game listing)

#### `getSets(gameId: string, trackedGame?: TrackedGame)`

- **Purpose**: Fetch all sets for a specific game and persist to database
- **SDK Method**: `client.v1.sets.list({ game: gameId })`
- **Parameters**:
  - `gameId`: Database game ID
  - `trackedGame`: Optional TrackedGame instance (to update `last_sets_discovery_at`)
- **Returns**: `JustTCGApiResponse<Set[]>` (with database records)
- **Database**:
  - Upserts sets in `sets` table
  - Updates `tracked_games.last_sets_discovery_at` if `trackedGame` provided
- **Rate Limit**: Updates user rate limit info from response `usage` object
- **Used By**: Jobs (discover-sets), Controllers (set listing, on-demand discovery)

#### `getCardsBySet(setId: string, trackedSet?: TrackedSet)`

- **Purpose**: Fetch cards for a specific set with pagination and persist to database
- **SDK Method**: `client.v1.cards.get({ set: setId, limit, offset })`
- **Parameters**:
  - `setId`: Database set ID
  - `trackedSet`: Optional TrackedSet instance (to update `last_sync_at`)
- **Returns**: `JustTCGApiResponse<Card[]>` (paginated, with database records)
- **Database**:
  - Upserts cards in `cards` table
  - Upserts variants in `card_variants` table
  - Updates `tracked_sets.last_sync_at` if `trackedSet` provided
- **Pagination**: Handles pagination automatically, returns all cards across multiple requests
- **Batch Size**: 20 for free plan, 100 for paid plans
- **Rate Limit**: Updates user rate limit info from response `usage` object after each page
- **Used By**: Jobs (sync-tracked-sets), Controllers (on-demand set sync)

#### `getCardsByGame(gameId: string)`

- **Purpose**: Fetch cards for a specific game with pagination and persist to database
- **SDK Method**: `client.v1.cards.get({ game: gameId, limit, offset })`
- **Parameters**:
  - `gameId`: Database game ID
- **Returns**: `JustTCGApiResponse<Card[]>` (paginated, with database records)
- **Database**:
  - Upserts cards in `cards` table
  - Upserts variants in `card_variants` table
- **Pagination**: Handles pagination automatically
- **Rate Limit**: Updates user rate limit info from response `usage` object
- **Used By**: Controllers (bulk operations, when extra requests available)

#### `getCardsBatch(justTcgIds: string[])`

- **Purpose**: Batch fetch multiple cards by JustTCG IDs and persist to database
- **SDK Method**: `client.v1.cards.get()` with array of IDs (POST request)
- **Parameters**:
  - `justTcgIds`: Array of JustTCG card IDs or variant IDs
- **Returns**: `JustTCGApiResponse<Card[]>` (with database records)
- **Database**:
  - Upserts cards in `cards` table
  - Upserts variants in `card_variants` table
- **Batch Size**: Up to 20 cards (free plan) or 100 cards (paid plans) per request
- **Rate Limit**: Updates user rate limit info from response `usage` object
- **Used By**: Jobs (update-inventory-prices), Controllers (inventory price updates)

#### `getCard(justTcgId: string, options?: CardOptions)`

- **Purpose**: Fetch single card by JustTCG ID and persist to database (rare use only)
- **SDK Method**: `client.v1.cards.get({ cardId: justTcgId })` or `{ variantId: justTcgId }`
- **Parameters**:
  - `justTcgId`: JustTCG card ID or variant ID
  - `options`: Optional card options
- **Returns**: `JustTCGApiResponse<Card>` (with database record)
- **Database**:
  - Upserts card in `cards` table
  - Upserts variants in `card_variants` table
- **Rate Limit**: Updates user rate limit info from response `usage` object
- **Used By**: Controllers (single card lookup, user search)
- **Note**: Prefer batch operations when possible

#### `checkRateLimit(user: User)`

- **Purpose**: Check if API can be accessed
- **Parameters**:
  - `user`: User model instance
- **Returns**: `boolean` - true if can make request, false if rate limited
- **Checks**:
  - `user.api_requests_remaining > 0` (monthly)
  - `user.api_daily_requests_remaining > 0` (daily)
- **Used By**: All service methods before making API calls

#### `updateRateLimitInfo(user: User, response: JustTCGApiResponse<any>)`

- **Purpose**: Update rate limit info from SDK response
- **Parameters**:
  - `user`: User model instance
  - `response`: SDK response containing `usage` object
- **Updates**:
  - `apiPlan`
  - `apiMonthlyLimit`, `apiDailyLimit`, `apiRateLimit`
  - `apiRequestsUsed`, `apiDailyRequestsUsed`
  - `apiRequestsRemaining`, `apiDailyRequestsRemaining`
  - `apiLimitInfoUpdatedAt`
- **Used By**: All service methods after making API calls

### Error Handling

- SDK-level errors (authentication, invalid parameters): Thrown as exceptions
- API-level errors (validation, rate limits): Returned in `response.error` and `response.code`
- Rate limit errors (429): Returned in response object, not thrown
- Database errors: Logged and thrown as exceptions

---

## 2. TrackingService (`app/services/TrackingService.ts`)

Service for managing tracked games and sets.

### Purpose

Handles business logic for tracking/untracking games and sets, including validation and state management.

### Dependencies

- Lucid models (User, Game, Set, TrackedGame, TrackedSet)

### Methods

#### `trackGame(userId: number, gameId: number)`

- **Purpose**: Add a game to user's tracked games
- **Parameters**:
  - `userId`: User ID
  - `gameId`: Game ID
- **Returns**: `TrackedGame` instance
- **Process**:
  1. Validates game exists
  2. Checks if already tracked (prevents duplicates)
  3. Creates `tracked_games` record with `is_active = true`
  4. Returns tracked game
- **Used By**: Controllers (track game action)

#### `untrackGame(userId: number, gameId: number)`

- **Purpose**: Remove a game from user's tracked games
- **Parameters**:
  - `userId`: User ID
  - `gameId`: Game ID
- **Returns**: `boolean` - true if removed, false if not found
- **Process**:
  1. Finds tracked game record
  2. Deletes record
  3. Returns success status
- **Used By**: Controllers (untrack game action)

#### `trackSet(userId: number, setId: number)`

- **Purpose**: Add a set to user's tracked sets
- **Parameters**:
  - `userId`: User ID
  - `setId`: Set ID
- **Returns**: `TrackedSet` instance
- **Process**:
  1. Validates set exists
  2. Checks if already tracked (prevents duplicates)
  3. Creates `tracked_sets` record with `is_active = true`
  4. Returns tracked set
- **Used By**: Controllers (track set action)

#### `untrackSet(userId: number, setId: number)`

- **Purpose**: Remove a set from user's tracked sets
- **Parameters**:
  - `userId`: User ID
  - `setId`: Set ID
- **Returns**: `boolean` - true if removed, false if not found
- **Process**:
  1. Finds tracked set record
  2. Deletes record
  3. Returns success status
- **Used By**: Controllers (untrack set action)

#### `getTrackedGames(userId: number)`

- **Purpose**: Get all tracked games for a user
- **Parameters**:
  - `userId`: User ID
- **Returns**: `TrackedGame[]` with related Game data
- **Used By**: Controllers (list tracked games)

#### `getTrackedSets(userId: number)`

- **Purpose**: Get all tracked sets for a user
- **Parameters**:
  - `userId`: User ID
- **Returns**: `TrackedSet[]` with related Set data
- **Used By**: Controllers (list tracked sets)

#### `toggleGameTracking(userId: number, gameId: number)`

- **Purpose**: Toggle active status of tracked game
- **Parameters**:
  - `userId`: User ID
  - `gameId`: Game ID
- **Returns**: `TrackedGame` instance with updated `is_active` status
- **Used By**: Controllers (enable/disable game tracking)

#### `toggleSetTracking(userId: number, setId: number)`

- **Purpose**: Toggle active status of tracked set
- **Parameters**:
  - `userId`: User ID
  - `setId`: Set ID
- **Returns**: `TrackedSet` instance with updated `is_active` status
- **Used By**: Controllers (enable/disable set tracking)

### Error Handling

- Validation errors: Thrown as exceptions (game/set doesn't exist, already tracked)
- Database errors: Thrown as exceptions

---

## 3. InventoryService (`app/services/InventoryService.ts`)

Service for managing card inventory.

### Purpose

Handles business logic for adding cards to inventory, updating variant quantities, and syncing inventory variants with card variants.

### Dependencies

- Lucid models (User, Card, CardVariant, InventoryItem, InventoryItemVariant)

### Methods

#### `addCardToInventory(userId: number, cardId: number)`

- **Purpose**: Add a card to user's inventory
- **Parameters**:
  - `userId`: User ID
  - `cardId`: Card ID
- **Returns**: `InventoryItem` instance with all variants
- **Process**:
  1. Validates card exists
  2. Checks if already in inventory (prevents duplicates)
  3. Creates `inventory_item` record
  4. **Automatically creates `inventory_item_variant` for each existing `card_variant`** (quantity = 0)
  5. Returns inventory item with variants
- **Used By**: Controllers (add card to inventory)

#### `updateVariantQuantity(inventoryItemVariantId: number, quantity: number)`

- **Purpose**: Update quantity for an existing inventory item variant
- **Parameters**:
  - `inventoryItemVariantId`: Inventory item variant ID
  - `quantity`: New quantity (must be >= 0)
- **Returns**: `InventoryItemVariant` instance
- **Process**:
  1. Validates variant exists
  2. Validates quantity >= 0
  3. Updates quantity
  4. Returns updated variant
- **Used By**: Controllers (update inventory quantity)

#### `removeCardFromInventory(userId: number, cardId: number)`

- **Purpose**: Remove a card from user's inventory
- **Parameters**:
  - `userId`: User ID
  - `cardId`: Card ID
- **Returns**: `boolean` - true if removed, false if not found
- **Process**:
  1. Finds inventory item
  2. Deletes `inventory_item` record (cascades to `inventory_item_variant` records)
  3. Returns success status
- **Used By**: Controllers (remove card from inventory)

#### `resyncInventoryVariants(inventoryItemId: number)`

- **Purpose**: Sync inventory variants with current card variants (manual operation)
- **Parameters**:
  - `inventoryItemId`: Inventory item ID
- **Returns**: `{ added: number, removed: number }` - count of variants added/removed
- **Process**:
  1. Gets all current `card_variants` for the card
  2. Gets all existing `inventory_item_variant` records
  3. **Adds** `inventory_item_variant` for any new `card_variants` (preserves existing quantity if variant was previously removed, otherwise quantity = 0)
  4. **Removes** `inventory_item_variant` for deleted `card_variants`
  5. **Keeps** existing variants unchanged
  6. Returns counts of changes
- **Used By**: Controllers (manual resync after card variants change)

### Error Handling

- Validation errors: Thrown as exceptions (card doesn't exist, already in inventory, invalid quantity)
- Database errors: Thrown as exceptions

---

## 4. CardService (`app/services/CardService.ts`)

Service for manual card and variant corrections.

### Purpose

Handles manual updates to card data when JustTCG data is incorrect or needs correction.

### Dependencies

- Lucid models (Card, CardVariant)

### Methods

#### `updateCard(cardId: number, updates: Partial<Card>)`

- **Purpose**: Manually update card information
- **Parameters**:
  - `cardId`: Card ID
  - `updates`: Partial card data (name, details, number, rarity, etc.)
- **Returns**: `Card` instance
- **Process**:
  1. Validates card exists
  2. Validates update data
  3. Updates card record
  4. Returns updated card
- **Used By**: Controllers (manual card correction)

#### `updateCardVariant(variantId: number, updates: Partial<CardVariant>)`

- **Purpose**: Manually update card variant information
- **Parameters**:
  - `variantId`: Card variant ID
  - `updates`: Partial variant data (condition, printing, language, etc.)
- **Returns**: `CardVariant` instance
- **Process**:
  1. Validates variant exists
  2. Validates update data
  3. Updates variant record
  4. Returns updated variant
- **Used By**: Controllers (manual variant correction)

### Error Handling

- Validation errors: Thrown as exceptions (card/variant doesn't exist, invalid data)
- Database errors: Thrown as exceptions

---

## 5. ApiUsageService (`app/services/ApiUsageService.ts`)

Service for retrieving and formatting API usage statistics.

### Purpose

Provides formatted API usage and rate limit information for display in the UI.

### Dependencies

- Lucid models (User)

### Methods

#### `getApiUsageStats(userId: number)`

- **Purpose**: Get formatted API usage statistics
- **Parameters**:
  - `userId`: User ID
- **Returns**: Formatted usage stats object
- **Returns**:
  ```typescript
  {
    plan: string,
    monthly: {
      limit: number,
      used: number,
      remaining: number,
      percentage: number
    },
    daily: {
      limit: number,
      used: number,
      remaining: number,
      percentage: number
    },
    rateLimit: number, // per minute
    lastUpdated: Date
  }
  ```
- **Used By**: Controllers (API status display)

#### `getRateLimitStatus(userId: number)`

- **Purpose**: Get rate limit status and reset times
- **Parameters**:
  - `userId`: User ID
- **Returns**: Rate limit status object
- **Returns**:
  ```typescript
  {
    canMakeRequest: boolean,
    dailyResetTime: Date | null,
    monthlyResetTime: Date | null,
    isRateLimited: boolean
  }
  ```
- **Used By**: Controllers (rate limit status display)

### Error Handling

- User not found: Thrown as exception

---

## Service Usage Patterns

### In Jobs

```typescript
// Example: SyncTrackedSetsProcessor
const justTCGService = new JustTCGService()
const trackedSet = await TrackedSet.findOrFail(setId)
await justTCGService.getCardsBySet(setId, trackedSet) // Auto-updates DB and timestamp
```

### In Controllers

```typescript
// Example: SetsController - on-demand sync
const justTCGService = new JustTCGService()
const trackedSet = await TrackedSet.findBy({ userId, setId })
await justTCGService.getCardsBySet(setId, trackedSet) // Auto-updates DB and timestamp

// Example: InventoryController - add card
const inventoryService = new InventoryService()
const inventoryItem = await inventoryService.addCardToInventory(userId, cardId)
// Automatically creates variants for all existing card_variants
```

### Rate Limit Checking

All JustTCGService methods that make API calls:

1. Check rate limit before calling SDK
2. Update rate limit info after each API response
3. Handle rate limit errors gracefully

### Error Propagation

- Services throw exceptions for unrecoverable errors
- Services return error objects for recoverable errors (rate limits, partial failures)
- Jobs and controllers handle errors appropriately for their context

---

## Service Testing

### Unit Tests

- Mock JustTCGService for other service tests
- Mock database operations
- Test business logic in isolation
- Test error handling scenarios

### Integration Tests

- Test with real JustTCGService (or mocked SDK)
- Test database operations
- Test rate limit integration
- Test service interactions
