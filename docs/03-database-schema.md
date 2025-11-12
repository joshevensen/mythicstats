# Database Schema Design

## Tables

### 1. `users`
**Purpose**: Store user information and API rate limit status

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Primary key |
| `email` | string | User email (unique) |
| `password` | string | Hashed password |
| `name` | string | User name |
| **API Rate Limit Information** | | |
| `api_plan` | string (nullable) | Current API plan (e.g., "Free Tier", "Starter", "Professional", "Enterprise") |
| `api_monthly_limit` | integer (nullable) | Monthly request limit |
| `api_daily_limit` | integer (nullable) | Daily request limit |
| `api_rate_limit` | integer (nullable) | Per minute rate limit |
| `api_requests_used` | integer (nullable) | Monthly requests used |
| `api_daily_requests_used` | integer (nullable) | Daily requests used |
| `api_requests_remaining` | integer (nullable) | Monthly requests remaining |
| `api_daily_requests_remaining` | integer (nullable) | Daily requests remaining |
| `api_limit_info_updated_at` | timestamp (nullable) | When rate limit info was last updated from API response |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Record update time |

**Notes**:
- Rate limit information is updated from SDK response `usage` object (SDK transforms API `_metadata` to `usage`) in every JustTCG API response
- Jobs check `api_requests_remaining > 0` and `api_daily_requests_remaining > 0` before making requests
- When limits are exhausted, jobs wait until reset:
  - Daily: Resets at midnight (00:00) UTC
  - Monthly: Resets based on plan (free = day of month account created, paid = billing cycle start)
- Can use extra requests intelligently (e.g., pull sets for tracked games when requests are available)
- `api_limit_info_updated_at` helps determine if info is stale and needs refresh

---

### 2. `games`
**Purpose**: Store game data from JustTCG

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Primary key |
| `just_tcg_game_id` | string | JustTCG's game identifier (unique) |
| `name` | string | Game name |
| `cards_count` | integer (nullable) | Number of cards in the game |
| `sets_count` | integer (nullable) | Number of sets in the game |
| `last_updated_at` | timestamp | Last update from JustTCG (Unix timestamp) |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Record update time |

**Indexes**:
- Unique index on `just_tcg_game_id`

---

### 3. `game_events`
**Purpose**: Store game events that affect card prices

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Primary key |
| `game_id` | bigint (FK) | Reference to `games.id` |
| `event_type` | string | Type of event (e.g., "release", "championship", "tournament", "ban_list") |
| `title` | string | Event title/name |
| `description` | text (nullable) | Event description |
| `start_date` | date | Event start date |
| `end_date` | date (nullable) | Event end date (if applicable) |
| `affects_pricing` | boolean | Whether this event affects card pricing |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Record update time |

**Indexes**:
- Index on `game_id`
- Index on `start_date`
- Index on `affects_pricing`

---

### 4. `sets`
**Purpose**: Store set/expansion data from JustTCG

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Primary key |
| `game_id` | bigint (FK) | Reference to `games.id` |
| `just_tcg_set_id` | string | JustTCG's set identifier (unique) |
| `name` | string | Set name |
| `cards_count` | integer (nullable) | Number of cards in the set |
| `release_date` | date (nullable) | Set release date |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Record update time |

**Indexes**:
- Index on `game_id`
- Unique index on `just_tcg_set_id`

---

### 5. `cards`
**Purpose**: Store base card data from JustTCG (card info without pricing)

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Primary key |
| `set_id` | bigint (FK) | Reference to `sets.id` |
| `just_tcg_card_id` | string | JustTCG's card identifier (unique) |
| `name` | string | Card name |
| `number` | string (nullable) | Card number within the set |
| `rarity` | string (nullable) | Card rarity (e.g., "Common", "Rare", "Promo") |
| `details` | text (nullable) | Additional card-specific details |
| `tcgplayer_id` | string (nullable) | TCGplayer product ID |
| `mtgjson_id` | string (nullable) | MTGJSON UUID for this card |
| `scryfall_id` | string (nullable) | Scryfall UUID for this card |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Record update time |

**Indexes**:
- Index on `set_id`
- Unique index on `just_tcg_card_id`
- Index on `tcgplayer_id` (for lookups)
- Index on `mtgjson_id` (for lookups)
- Index on `scryfall_id` (for lookups)

---

