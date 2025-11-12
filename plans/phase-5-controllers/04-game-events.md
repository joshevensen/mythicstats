# Game Events Controller

## Overview
Create the game events controller for CRUD operations on game events.

## Step-by-Step Plan

### 1. Create GameEventsController

**File**: `app/controllers/game_events_controller.ts`

**Command**:
```bash
node ace make:controller GameEvents
```

---

### 2. Implement Index Method (List Events)

**File**: `app/controllers/game_events_controller.ts`

**Route**: `GET /games/:gameId/events`

**Purpose**: List all events for a game

**Implementation**:
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import GameEvent from '#models/game_event'

export default class GameEventsController {
  async index({ params, auth, view }: HttpContext) {
    const user = auth.getUserOrFail()

    // Get game
    const game = await Game.findOrFail(params.gameId)

    // Get events for this game
    const events = await GameEvent.query()
      .where('game_id', game.id)
      .orderBy('start_date', 'desc')

    return view.render('pages/game_events/index', {
      game,
      events,
    })
  }
}
```

**Reference**: [Pages & Views - Game Events](../../docs/09-pages-views.md#4-game-events)

---

### 3. Implement Create Method (Show Form)

**File**: `app/controllers/game_events_controller.ts`

**Route**: `GET /games/:gameId/events/create`

**Purpose**: Show create event form

**Implementation**:
```typescript
async create({ params, view }: HttpContext) {
  const game = await Game.findOrFail(params.gameId)

  return view.render('pages/game_events/create', {
    game,
  })
}
```

**Reference**: [Pages & Views - Create Game Event](../../docs/09-pages-views.md#4a-create-game-event)

---

### 4. Implement Store Method (Create Event)

**File**: `app/controllers/game_events_controller.ts`

**Route**: `POST /events`

**Purpose**: Create new event

**Implementation**:
```typescript
async store({ request, response, session }: HttpContext) {
  const data = request.only([
    'game_id',
    'event_type',
    'title',
    'description',
    'start_date',
    'end_date',
    'affects_pricing',
  ])

  const event = await GameEvent.create(data)

  session.flash('success', 'Event created successfully')
  return response.redirect(`/games/${data.game_id}/events`)
}
```

---

### 5. Implement Edit Method (Show Edit Form)

**File**: `app/controllers/game_events_controller.ts`

**Route**: `GET /games/:gameId/events/:eventId`

**Purpose**: Show edit event form

**Implementation**:
```typescript
async edit({ params, view }: HttpContext) {
  const game = await Game.findOrFail(params.gameId)
  const event = await GameEvent.findOrFail(params.eventId)

  return view.render('pages/game_events/edit', {
    game,
    event,
  })
}
```

**Reference**: [Pages & Views - Edit Game Event](../../docs/09-pages-views.md#4b-edit-game-event)

---

### 6. Implement Update Method

**File**: `app/controllers/game_events_controller.ts`

**Route**: `PATCH /events/:eventId`

**Purpose**: Update event

**Implementation**:
```typescript
async update({ params, request, response, session }: HttpContext) {
  const event = await GameEvent.findOrFail(params.eventId)

  const data = request.only([
    'event_type',
    'title',
    'description',
    'start_date',
    'end_date',
    'affects_pricing',
  ])

  event.merge(data)
  await event.save()

  session.flash('success', 'Event updated successfully')
  return response.redirect(`/games/${event.gameId}/events`)
}
```

---

### 7. Implement Destroy Method

**File**: `app/controllers/game_events_controller.ts`

**Route**: `DELETE /events/:eventId`

**Purpose**: Delete event

**Implementation**:
```typescript
async destroy({ params, response, session }: HttpContext) {
  const event = await GameEvent.findOrFail(params.eventId)
  const gameId = event.gameId

  await event.delete()

  session.flash('success', 'Event deleted successfully')
  return response.redirect(`/games/${gameId}/events`)
}
```

---

### 8. Add Routes

**File**: `start/routes.ts`

**Implementation**:
```typescript
router
  .group(() => {
    router.get('/games/:gameId/events', '#controllers/game_events_controller.index')
    router.get('/games/:gameId/events/create', '#controllers/game_events_controller.create')
    router.post('/events', '#controllers/game_events_controller.store')
    router.get('/games/:gameId/events/:eventId', '#controllers/game_events_controller.edit')
    router.patch('/events/:eventId', '#controllers/game_events_controller.update')
    router.delete('/events/:eventId', '#controllers/game_events_controller.destroy')
  })
  .use(middleware.auth())
```

---

## Testing

Test game events controller:

```typescript
// In REPL or test
import GameEventsController from '#controllers/game_events_controller'

const controller = new GameEventsController()

// Test index
await controller.index({ ...mockCtx, params: { gameId: '1' } })

// Test store
await controller.store({
  ...mockCtx,
  request: {
    only: (fields) => ({
      game_id: 1,
      event_type: 'release',
      title: 'Test Event',
      start_date: '2024-01-01',
      affects_pricing: true,
    }),
  },
})
```

---

## Completion Checklist

- [ ] GameEventsController created
- [ ] Index method implemented
- [ ] Create method implemented
- [ ] Store method implemented
- [ ] Edit method implemented
- [ ] Update method implemented
- [ ] Destroy method implemented
- [ ] All routes added
- [ ] Controller tested

