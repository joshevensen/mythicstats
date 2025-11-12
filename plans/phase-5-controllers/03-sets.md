# Sets Controller

## Overview
Create the sets controller for viewing set details and managing tracked sets.

## Step-by-Step Plan

### 1. Create SetsController

**File**: `app/controllers/sets_controller.ts`

**Command**:
```bash
node ace make:controller Sets
```

---

### 2. Implement Show Method (Set Details)

**File**: `app/controllers/sets_controller.ts`

**Route**: `GET /sets/:setId`

**Purpose**: Show set information and card summary

**Implementation**:
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Set from '#models/set'
import Card from '#models/card'
import InventoryItem from '#models/inventory_item'
import TrackedSet from '#models/tracked_set'
import JustTCGService from '#services/JustTCGService'

export default class SetsController {
  async show({ params, auth, view }: HttpContext) {
    const user = auth.getUserOrFail()

    // Get set with game
    const set = await Set.findOrFail(params.setId)
    await set.load('game')

    // Get tracked set info
    const trackedSet = await TrackedSet.query()
      .where('user_id', user.id)
      .where('set_id', set.id)
      .first()

    // Card summary
    const totalCards = await Card.query().where('set_id', set.id).count('* as total')
    const cardsInInventory = await InventoryItem.query()
      .where('user_id', user.id)
      .whereIn('card_id', (query) => {
        query.select('id').from('cards').where('set_id', set.id)
      })
      .count('* as total')

    // Price range (min/max) for cards in set
    const priceStats = await CardVariant.query()
      .whereHas('card', (q) => q.where('set_id', set.id))
      .select('price')
      .orderBy('price', 'asc')
      .first()
    const minPrice = priceStats?.price || 0

    const maxPriceStats = await CardVariant.query()
      .whereHas('card', (q) => q.where('set_id', set.id))
      .select('price')
      .orderBy('price', 'desc')
      .first()
    const maxPrice = maxPriceStats?.price || 0

    return view.render('pages/sets/show', {
      set,
      trackedSet,
      cardSummary: {
        total: totalCards[0].total,
        inInventory: cardsInInventory[0].total,
        priceRange: { min: minPrice, max: maxPrice },
      },
    })
  }
}
```

**Reference**: [Pages & Views - Set Details](../../docs/09-pages-views.md#5-set-details)

---

### 3. Implement Track Set Action

**File**: `app/controllers/sets_controller.ts`

**Route**: `POST /sets/:setId/track`

**Implementation**:
```typescript
import TrackingService from '#services/TrackingService'

async track({ params, auth, response }: HttpContext) {
  const user = auth.getUserOrFail()
  const trackingService = new TrackingService()

  await trackingService.trackSet(user.id, params.setId)

  return response.redirect().back()
}
```

---

### 4. Implement Untrack Set Action

**File**: `app/controllers/sets_controller.ts`

**Route**: `DELETE /sets/:setId/track`

**Implementation**:
```typescript
async untrack({ params, auth, response }: HttpContext) {
  const user = auth.getUserOrFail()
  const trackingService = new TrackingService()

  await trackingService.untrackSet(user.id, params.setId)

  return response.redirect().back()
}
```

---

### 5. Implement Toggle Active Status

**File**: `app/controllers/sets_controller.ts`

**Route**: `PATCH /sets/:setId/track`

**Implementation**:
```typescript
async toggleActive({ params, auth, response }: HttpContext) {
  const user = auth.getUserOrFail()
  const trackingService = new TrackingService()

  await trackingService.toggleSetTracking(user.id, params.setId)

  return response.redirect().back()
}
```

---

### 6. Implement Manual Sync Action

**File**: `app/controllers/sets_controller.ts`

**Route**: `POST /sets/:setId/sync`

**Purpose**: Manually trigger card sync (JustTCG API request)

**Implementation**:
```typescript
async sync({ params, auth, response, session }: HttpContext) {
  const user = auth.getUserOrFail()
  const justTcgService = new JustTCGService(user)

  try {
    // Get tracked set
    const trackedSet = await TrackedSet.query()
      .where('user_id', user.id)
      .where('set_id', params.setId)
      .firstOrFail()

    // Sync cards
    await justTcgService.getCardsBySet(params.setId, trackedSet)

    session.flash('success', 'Set synced successfully')
  } catch (error) {
    session.flash('error', `Failed to sync set: ${error.message}`)
  }

  return response.redirect().back()
}
```

---

### 7. Add Routes

**File**: `start/routes.ts`

**Implementation**:
```typescript
router
  .group(() => {
    router.get('/sets/:setId', '#controllers/sets_controller.show')
    router.post('/sets/:setId/track', '#controllers/sets_controller.track')
    router.delete('/sets/:setId/track', '#controllers/sets_controller.untrack')
    router.patch('/sets/:setId/track', '#controllers/sets_controller.toggleActive')
    router.post('/sets/:setId/sync', '#controllers/sets_controller.sync')
  })
  .use(middleware.auth())
```

---

## Testing

Test sets controller:

```typescript
// In REPL or test
import SetsController from '#controllers/sets_controller'

const controller = new SetsController()

// Test show
await controller.show({ ...mockCtx, params: { setId: '1' } })

// Test sync
await controller.sync({ ...mockCtx, params: { setId: '1' } })
```

---

## Completion Checklist

- [ ] SetsController created
- [ ] Show method implemented
- [ ] Track set action implemented
- [ ] Untrack set action implemented
- [ ] Toggle active action implemented
- [ ] Manual sync action implemented
- [ ] All routes added
- [ ] Controller tested