### 6. `card_variants`
**Purpose**: Store card variant data with pricing information and statistics (from JustTCG variants array)

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Primary key |
| `card_id` | bigint (FK) | Reference to `cards.id` |
| `just_tcg_variant_id` | string | JustTCG's variant identifier (unique) |
| `tcgplayer_sku_id` | string (nullable) | TCGPlayer SKU ID for this variant |
| `condition` | string | Card condition (e.g., "Near Mint", "Lightly Played", "Sealed") |
| `printing` | string (nullable) | Printing type (e.g., "Normal", "Foil", "1st Edition", "Unlimited") |
| `language` | string (nullable) | Language of the card (e.g., "English", "Japanese") |
| `price` | decimal(10,2) | Current price in USD |
| `currency` | string | Currency code (default: "USD") |
| `last_updated` | bigint (nullable) | Unix timestamp (seconds) of when price was last updated |
| **24hr & 7d Statistics** | | |
| `price_change_24hr` | decimal(10,4) (nullable) | Percentage price change over last 24 hours |
| `price_change_7d` | decimal(10,4) (nullable) | Percentage price change over last 7 days |
| `avg_price_7d` | decimal(10,2) (nullable) | Average price over last 7 days |
| `min_price_7d` | decimal(10,2) (nullable) | Minimum price in last 7 days |
| `max_price_7d` | decimal(10,2) (nullable) | Maximum price in last 7 days |
| `stddev_pop_price_7d` | decimal(10,4) (nullable) | Population standard deviation of prices over 7 days |
| `cov_price_7d` | decimal(10,4) (nullable) | Coefficient of variation (StdDev / Mean) for 7 days |
| `iqr_price_7d` | decimal(10,2) (nullable) | Interquartile range (75th - 25th percentile) for 7 days |
| `trend_slope_7d` | decimal(10,6) (nullable) | Slope of linear regression trend line for 7 days |
| `price_changes_count_7d` | integer (nullable) | Count of distinct price changes in last 7 days |
| `price_history_7d` | jsonb (nullable) | Array of historical price points over 7 days `[{p: price, t: timestamp}]` |
| **30d Statistics** | | |
| `price_change_30d` | decimal(10,4) (nullable) | Percentage price change over last 30 days |
| `avg_price_30d` | decimal(10,2) (nullable) | Average price over last 30 days |
| `min_price_30d` | decimal(10,2) (nullable) | Minimum price in last 30 days |
| `max_price_30d` | decimal(10,2) (nullable) | Maximum price in last 30 days |
| `stddev_pop_price_30d` | decimal(10,4) (nullable) | Population standard deviation of prices over 30 days |
| `cov_price_30d` | decimal(10,4) (nullable) | Coefficient of variation for 30 days |
| `iqr_price_30d` | decimal(10,2) (nullable) | Interquartile range for 30 days |
| `trend_slope_30d` | decimal(10,6) (nullable) | Price trend slope over 30 days |
| `price_changes_count_30d` | integer (nullable) | Count of distinct price changes in last 30 days |
| `price_relative_to_30d_range` | decimal(5,4) (nullable) | Current price position in 30d range (0=min, 1=max) |
| `price_history_30d` | jsonb (nullable) | Array of historical price points over 30 days |
| **90d Statistics** | | |
| `price_change_90d` | decimal(10,4) (nullable) | Percentage price change over last 90 days |
| `avg_price_90d` | decimal(10,2) (nullable) | Average price over last 90 days |
| `min_price_90d` | decimal(10,2) (nullable) | Minimum price in last 90 days |
| `max_price_90d` | decimal(10,2) (nullable) | Maximum price in last 90 days |
| `stddev_pop_price_90d` | decimal(10,4) (nullable) | Population standard deviation of prices over 90 days |
| `cov_price_90d` | decimal(10,4) (nullable) | Coefficient of variation for 90 days |
| `iqr_price_90d` | decimal(10,2) (nullable) | Interquartile range for 90 days |
| `trend_slope_90d` | decimal(10,6) (nullable) | Price trend slope over 90 days |
| `price_changes_count_90d` | integer (nullable) | Count of distinct price changes in last 90 days |
| `price_relative_to_90d_range` | decimal(5,4) (nullable) | Current price position in 90d range (0=min, 1=max) |
| **1 Year Statistics** | | |
| `min_price_1y` | decimal(10,2) (nullable) | Minimum price in last year |
| `max_price_1y` | decimal(10,2) (nullable) | Maximum price in last year |
| **All Time Statistics** | | |
| `min_price_all_time` | decimal(10,2) (nullable) | Lowest price ever recorded |
| `min_price_all_time_date` | timestamp (nullable) | ISO 8601 timestamp of all-time minimum price |
| `max_price_all_time` | decimal(10,2) (nullable) | Highest price ever recorded |
| `max_price_all_time_date` | timestamp (nullable) | ISO 8601 timestamp of all-time maximum price |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Record update time |

