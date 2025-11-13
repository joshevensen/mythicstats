# Games Controller

## Overview

Create the games controller for listing games, viewing game details, and managing tracked games.

## Step-by-Step Plan

### 1. Create GamesController

**File**: `app/controllers/games_controller.ts`

**Command**:

```bash
node ace make:controller Games
```

---

### 2. Implement Index Method (List Games)

**File**: `app/controllers/games_controller.ts`

**Route**: `GET /games`

**Purpose**: List all available games with tracked status

**Implementation**:

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import TrackedGame from '#models/tracked_game'
import JustTCGService from '#services/JustTCGService'

export default class GamesController {
  async index({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()

    // Get all games
    const games = await Game.query().orderBy('name', 'asc')

    // Get tracked games for user
    const trackedGames = await TrackedGame.query().where('user_id', user.id).pluck('game_id')

    // Mark which games are tracked
    const gamesWithTracking = games.map((game) => ({
      ...game.serialize(),
      isTracked: trackedGames.includes(game.id),
      trackedGame: trackedGames.includes(game.id)
        ? await TrackedGame.query().where('user_id', user.id).where('game_id', game.id).first()
        : null,
    }))

    return view.render('pages/games/index', {
      games: gamesWithTracking,
    })
  }
}
```

**Reference**: [Pages & Views - Games](../../docs/09-pages-views.md#2-games)

---

### 3. Implement Show Method (Game Details)

**File**: `app/controllers/games_controller.ts`

**Route**: `GET /games/:gameId`

**Purpose**: Show game details with sets list

**Implementation**:

```typescript
async show({ params, auth, view }: HttpContext) {
  const user = auth.getUserOrFail()

  // Get game
  const game = await Game.findOrFail(params.gameId)

  // Get sets for this game
  const sets = await Set.query()
    .where('game_id', game.id)
    .orderBy('release_date', 'desc')

  // Get tracked sets for user
  const trackedSets = await TrackedSet.query()
    .where('user_id', user.id)
    .whereIn('set_id', sets.map((s) => s.id))
    .pluck('set_id')

  // Mark which sets are tracked
  const setsWithTracking = sets.map((set) => ({
    ...set.serialize(),
    isTracked: trackedSets.includes(set.id),
    trackedSet: trackedSets.includes(set.id)
      ? await TrackedSet.query()
          .where('user_id', user.id)
          .where('set_id', set.id)
          .first()
      : null,
  }))

  // Get tracked game info
  const trackedGame = await TrackedGame.query()
    .where('user_id', user.id)
    .where('game_id', game.id)
    .first()

  return view.render('pages/games/show', {
    game,
    sets: setsWithTracking,
    trackedGame,
  })
}
```

**Reference**: [Pages & Views - Game Details](../../docs/09-pages-views.md#3-game-details)

---

### 4. Implement Track Game Action

**File**: `app/controllers/games_controller.ts`

**Route**: `POST /games/:gameId/track`

**Purpose**: Add game to tracked games

**Implementation**:

```typescript
import TrackingService from '#services/TrackingService'

async track({ params, auth, response }: HttpContext) {
  const user = auth.getUserOrFail()
  const trackingService = new TrackingService()

  await trackingService.trackGame(user.id, params.gameId)

  return response.redirect().back()
}
```

**Reference**: [Services - trackGame()](../../docs/05-services.md#trackgameuserid-number-gameid-number)

---

### 5. Implement Untrack Game Action

**File**: `app/controllers/games_controller.ts`

**Route**: `DELETE /games/:gameId/track`

**Purpose**: Remove game from tracked games

**Implementation**:

```typescript
async untrack({ params, auth, response }: HttpContext) {
  const user = auth.getUserOrFail()
  const trackingService = new TrackingService()

  await trackingService.untrackGame(user.id, params.gameId)

  return response.redirect().back()
}
```

---

### 6. Implement Toggle Active Status

**File**: `app/controllers/games_controller.ts`

**Route**: `PATCH /games/:gameId/track`

**Purpose**: Toggle is_active status

**Implementation**:

```typescript
async toggleActive({ params, auth, response }: HttpContext) {
  const user = auth.getUserOrFail()
  const trackingService = new TrackingService()

  await trackingService.toggleGameTracking(user.id, params.gameId)

  return response.redirect().back()
}
```

---

### 7. Implement Discover Sets Action

**File**: `app/controllers/games_controller.ts`

**Route**: `POST /games/:gameId/discover-sets`

**Purpose**: Manually trigger sets discovery (JustTCG API request)

**Implementation**:

```typescript
async discoverSets({ params, auth, response, session }: HttpContext) {
  const user = auth.getUserOrFail()
  const justTcgService = new JustTCGService(user)

  try {
    // Get tracked game
    const trackedGame = await TrackedGame.query()
      .where('user_id', user.id)
      .where('game_id', params.gameId)
      .firstOrFail()

    // Discover sets
    await justTcgService.getSets(params.gameId, trackedGame)

    session.flash('success', 'Sets discovered successfully')
  } catch (error) {
    session.flash('error', `Failed to discover sets: ${error.message}`)
  }

  return response.redirect().back()
}
```

---

### 8. Add Routes

**File**: `start/routes.ts`

**Implementation**:

```typescript
router
  .group(() => {
    router.get('/games', '#controllers/games_controller.index')
    router.get('/games/:gameId', '#controllers/games_controller.show')
    router.post('/games/:gameId/track', '#controllers/games_controller.track')
    router.delete('/games/:gameId/track', '#controllers/games_controller.untrack')
    router.patch('/games/:gameId/track', '#controllers/games_controller.toggleActive')
    router.post('/games/:gameId/discover-sets', '#controllers/games_controller.discoverSets')
  })
  .use(middleware.auth())
```

---

## Testing

Test games controller:

```typescript
// In REPL or test
import GamesController from '#controllers/games_controller'

const controller = new GamesController()

// Test index
await controller.index(mockCtx)

// Test show
await controller.show({ ...mockCtx, params: { gameId: '1' } })
```

---

## Completion Checklist

- [ ] GamesController created
- [ ] Index method implemented
- [ ] Show method implemented
- [ ] Track game action implemented
- [ ] Untrack game action implemented
- [ ] Toggle active action implemented
- [ ] Discover sets action implemented
- [ ] All routes added
- [ ] Controller tested
