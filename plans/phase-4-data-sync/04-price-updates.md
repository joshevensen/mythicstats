# Price Updates

## Overview
Implement price update logic for inventory variants, prioritizing inventory items and using batch operations.

## Step-by-Step Plan

### 1. Review Price Update Requirements

**Key Points**:
- Update prices for inventory variants
- Prioritize inventory items (update more frequently)
- Use batch operations (getCardsBatch)
- Update `inventory_item_variants.last_price_update_at`

**Reference**: [Services - getCardsBatch()](../../docs/05-services.md#getcardsbatchjusttcgids-string)

---

### 2. Implement Price Update Query

**File**: `app/models/inventory_item_variant.ts`

**Scope**: `needsPriceUpdate()`

**Implementation**:
```typescript
static needsPriceUpdate() {
  return this.query()
    .where((query) => {
      query
        .whereNull('last_price_update_at')
        .orWhere('last_price_update_at', '<', DateTime.now().minus({ hours: 24 }))
    })
}
```

**Reference**: [Data Models - InventoryItemVariant](../../docs/04-data-models.md#9-inventoryitemvariant-model)

---

### 3. Implement Batch Price Update Logic

**File**: `app/services/InventoryService.ts` or create `app/services/PriceUpdateService.ts`

**Method**: `updateInventoryPrices(userId)`

**Implementation**:
```typescript
async updateInventoryPrices(userId: number): Promise<void> {
  const User = await import('#models/user')
  const user = await User.default.findOrFail(userId)
  
  const justTcgService = new JustTCGService(user)
  
  // Get inventory variants needing price updates
  const variants = await InventoryItemVariant.query()
    .whereHas('inventoryItem', (query) => {
      query.where('user_id', userId)
    })
    .where((query) => {
      query
        .whereNull('last_price_update_at')
        .orWhere('last_price_update_at', '<', DateTime.now().minus({ hours: 24 }))
    })
    .preload('variant')

  // Collect JustTCG variant IDs
  const justTcgIds = variants
    .map((iv) => iv.variant.justTcgVariantId)
    .filter((id): id is string => id !== null)

  if (justTcgIds.length === 0) {
    return // No updates needed
  }

  // Determine batch size
  const batchSize = user.apiPlan === 'Free Tier' ? 20 : 100

  // Process in batches
  for (let i = 0; i < justTcgIds.length; i += batchSize) {
    const batch = justTcgIds.slice(i, i + batchSize)

    // Fetch prices for batch
    await justTcgService.getCardsBatch(batch)

    // Update last_price_update_at for variants in this batch
    const variantIds = variants
      .filter((iv) => batch.includes(iv.variant.justTcgVariantId))
      .map((iv) => iv.id)

    await InventoryItemVariant.query()
      .whereIn('id', variantIds)
      .update({ last_price_update_at: DateTime.now() })
  }
}
```

**Reference**: [Services - InventoryService](../../docs/05-services.md#3-inventoryservice)

---

### 4. Integrate with UpdateInventoryPricesProcessor

**File**: `app/jobs/processors/update_inventory_prices_processor.ts`

**Action**: Use service method or implement directly

**Implementation**: Already done in [Phase 3 - Job Processors](../phase-3-job-system/02-job-processors.md#5-create-updateinventorypricesprocessor)

---

### 5. Handle Price Update Edge Cases

**Scenarios**:
- No inventory variants need updates
- Variant not found in JustTCG
- Price update fails for some variants
- Rate limits during batch updates

**Handling**:
- No updates: Return early
- Not found: Log error, continue with other variants
- Partial failure: Continue with remaining batches
- Rate limits: Handled by base processor

---

### 6. Add Manual Price Update Method

**File**: `app/services/InventoryService.ts`

**Method**: `updatePricesForInventory(userId, inventoryItemId?)`

**Purpose**: Manual price update (on-demand from controller)

**Implementation**:
```typescript
async updatePricesForInventory(userId: number, inventoryItemId?: number): Promise<void> {
  const User = await import('#models/user')
  const user = await User.default.findOrFail(userId)
  
  const justTcgService = new JustTCGService(user)
  
  // Build query
  let query = InventoryItemVariant.query()
    .whereHas('inventoryItem', (q) => q.where('user_id', userId))

  // Filter by inventory item if specified
  if (inventoryItemId) {
    query = query.where('inventory_item_id', inventoryItemId)
  }

  // Get variants
  const variants = await query.preload('variant')

  // Collect JustTCG IDs and batch update
  // ... same as updateInventoryPrices()
}
```

---

## Testing

Test price updates:

```typescript
// In REPL
const User = await import('#models/user')
const InventoryService = await import('#services/InventoryService')

const user = await User.default.first()
const inventoryService = new InventoryService.default()

// Update prices for all inventory
await inventoryService.updateInventoryPrices(user.id)

// Verify prices updated
const InventoryItemVariant = await import('#models/inventory_item_variant')
const variants = await InventoryItemVariant.default.query()
  .whereNotNull('last_price_update_at')
console.log('Variants with updated prices:', variants.length)
```

---

## Completion Checklist

- [ ] Price update query implemented
- [ ] Batch price update logic implemented
- [ ] Updates inventory_item_variants.last_price_update_at
- [ ] Prioritizes inventory items
- [ ] Handles edge cases
- [ ] Works with UpdateInventoryPricesProcessor
- [ ] Manual price update method available
- [ ] Price updates tested