**Notes**:
- `price_history_7d` and `price_history_30d` are stored as JSONB arrays: `[{p: number, t: number}]`
- `last_updated` is the Unix timestamp from JustTCG API
- `last_updated_at` is converted from `last_updated` for easier querying
- All statistics fields are nullable as they may not always be available
- Price change percentages can be negative (for price decreases)

**Indexes**:
- Index on `card_id`
- Unique index on `just_tcg_variant_id`
- Index on `tcgplayer_sku_id` (for lookups)
- Composite index on `(card_id, condition, printing)` for common queries
- Index on `last_updated_at` (for finding recently updated variants)

---

### 7. `tracked_games`
**Purpose**: Watch list for games - used for discovering available sets (not for syncing cards)

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Primary key |
| `user_id` | bigint (FK) | Reference to `users.id` |
| `game_id` | bigint (FK) | Reference to `games.id` |
| `is_active` | boolean | Whether to discover sets for this game |
| `last_sets_discovery_at` | timestamp (nullable) | Last time sets list was fetched from JustTCG |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Record update time |

**Notes**:
- Used for discovering available sets via `/v1/sets?game={gameId}`
- Does NOT trigger card syncing
- When you have extra API requests, can fetch sets/cards for future reference
- Helps track new set releases

**Indexes**:
- Unique composite index on `(user_id, game_id)`
- Index on `user_id`
- Index on `game_id`

---

### 8. `tracked_sets`
**Purpose**: Pivot table linking users to sets they want to actively sync

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Primary key |
| `user_id` | bigint (FK) | Reference to `users.id` |
| `set_id` | bigint (FK) | Reference to `sets.id` |
| `is_active` | boolean | Whether to sync this set |
| `last_sync_at` | timestamp (nullable) | Last time cards were synced for this set |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Record update time |

**Notes**:
- This is where actual sync work happens
- Cards are synced only for tracked sets
- `last_sync_at` tracks when we last attempted to sync cards for this set
- Selective tracking allows focusing on specific sets (e.g., only recent MTG sets)

**Indexes**:
- Unique composite index on `(user_id, set_id)`
- Index on `user_id`
- Index on `set_id`
- Index on `last_sync_at` (for prioritizing syncs)

---

### 9. `inventory_items`
**Purpose**: Store card-level inventory entries (tracks which cards you own)

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Primary key |
| `user_id` | bigint (FK) | Reference to `users.id` |
| `card_id` | bigint (FK) | Reference to `cards.id` |
| `notes` | text (nullable) | Personal notes about this card in your collection |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Record update time |

**Notes**:
- Represents card-level ownership ("I own Lightning Bolt")
- Actual variant details (condition, printing, quantity) are stored in `inventory_item_variants`
- One inventory_item per card per user

**Indexes**:
- Unique composite index on `(user_id, card_id)` - ensures one entry per card per user
- Index on `user_id`
- Index on `card_id`

---

### 10. `inventory_item_variants`
**Purpose**: Store variant-level inventory details (specific variants with quantities)

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Primary key |
| `inventory_item_id` | bigint (FK) | Reference to `inventory_items.id` |
| `variant_id` | bigint (FK) | Reference to `card_variants.id` (for price matching) |
| `quantity` | integer | Number of copies owned of this specific variant |
| `notes` | text (nullable) | Variant-specific notes (e.g., "One is signed", "From booster box") |
| `last_price_update_at` | timestamp (nullable) | Last time price was updated for this variant |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Record update time |

**Notes**:
- Links to a specific `card_variant` for automatic price matching
- Each entry represents a specific variant (condition + printing) with quantity
- Example: "3 Near Mint Normal" and "2 Lightly Played Foil" would be separate entries

**Indexes**:
- Index on `inventory_item_id`
- Index on `variant_id`
- Index on `last_price_update_at` (for prioritizing price updates)
- Composite index on `(inventory_item_id, variant_id)` - ensures one entry per variant per inventory item

---

## Relationships

```
users (1) ──< (many) tracked_games
users (1) ──< (many) tracked_sets
users (1) ──< (many) inventory_items
games (1) ──< (many) tracked_games
games (1) ──< (many) sets
games (1) ──< (many) game_events
sets (1) ──< (many) tracked_sets
sets (1) ──< (many) cards
cards (1) ──< (many) card_variants
cards (1) ──< (many) inventory_items
inventory_items (1) ──< (many) inventory_item_variants
card_variants (1) ──< (many) inventory_item_variants
```

## Migration Order
1. `users` (extend existing)
2. `games`
3. `game_events` (requires games)
4. `sets` (requires games)
5. `cards` (requires sets)
6. `card_variants` (requires cards)
7. `tracked_games` (requires users, games)
8. `tracked_sets` (requires users, sets)
9. `inventory_items` (requires users, cards)
10. `inventory_item_variants` (requires inventory_items, card_variants)

