# Cards Controller

## Overview

Create the cards controller for viewing cards in sets and card details.

## Step-by-Step Plan

### 1. Create CardsController

**File**: `app/controllers/cards_controller.ts`

**Command**:

```bash
node ace make:controller Cards
```

---

### 2. Implement Index Method (List Cards in Set)

**File**: `app/controllers/cards_controller.ts`

**Route**: `GET /sets/:setId/cards`

**Purpose**: List all cards in a set

**Implementation**:

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Set from '#models/set'
import Card from '#models/card'
import InventoryItem from '#models/inventory_item'

export default class CardsController {
  async index({ params, auth, view, request }: HttpContext) {
    const user = auth.getUserOrFail()

    // Get set
    const set = await Set.findOrFail(params.setId)
    await set.load('game')

    // Get cards for this set
    let query = Card.query().where('set_id', set.id).orderBy('number', 'asc')

    // Search/filter
    const search = request.input('search')
    if (search) {
      query = query.where((q) => {
        q.where('name', 'ilike', `%${search}%`).orWhere('number', 'ilike', `%${search}%`)
      })
    }

    const cards = await query

    // Check which cards are in inventory
    const cardIds = cards.map((c) => c.id)
    const inventoryCardIds = await InventoryItem.query()
      .where('user_id', user.id)
      .whereIn('card_id', cardIds)
      .pluck('card_id')

    const cardsWithInventory = cards.map((card) => ({
      ...card.serialize(),
      inInventory: inventoryCardIds.includes(card.id),
    }))

    return view.render('pages/cards/index', {
      set,
      cards: cardsWithInventory,
      search,
    })
  }
}
```

**Reference**: [Pages & Views - Cards](../../docs/09-pages-views.md#6-cards)

---

### 3. Implement Show Method (Card Details)

**File**: `app/controllers/cards_controller.ts`

**Route**: `GET /cards/:cardId`

**Purpose**: Show detailed card information with variants and pricing

**Implementation**:

```typescript
async show({ params, auth, view }: HttpContext) {
  const user = auth.getUserOrFail()

  // Get card with set and variants
  const card = await Card.findOrFail(params.cardId)
  await card.load('set')
  await card.load('variants')

  // Get inventory item if in inventory
  const inventoryItem = await InventoryItem.query()
    .where('user_id', user.id)
    .where('card_id', card.id)
    .preload('variants', (q) => q.preload('variant'))
    .first()

  return view.render('pages/cards/show', {
    card,
    inventoryItem,
  })
}
```

**Reference**: [Pages & Views - Card Details](../../docs/09-pages-views.md#7-card-details)

---

### 4. Implement Update Method (Manual Correction)

**File**: `app/controllers/cards_controller.ts`

**Route**: `PATCH /cards/:cardId`

**Purpose**: Manually update card data

**Implementation**:

```typescript
import CardService from '#services/CardService'

async update({ params, request, response, session }: HttpContext) {
  const data = request.only(['name', 'number', 'rarity', 'details'])

  const cardService = new CardService()
  await cardService.updateCard(params.cardId, data)

  session.flash('success', 'Card updated successfully')
  return response.redirect().back()
}
```

**Reference**: [Services - CardService](../../docs/05-services.md#4-cardservice)

---

### 5. Implement Update Variant Method

**File**: `app/controllers/cards_controller.ts`

**Route**: `PATCH /cards/variants/:variantId`

**Purpose**: Manually update variant data

**Implementation**:

```typescript
async updateVariant({ params, request, response, session }: HttpContext) {
  const data = request.only(['price', 'condition', 'printing', 'language'])

  const cardService = new CardService()
  await cardService.updateCardVariant(params.variantId, data)

  session.flash('success', 'Variant updated successfully')
  return response.redirect().back()
}
```

---

### 6. Add Routes

**File**: `start/routes.ts`

**Implementation**:

```typescript
router
  .group(() => {
    router.get('/sets/:setId/cards', '#controllers/cards_controller.index')
    router.get('/cards/:cardId', '#controllers/cards_controller.show')
    router.patch('/cards/:cardId', '#controllers/cards_controller.update')
    router.patch('/cards/variants/:variantId', '#controllers/cards_controller.updateVariant')
  })
  .use(middleware.auth())
```

---

## Testing

Test cards controller:

```typescript
// In REPL or test
import CardsController from '#controllers/cards_controller'

const controller = new CardsController()

// Test index
await controller.index({ ...mockCtx, params: { setId: '1' } })

// Test show
await controller.show({ ...mockCtx, params: { cardId: '1' } })
```

---

## Completion Checklist

- [ ] CardsController created
- [ ] Index method implemented
- [ ] Show method implemented
- [ ] Update method implemented
- [ ] Update variant method implemented
- [ ] Search/filter implemented
- [ ] All routes added
- [ ] Controller tested
