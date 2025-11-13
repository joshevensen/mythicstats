# Lucid Models

## Overview

Create all Lucid ORM models with proper types, relationships, and methods.

## Models to Create

1. Update `User` model
2. `Game` model
3. `Set` model
4. `Card` model
5. `CardVariant` model
6. `TrackedGame` model
7. `TrackedSet` model
8. `InventoryItem` model
9. `InventoryItemVariant` model
10. `GameEvent` model

## Step-by-Step Plan

### 1. Update User Model

**File**: `app/models/user.ts` (already exists, extend it)

**Add fields**:

- `apiPlan`, `apiMonthlyLimit`, `apiDailyLimit`, `apiRateLimit`
- `apiRequestsUsed`, `apiDailyRequestsUsed`
- `apiRequestsRemaining`, `apiDailyRequestsRemaining`
- `apiLimitInfoUpdatedAt`

**Add methods**:

- `canMakeApiRequest()` - Check if requests remaining > 0
- `updateRateLimitInfo(usage)` - Update from SDK response
- `hasExtraRequests()` - Check if near end of month with extra requests

**Reference**: [Data Models - User](../../docs/04-data-models.md#user-model)

**Commands**:

```bash
# Model already exists, just edit it
# No command needed
```

---

### 2. Create Game Model

**File**: `app/models/game.ts`

**Fields**: All columns from games table

**Relationships**:

- `hasMany Set`
- `hasMany TrackedGame`
- `hasMany GameEvent`

**Methods**:

- `findByJustTcgId(justTcgId)`
- `findOrCreateByJustTcgId(justTcgData)`

**Reference**: [Data Models - Game](../../docs/04-data-models.md#game-model)

**Command**:

```bash
node ace make:model Game
```

---

### 3. Create Set Model

**File**: `app/models/set.ts`

**Fields**: All columns from sets table

**Relationships**:

- `belongsTo Game`
- `hasMany Card`
- `hasMany TrackedSet`

**Methods**:

- `findByJustTcgId(justTcgId)`
- `findOrCreateByJustTcgId(justTcgData, gameId)`

**Reference**: [Data Models - Set](../../docs/04-data-models.md#set-model)

**Command**:

```bash
node ace make:model Set
```

---

### 4. Create Card Model

**File**: `app/models/card.ts`

**Fields**: All columns from cards table

**Relationships**:

- `belongsTo Set`
- `hasMany CardVariant`
- `hasMany InventoryItem`

**Methods**:

- `findByJustTcgId(justTcgId)`
- `findOrCreateByJustTcgId(justTcgData, setId)`

**Reference**: [Data Models - Card](../../docs/04-data-models.md#card-model)

**Command**:

```bash
node ace make:model Card
```

---

### 5. Create CardVariant Model

**File**: `app/models/card_variant.ts`

**Fields**: All columns from card_variants table (many fields!)

**Relationships**:

- `belongsTo Card`
- `hasMany InventoryItemVariant`

**Methods**:

- `findByJustTcgId(justTcgId)`
- `findOrCreateByJustTcgId(justTcgData, cardId)`
- `getPriceHistory(period)` - Access price history JSONB
- `getPriceStatistics(period)` - Get stats for period

**Reference**: [Data Models - CardVariant](../../docs/04-data-models.md#cardvariant-model)

**Command**:

```bash
node ace make:model CardVariant
```

---

### 6. Create TrackedGame Model

**File**: `app/models/tracked_game.ts`

**Fields**: All columns from tracked_games table

**Relationships**:

- `belongsTo User`
- `belongsTo Game`

**Methods**:

- `needsDiscovery()` - Check if discovery needed
- `markDiscoveryComplete()` - Update timestamp

**Reference**: [Data Models - TrackedGame](../../docs/04-data-models.md#trackedgame-model)

**Command**:

```bash
node ace make:model TrackedGame
```

---

### 7. Create TrackedSet Model

**File**: `app/models/tracked_set.ts`

**Fields**: All columns from tracked_sets table

**Relationships**:

- `belongsTo User`
- `belongsTo Set`

**Methods**:

- `needsSync()` - Check if sync needed
- `markSynced()` - Update timestamp

**Reference**: [Data Models - TrackedSet](../../docs/04-data-models.md#trackedset-model)

**Command**:

```bash
node ace make:model TrackedSet
```

---

### 8. Create InventoryItem Model

**File**: `app/models/inventory_item.ts`

**Fields**: All columns from inventory_items table

**Relationships**:

- `belongsTo User`
- `belongsTo Card`
- `hasMany InventoryItemVariant`

**Methods**:

- `getTotalQuantity()` - Sum of all variant quantities
- `getTotalValue()` - Calculate total value
- `recalculateValue()` - Update cached value

**Reference**: [Data Models - InventoryItem](../../docs/04-data-models.md#inventoryitem-model)

**Command**:

```bash
node ace make:model InventoryItem
```

---

### 9. Create InventoryItemVariant Model

**File**: `app/models/inventory_item_variant.ts`

**Fields**: All columns from inventory_item_variants table

**Relationships**:

- `belongsTo InventoryItem`
- `belongsTo CardVariant`

**Methods**:

- `getValue()` - quantity × variant.price
- `updatePrice()` - Trigger price update

**Reference**: [Data Models - InventoryItemVariant](../../docs/04-data-models.md#inventoryitemvariant-model)

**Command**:

```bash
node ace make:model InventoryItemVariant
```

---

### 10. Create GameEvent Model

**File**: `app/models/game_event.ts`

**Fields**: All columns from game_events table

**Relationships**:

- `belongsTo Game`

**Methods**:

- `isActive()` - Check if event is currently active
- `isUpcoming()` - Check if event is in the future
- `isPast()` - Check if event has ended

**Reference**: [Data Models - GameEvent](../../docs/04-data-models.md#gameevent-model)

**Command**:

```bash
node ace make:model GameEvent
```

---

## Validation Rules

Add validation rules to each model as specified in [Data Models](../../docs/04-data-models.md#validation-rules).

## Completion Checklist

- [ ] All 10 models created
- [ ] All fields properly typed
- [ ] All relationships defined
- [ ] All methods implemented
- [ ] Validation rules added
- [ ] Models compile without errors
- [ ] Can create instances in REPL/test
