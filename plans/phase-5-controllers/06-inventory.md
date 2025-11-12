# Inventory Controller

## Overview
Create the inventory controller for managing card inventory, including adding/removing cards and updating variant quantities.

## Step-by-Step Plan

### 1. Create InventoryController

**File**: `app/controllers/inventory_controller.ts`

**Command**:
```bash
node ace make:controller Inventory
```

---

### 2. Implement Index Method (List Inventory)

**File**: `app/controllers/inventory_controller.ts`

**Route**: `GET /inventory`

**Purpose**: List all cards in inventory with quantities and values

**Implementation**:
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import InventoryItem from '#models/inventory_item'
import InventoryItemVariant from '#models/inventory_item_variant'

export default class InventoryController {
  async index({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()

    // Get all inventory items with variants
    const inventoryItems = await InventoryItem.query()
      .where('user_id', user.id)
      .preload('card', (q) => q.preload('set'))
      .preload('variants', (q) => {
        q.preload('variant')
      })

    // Calculate totals for each item
    const itemsWithTotals = inventoryItems.map((item) => {
      const totalQuantity = item.variants.reduce((sum, v) => sum + v.quantity, 0)
      const totalValue = item.variants.reduce((sum, v) => {
        return sum + (v.quantity * (v.variant.price || 0))
      }, 0)

      // Get most recent price update
      const lastPriceUpdate = item.variants
        .map((v) => v.lastPriceUpdateAt)
        .filter((d): d is DateTime => d !== null)
        .sort((a, b) => b.toMillis() - a.toMillis())[0]

      return {
        ...item.serialize(),
        totalQuantity,
        totalValue,
        lastPriceUpdate,
      }
    })

    return view.render('pages/inventory/index', {
      inventoryItems: itemsWithTotals,
    })
  }
}
```

**Reference**: [Pages & Views - Inventory](../../docs/09-pages-views.md#8-inventory)

---

### 3. Implement Show Method (Inventory Item Details)

**File**: `app/controllers/inventory_controller.ts`

**Route**: `GET /inventory/:inventoryItemId`

**Purpose**: Show detailed inventory item with all variants

**Implementation**:
```typescript
async show({ params, auth, view }: HttpContext) {
  const user = auth.getUserOrFail()

  const inventoryItem = await InventoryItem.query()
    .where('id', params.inventoryItemId)
    .where('user_id', user.id)
    .preload('card', (q) => q.preload('set'))
    .preload('variants', (q) => {
      q.preload('variant')
    })
    .firstOrFail()

  // Calculate total value
  const totalValue = inventoryItem.variants.reduce((sum, v) => {
    return sum + (v.quantity * (v.variant.price || 0))
  }, 0)

  return view.render('pages/inventory/show', {
    inventoryItem,
    totalValue,
  })
}
```

**Reference**: [Pages & Views - Inventory Item Details](../../docs/09-pages-views.md#9-inventory-item-details)

---

### 4. Implement Store Method (Add Card to Inventory)

**File**: `app/controllers/inventory_controller.ts`

**Route**: `POST /inventory`

**Purpose**: Add a card to inventory

**Implementation**:
```typescript
import InventoryService from '#services/InventoryService'

async store({ request, auth, response, session }: HttpContext) {
  const user = auth.getUserOrFail()
  const inventoryService = new InventoryService()

  const { card_id, notes } = request.only(['card_id', 'notes'])

  try {
    await inventoryService.addCardToInventory(user.id, card_id, notes)
    session.flash('success', 'Card added to inventory')
  } catch (error) {
    session.flash('error', `Failed to add card: ${error.message}`)
  }

  return response.redirect().back()
}
```

**Reference**: [Services - addCardToInventory()](../../docs/05-services.md#addcardtoinventoryuserid-number-cardid-number-notes-string)

---

### 5. Implement Destroy Method (Remove Card from Inventory)

**File**: `app/controllers/inventory_controller.ts`

**Route**: `DELETE /inventory/:inventoryItemId`

**Purpose**: Remove card from inventory

**Implementation**:
```typescript
async destroy({ params, auth, response, session }: HttpContext) {
  const user = auth.getUserOrFail()
  const inventoryService = new InventoryService()

  try {
    await inventoryService.removeCardFromInventory(params.inventoryItemId, user.id)
    session.flash('success', 'Card removed from inventory')
  } catch (error) {
    session.flash('error', `Failed to remove card: ${error.message}`)
  }

  return response.redirect('/inventory')
}
```

---

### 6. Implement Update Variant Quantity

**File**: `app/controllers/inventory_controller.ts`

**Route**: `PATCH /inventory/variants/:inventoryItemVariantId/quantity`

**Purpose**: Update quantity for a variant

**Implementation**:
```typescript
async updateQuantity({ params, request, auth, response }: HttpContext) {
  const user = auth.getUserOrFail()
  const inventoryService = new InventoryService()

  const { quantity } = request.only(['quantity'])

  // Validate quantity
  if (quantity < 0) {
    return response.badRequest({ error: 'Quantity must be non-negative' })
  }

  await inventoryService.updateVariantQuantity(
    params.inventoryItemVariantId,
    quantity,
    user.id
  )

  return response.json({ success: true })
}
```

**Reference**: [Services - updateVariantQuantity()](../../docs/05-services.md#updatevariantquantityinventoryitemvariantid-number-quantity-number-userid-number)

---

### 7. Implement Resync Variants

**File**: `app/controllers/inventory_controller.ts`

**Route**: `POST /inventory/:inventoryItemId/resync`

**Purpose**: Resync inventory variants based on existing card variants

**Implementation**:
```typescript
async resyncVariants({ params, auth, response, session }: HttpContext) {
  const user = auth.getUserOrFail()
  const inventoryService = new InventoryService()

  try {
    await inventoryService.resyncInventoryVariants(params.inventoryItemId, user.id)
    session.flash('success', 'Inventory variants resynced')
  } catch (error) {
    session.flash('error', `Failed to resync: ${error.message}`)
  }

  return response.redirect().back()
}
```

**Reference**: [Services - resyncInventoryVariants()](../../docs/05-services.md#resyncinventoryvariantsinventoryitemid-number-userid-number)

---

### 8. Implement Update Prices Action

**File**: `app/controllers/inventory_controller.ts`

**Route**: `POST /inventory/update-prices`

**Purpose**: Manually trigger price update for all inventory variants (JustTCG API request)

**Implementation**:
```typescript
async updatePrices({ auth, response, session }: HttpContext) {
  const user = auth.getUserOrFail()
  const inventoryService = new InventoryService()

  try {
    await inventoryService.updateInventoryPrices(user.id)
    session.flash('success', 'Prices updated successfully')
  } catch (error) {
    session.flash('error', `Failed to update prices: ${error.message}`)
  }

  return response.redirect().back()
}
```

**Reference**: [Services - updateInventoryPrices()](../../docs/05-services.md) (if exists) or [Phase 4 - Price Updates](../phase-4-data-sync/04-price-updates.md)

---

### 9. Add Routes

**File**: `start/routes.ts`

**Implementation**:
```typescript
router
  .group(() => {
    router.get('/inventory', '#controllers/inventory_controller.index')
    router.get('/inventory/:inventoryItemId', '#controllers/inventory_controller.show')
    router.post('/inventory', '#controllers/inventory_controller.store')
    router.delete('/inventory/:inventoryItemId', '#controllers/inventory_controller.destroy')
    router.patch('/inventory/variants/:inventoryItemVariantId/quantity', '#controllers/inventory_controller.updateQuantity')
    router.post('/inventory/:inventoryItemId/resync', '#controllers/inventory_controller.resyncVariants')
    router.post('/inventory/update-prices', '#controllers/inventory_controller.updatePrices')
  })
  .use(middleware.auth())
```

---

## Testing

Test inventory controller:

```typescript
// In REPL or test
import InventoryController from '#controllers/inventory_controller'

const controller = new InventoryController()

// Test index
await controller.index(mockCtx)

// Test store
await controller.store({
  ...mockCtx,
  request: {
    only: (fields) => ({ card_id: 1, notes: 'Test' }),
  },
})
```

---

## Completion Checklist

- [ ] InventoryController created
- [ ] Index method implemented
- [ ] Show method implemented
- [ ] Store method implemented
- [ ] Destroy method implemented
- [ ] Update quantity method implemented
- [ ] Resync variants method implemented
- [ ] Update prices method implemented
- [ ] All routes added
- [ ] Controller tested

