# Database Migrations

## Overview
Create all database migrations in the correct order to establish the complete database schema.

## Migration Order

The migrations must be created in this specific order due to foreign key dependencies:

1. `users` (extend existing table)
2. `games`
3. `game_events` (requires games)
4. `sets` (requires games)
5. `cards` (requires sets)
6. `card_variants` (requires cards)
7. `tracked_games` (requires users, games)
8. `tracked_sets` (requires users, sets)
9. `inventory_items` (requires users, cards)
10. `inventory_item_variants` (requires inventory_items, card_variants)

## Step-by-Step Plan

### 1. Extend Users Table

**File**: `database/migrations/XXXXXX_add_rate_limiting_to_users.ts`

**Action**: Add rate limiting columns to existing `users` table

**Columns to add**:
- `api_plan` (string, nullable)
- `api_monthly_limit` (integer, nullable)
- `api_daily_limit` (integer, nullable)
- `api_rate_limit` (integer, nullable) - requests per minute
- `api_requests_used` (integer, default 0)
- `api_daily_requests_used` (integer, default 0)
- `api_requests_remaining` (integer, default 0)
- `api_daily_requests_remaining` (integer, default 0)
- `api_limit_info_updated_at` (timestamp, nullable)

**Reference**: [Database Schema - users table](../../docs/03-database-schema.md#users)

**Command**:
```bash
node ace make:migration add_rate_limiting_to_users
```

---

### 2. Create Games Migration

**File**: `database/migrations/XXXXXX_create_games_table.ts`

**Action**: Create `games` table

**Columns**:
- `id` (bigint, primary key)
- `just_tcg_game_id` (string, unique, not null)
- `name` (string, not null)
- `slug` (string, unique, nullable)
- `cards_count` (integer, nullable)
- `sets_count` (integer, nullable)
- `last_updated_at` (bigint, nullable) - Unix timestamp
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes**:
- Unique index on `just_tcg_game_id`
- Unique index on `slug` (where not null)

**Reference**: [Database Schema - games table](../../docs/03-database-schema.md#games)

**Command**:
```bash
node ace make:migration create_games_table
```

---

### 3. Create Game Events Migration

**File**: `database/migrations/XXXXXX_create_game_events_table.ts`

**Action**: Create `game_events` table

**Columns**:
- `id` (bigint, primary key)
- `game_id` (bigint, foreign key to games)
- `event_type` (string, not null) - enum: 'release', 'championship', 'tournament', 'ban', 'other'
- `title` (string, not null)
- `description` (text, nullable)
- `start_date` (date, nullable)
- `end_date` (date, nullable)
- `affects_pricing` (boolean, default false)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes**:
- Index on `game_id`
- Index on `event_type`
- Index on `start_date`
- Index on `end_date`

**Reference**: [Database Schema - game_events table](../../docs/03-database-schema.md#game_events)

**Command**:
```bash
node ace make:migration create_game_events_table
```

---

### 4. Create Sets Migration

**File**: `database/migrations/XXXXXX_create_sets_table.ts`

**Action**: Create `sets` table

**Columns**:
- `id` (bigint, primary key)
- `game_id` (bigint, foreign key to games)
- `just_tcg_set_id` (string, unique, not null)
- `name` (string, not null)
- `slug` (string, nullable)
- `release_date` (date, nullable)
- `cards_count` (integer, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes**:
- Unique index on `just_tcg_set_id`
- Index on `game_id`
- Index on `release_date`

**Reference**: [Database Schema - sets table](../../docs/03-database-schema.md#sets)

**Command**:
```bash
node ace make:migration create_sets_table
```

---

### 5. Create Cards Migration

**File**: `database/migrations/XXXXXX_create_cards_table.ts`

**Action**: Create `cards` table

**Columns**:
- `id` (bigint, primary key)
- `set_id` (bigint, foreign key to sets)
- `just_tcg_card_id` (string, unique, not null)
- `name` (string, not null)
- `number` (string, nullable)
- `rarity` (string, nullable)
- `details` (jsonb, nullable)
- `tcgplayer_id` (string, nullable)
- `mtgjson_id` (string, nullable)
- `scryfall_id` (string, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes**:
- Unique index on `just_tcg_card_id`
- Index on `set_id`
- Index on `name`
- Index on `number`

**Reference**: [Database Schema - cards table](../../docs/03-database-schema.md#cards)

**Command**:
```bash
node ace make:migration create_cards_table
```

---

### 6. Create Card Variants Migration

**File**: `database/migrations/XXXXXX_create_card_variants_table.ts`

**Action**: Create `card_variants` table with all pricing and statistics fields

**Columns**: (See full list in database schema)

**Key columns**:
- `id` (bigint, primary key)
- `card_id` (bigint, foreign key to cards)
- `just_tcg_variant_id` (string, unique, not null)
- `condition`, `printing`, `language` (strings)
- `price`, `currency` (decimal, string)
- `last_updated` (bigint) - Unix timestamp
- All price statistics fields (7d, 30d, 90d, all-time)
- `price_history_7d`, `price_history_30d` (jsonb)

**Indexes**:
- Unique index on `just_tcg_variant_id`
- Index on `card_id`
- Composite index on `(card_id, condition, printing, language)`

**Reference**: [Database Schema - card_variants table](../../docs/03-database-schema.md#card_variants)

**Command**:
```bash
node ace make:migration create_card_variants_table
```

---

### 7. Create Tracked Games Migration

**File**: `database/migrations/XXXXXX_create_tracked_games_table.ts`

**Action**: Create `tracked_games` pivot table

**Columns**:
- `id` (bigint, primary key)
- `user_id` (bigint, foreign key to users)
- `game_id` (bigint, foreign key to games)
- `is_active` (boolean, default true)
- `last_sets_discovery_at` (timestamp, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes**:
- Unique composite index on `(user_id, game_id)`
- Index on `is_active`

**Reference**: [Database Schema - tracked_games table](../../docs/03-database-schema.md#tracked_games)

**Command**:
```bash
node ace make:migration create_tracked_games_table
```

---

### 8. Create Tracked Sets Migration

**File**: `database/migrations/XXXXXX_create_tracked_sets_table.ts`

**Action**: Create `tracked_sets` pivot table

**Columns**:
- `id` (bigint, primary key)
- `user_id` (bigint, foreign key to users)
- `set_id` (bigint, foreign key to sets)
- `is_active` (boolean, default true)
- `last_sync_at` (timestamp, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes**:
- Unique composite index on `(user_id, set_id)`
- Index on `is_active`
- Index on `last_sync_at`

**Reference**: [Database Schema - tracked_sets table](../../docs/03-database-schema.md#tracked_sets)

**Command**:
```bash
node ace make:migration create_tracked_sets_table
```

---

### 9. Create Inventory Items Migration

**File**: `database/migrations/XXXXXX_create_inventory_items_table.ts`

**Action**: Create `inventory_items` table (card-level inventory)

**Columns**:
- `id` (bigint, primary key)
- `user_id` (bigint, foreign key to users)
- `card_id` (bigint, foreign key to cards)
- `notes` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes**:
- Unique composite index on `(user_id, card_id)`
- Index on `user_id`
- Index on `card_id`

**Reference**: [Database Schema - inventory_items table](../../docs/03-database-schema.md#inventory_items)

**Command**:
```bash
node ace make:migration create_inventory_items_table
```

---

### 10. Create Inventory Item Variants Migration

**File**: `database/migrations/XXXXXX_create_inventory_item_variants_table.ts`

**Action**: Create `inventory_item_variants` table (variant-level inventory)

**Columns**:
- `id` (bigint, primary key)
- `inventory_item_id` (bigint, foreign key to inventory_items)
- `variant_id` (bigint, foreign key to card_variants)
- `quantity` (integer, default 0)
- `notes` (text, nullable)
- `last_price_update_at` (timestamp, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes**:
- Composite index on `(inventory_item_id, variant_id)`
- Index on `variant_id`
- Index on `last_price_update_at`

**Reference**: [Database Schema - inventory_item_variants table](../../docs/03-database-schema.md#inventory_item_variants)

**Command**:
```bash
node ace make:migration create_inventory_item_variants_table
```

---

## Testing

After creating all migrations:

1. **Check migration status**:
   ```bash
   node ace migration:status
   ```

2. **Run migrations**:
   ```bash
   node ace migration:run
   ```

3. **Verify tables created**:
   - Check PostgreSQL: `\dt` in psql
   - Verify all foreign keys are set up correctly
   - Verify all indexes are created

4. **Test rollback** (optional):
   ```bash
   node ace migration:rollback
   node ace migration:run
   ```

## Completion Checklist

- [ ] All 10 migrations created
- [ ] Migrations follow correct order
- [ ] All foreign keys defined
- [ ] All indexes created
- [ ] All columns have correct types
- [ ] Migrations run successfully
- [ ] No errors in migration output

