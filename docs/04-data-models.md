# Data Models & Relationships

## Overview
This document defines the Lucid ORM models (application layer). For database table structure, columns, types, and indexes, see [Database Schema](./03-database-schema.md).

**Note**: Field definitions are not duplicated here. Refer to the schema document for complete column specifications.

---

## Lucid Models

### 1. User Model (`app/models/user.ts`)
Extend existing user model with rate limiting.

**Reference**: [Database Schema - users table](./03-database-schema.md#1-users)

**Relations**:
- `hasMany` TrackedGame
- `hasMany` TrackedSet
- `hasMany` InventoryItem

**Methods**:
- `canMakeApiRequest()` - Check if API can be accessed (remaining > 0 for both daily and monthly)
- `canMakeApiRequest(count: integer)` - Check if can make N requests
- `updateRateLimitInfo(usage)` - Update rate limit info from SDK response `usage` object (SDK transforms `_metadata` to `usage`)
- `hasExtraRequests()` - Check if has extra requests available (e.g., > 20 remaining)
- `getDailyResetTime()` - Calculate when daily limit resets (midnight UTC)
- `getMonthlyResetTime()` - Calculate when monthly limit resets (based on plan)
- `isNearLimit()` - Check if close to limit (e.g., < 10 remaining)
- `requestsRemainingPercentage()` - Get percentage of requests remaining

---

### 2. TrackedGame Model (`app/models/tracked_game.ts`)
Watch list for games - used for discovering available sets (not for syncing cards).

**Reference**: [Database Schema - tracked_games table](./03-database-schema.md#7-tracked_games)

**Relations**:
- `belongsTo` User
- `belongsTo` Game

**Methods**:
- `needsDiscovery()` - Check if sets discovery is needed
- `markDiscoveryComplete()` - Update `lastSetsDiscoveryAt`

**Scopes**:
- `byUser(userId)` - Filter by user
- `active()` - Only active tracked games

---

### 3. Game Model (`app/models/game.ts`)

**Reference**: [Database Schema - games table](./03-database-schema.md#2-games)

**Relations**:
- `hasMany` TrackedGame
- `hasMany` Set
- `hasMany` GameEvent

**Methods**:
- `syncFromJustTCG(data)` - Update from API response

---

### 4. Set Model (`app/models/set.ts`)

**Reference**: [Database Schema - sets table](./03-database-schema.md#4-sets)

**Relations**:
- `belongsTo` Game
- `hasMany` TrackedSet
- `hasMany` Card

**Methods**:
- `syncFromJustTCG(data)` - Update from API response

---

### 5. TrackedSet Model (`app/models/tracked_set.ts`)
Pivot table linking users to sets they want to actively sync.

**Reference**: [Database Schema - tracked_sets table](./03-database-schema.md#8-tracked_sets)

**Relations**:
- `belongsTo` User
- `belongsTo` Set

**Methods**:
- `needsSync()` - Check if sync is needed
- `markSynced()` - Update `lastSyncAt`

**Scopes**:
- `byUser(userId)` - Filter by user
- `active()` - Only active tracked sets
- `needsSync()` - Sets needing sync (by lastSyncAt)

---

### 6. Card Model (`app/models/card.ts`)
Base card information (without pricing - pricing is in variants).

**Reference**: [Database Schema - cards table](./03-database-schema.md#5-cards)

**Relations**:
- `belongsTo` Set
- `hasMany` CardVariant
- `hasMany` InventoryItem

**Methods**:
- `syncFromJustTCG(data)` - Update from API response
- `variantsForCondition(condition, printing)` - Get variants matching condition/printing
- `latestPrice(condition?, printing?)` - Get most recent price for variant(s)

---

### 7. CardVariant Model (`app/models/card_variant.ts`)
Card variant with pricing information and statistics (from JustTCG variants array).

**Reference**: [Database Schema - card_variants table](./03-database-schema.md#6-card_variants)

**Relations**:
- `belongsTo` Card
- `hasMany` InventoryItemVariant

**Methods**:
- `syncFromJustTCG(data)` - Update from API response (maps all statistics fields)
- `getPriceHistory7d()` - Get formatted 7-day price history
- `getPriceHistory30d()` - Get formatted 30-day price history
- `isPriceIncreasing()` - Check if price trend is positive (7d or 30d)
- `getVolatility()` - Get price volatility indicator (using COV)
- `isNearAllTimeHigh()` - Check if price is near all-time high
- `isNearAllTimeLow()` - Check if price is near all-time low
- `getPricePosition()` - Get current price position in range (30d or 90d)

**Scopes**:
- `byCondition(condition)` - Filter by condition
- `byPrinting(printing)` - Filter by printing
- `needsPriceUpdate()` - Variants needing price updates
- `priceIncreasing()` - Variants with positive price trends
- `highVolatility()` - Variants with high price volatility
- `recentlyUpdated()` - Variants updated recently

---

### 8. InventoryItem Model (`app/models/inventory_item.ts`)
Card-level inventory entry (tracks which cards you own).

**Reference**: [Database Schema - inventory_items table](./03-database-schema.md#9-inventory_items)

**Relations**:
- `belongsTo` User
- `belongsTo` Card
- `hasMany` InventoryItemVariant

**Methods**:
- `totalQuantity()` - Sum of all variant quantities
- `totalValue()` - Calculate total value across all variants
- `variants()` - Get all variant entries
- `hasVariant(variantId)` - Check if specific variant is owned

**Scopes**:
- `byUser(userId)` - Filter by user
- `byCard(cardId)` - Filter by card

---

### 9. InventoryItemVariant Model (`app/models/inventory_item_variant.ts`)
Variant-level inventory details (specific variants with quantities).

**Reference**: [Database Schema - inventory_item_variants table](./03-database-schema.md#10-inventory_item_variants)

**Relations**:
- `belongsTo` InventoryItem
- `belongsTo` CardVariant

**Methods**:
- `needsPriceUpdate()` - Check if price update needed
- `updatePrice()` - Update variant price and timestamp
- `value()` - Calculate value (quantity × variant price)
- `variantPrice()` - Get current price from linked variant

**Scopes**:
- `needsPriceUpdate()` - Variants needing price updates
- `byInventoryItem(inventoryItemId)` - Filter by inventory item
- `byVariant(variantId)` - Filter by variant

---

### 10. GameEvent Model (`app/models/game_event.ts`)

**Reference**: [Database Schema - game_events table](./03-database-schema.md#3-game_events)

**Relations**:
- `belongsTo` Game

**Methods**:
- `isActive()` - Check if event is currently active
- `isUpcoming()` - Check if event is in the future
- `shouldTriggerPriceUpdate()` - Check if event affects pricing

**Scopes**:
- `active()` - Currently active events
- `upcoming()` - Future events
- `affectsPricing()` - Events that affect pricing

---

## Model Relationships Summary

```
User
  ├── hasMany TrackedGame
  ├── hasMany TrackedSet
  └── hasMany InventoryItem

TrackedGame
  ├── belongsTo User
  └── belongsTo Game

Game
  ├── hasMany TrackedGame
  ├── hasMany Set
  └── hasMany GameEvent

Set
  ├── belongsTo Game
  ├── hasMany TrackedSet
  └── hasMany Card

TrackedSet
  ├── belongsTo User
  └── belongsTo Set

Card
  ├── belongsTo Set
  ├── hasMany CardVariant
  └── hasMany InventoryItem

CardVariant
  ├── belongsTo Card
  └── hasMany InventoryItemVariant

InventoryItem
  ├── belongsTo User
  ├── belongsTo Card
  └── hasMany InventoryItemVariant

InventoryItemVariant
  ├── belongsTo InventoryItem
  └── belongsTo CardVariant

GameEvent
  └── belongsTo Game
```

---

## Model Hooks

### User Model
- `beforeSave` - Validate rate limit timestamp

### Card Model
- `afterCreate` - Optionally fetch initial price
- `afterUpdate` - Track changes

### InventoryItem Model
- `afterCreate` - Automatically create `inventory_item_variants` for all existing `card_variants` (quantity 0)
- `afterUpdate` - Recalculate total value if variants change
- `beforeDelete` - Delete all associated `inventory_item_variants` first

### InventoryItemVariant Model
- `afterCreate` - Trigger price update job for this variant
- `afterUpdate` - If quantity changes, update inventory item value
- `beforeDelete` - Check if last variant, optionally delete inventory item

### CardVariant Model
- `afterUpdate` - If price changed, update statistics and price history
- `afterCreate` - Initialize price history if available

---

## Validation Rules

### User
- `apiPlan` - Optional, must be valid plan name if set
- `apiMonthlyLimit`, `apiDailyLimit`, `apiRateLimit` - Optional, must be positive integers if set
- `apiRequestsUsed`, `apiDailyRequestsUsed` - Optional, must be non-negative integers if set
- `apiRequestsRemaining`, `apiDailyRequestsRemaining` - Optional, must be non-negative integers if set
- `apiLimitInfoUpdatedAt` - Optional, must be past or current timestamp if set

### TrackedGame
- `userId` - Required
- `gameId` - Required
- Unique combination of `userId` and `gameId`

### TrackedSet
- `userId` - Required
- `setId` - Required
- Unique combination of `userId` and `setId`

### Game
- `justTcgGameId` - Required, unique
- `name` - Required

### Set
- `justTcgSetId` - Required, unique
- `gameId` - Required
- `name` - Required

### Card
- `justTcgCardId` - Required, unique
- `setId` - Required
- `name` - Required

### CardVariant
- `justTcgVariantId` - Required, unique
- `cardId` - Required
- `condition` - Required
- `price` - Required, min: 0
- `currency` - Required, default: "USD"
- `lastUpdated` - Optional (Unix timestamp from JustTCG)
- All statistics fields (24hr, 7d, 30d, 90d, 1y, all-time) - Optional/nullable
- `priceHistory7d` and `priceHistory30d` - Optional JSON arrays
- Price change percentages can be negative (for price decreases)
- `priceRelativeTo30dRange` and `priceRelativeTo90dRange` - Must be between 0 and 1 if set

### InventoryItem
- `userId` - Required
- `cardId` - Required
- Unique combination of `userId` and `cardId`

### InventoryItemVariant
- `inventoryItemId` - Required
- `variantId` - Required
- `quantity` - Required, min: 1
- Unique combination of `inventoryItemId` and `variantId`

### GameEvent
- `gameId` - Required
- `eventType` - Required, enum
- `title` - Required
- `startDate` - Required
- `endDate` - Must be after `startDate` if provided
