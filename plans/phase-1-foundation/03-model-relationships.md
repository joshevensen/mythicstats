# Model Relationships

## Overview

Set up all model relationships, hooks, and scopes to complete the ORM layer.

## Relationships to Configure

See [Data Models - Relationships](../../docs/04-data-models.md#relationships-summary) for complete list.

## Step-by-Step Plan

### 1. User Relationships

**File**: `app/models/user.ts`

**Add relationships**:

```typescript
@hasMany(() => TrackedGame)
declare trackedGames: HasMany<typeof TrackedGame>

@hasMany(() => TrackedSet)
declare trackedSets: HasMany<typeof TrackedSet>

@hasMany(() => InventoryItem)
declare inventoryItems: HasMany<typeof InventoryItem>
```

---

### 2. Game Relationships

**File**: `app/models/game.ts`

**Add relationships**:

```typescript
@hasMany(() => Set)
declare sets: HasMany<typeof Set>

@hasMany(() => TrackedGame)
declare trackedGames: HasMany<typeof TrackedGame>

@hasMany(() => GameEvent)
declare gameEvents: HasMany<typeof GameEvent>
```

---

### 3. Set Relationships

**File**: `app/models/set.ts`

**Add relationships**:

```typescript
@belongsTo(() => Game)
declare game: BelongsTo<typeof Game>

@hasMany(() => Card)
declare cards: HasMany<typeof Card>

@hasMany(() => TrackedSet)
declare trackedSets: HasMany<typeof TrackedSet>
```

---

### 4. Card Relationships

**File**: `app/models/card.ts`

**Add relationships**:

```typescript
@belongsTo(() => Set)
declare set: BelongsTo<typeof Set>

@hasMany(() => CardVariant)
declare variants: HasMany<typeof CardVariant>

@hasMany(() => InventoryItem)
declare inventoryItems: HasMany<typeof InventoryItem>
```

---

### 5. CardVariant Relationships

**File**: `app/models/card_variant.ts`

**Add relationships**:

```typescript
@belongsTo(() => Card)
declare card: BelongsTo<typeof Card>

@hasMany(() => InventoryItemVariant)
declare inventoryItemVariants: HasMany<typeof InventoryItemVariant>
```

---

### 6. TrackedGame Relationships

**File**: `app/models/tracked_game.ts`

**Add relationships**:

```typescript
@belongsTo(() => User)
declare user: BelongsTo<typeof User>

@belongsTo(() => Game)
declare game: BelongsTo<typeof Game>
```

---

### 7. TrackedSet Relationships

**File**: `app/models/tracked_set.ts`

**Add relationships**:

```typescript
@belongsTo(() => User)
declare user: BelongsTo<typeof User>

@belongsTo(() => Set)
declare set: BelongsTo<typeof Set>
```

---

### 8. InventoryItem Relationships

**File**: `app/models/inventory_item.ts`

**Add relationships**:

```typescript
@belongsTo(() => User)
declare user: BelongsTo<typeof User>

@belongsTo(() => Card)
declare card: BelongsTo<typeof Card>

@hasMany(() => InventoryItemVariant)
declare variants: HasMany<typeof InventoryItemVariant>
```

---

### 9. InventoryItemVariant Relationships

**File**: `app/models/inventory_item_variant.ts`

**Add relationships**:

```typescript
@belongsTo(() => InventoryItem)
declare inventoryItem: BelongsTo<typeof InventoryItem>

@belongsTo(() => CardVariant)
declare variant: BelongsTo<typeof CardVariant>
```

---

### 10. GameEvent Relationships

**File**: `app/models/game_event.ts`

**Add relationships**:

```typescript
@belongsTo(() => Game)
declare game: BelongsTo<typeof Game>
```

---

## Model Hooks

### InventoryItem Hooks

**File**: `app/models/inventory_item.ts`

**After Create Hook**:

- Automatically create `inventory_item_variants` for all existing `card_variants`
- Set initial quantity to 0

**Before Delete Hook**:

- Delete all associated `inventory_item_variants` first

**Reference**: [Data Models - Model Hooks](../../docs/04-data-models.md#model-hooks)

---

### InventoryItemVariant Hooks

**File**: `app/models/inventory_item_variant.ts`

**After Save Hook**:

- Trigger price update if quantity > 0
- Recalculate inventory item total value

**Before Delete Hook**:

- Recalculate inventory item total value

---

## Model Scopes

Add scopes as needed for common queries:

- `User.scope('withRateLimitInfo')`
- `TrackedGame.scope('active')`
- `TrackedSet.scope('needsSync')`
- `InventoryItem.scope('withValue')`
- `GameEvent.scope('active')`, `scope('upcoming')`, `scope('past')`

**Reference**: [Data Models](../../docs/04-data-models.md) for specific scope requirements.

---

## Testing Relationships

After setting up relationships, test in REPL:

```bash
node ace repl
```

```typescript
const User = await import('#models/user')
const user = await User.default.query().preload('trackedGames').first()
console.log(user.trackedGames)
```

---

## Completion Checklist

- [ ] All relationships defined
- [ ] All hooks implemented
- [ ] All scopes added
- [ ] Relationships tested in REPL
- [ ] No TypeScript errors
- [ ] Eager loading works correctly
