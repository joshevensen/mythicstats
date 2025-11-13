# Workflows & Processes

## Initial Setup Workflow

### 1. User Setup

1. Create user account (or use existing)
2. User is automatically set up with rate limit fields initialized (can make API calls once API key is configured)

### 2. Track Games (Discovery)

1. User manually adds games to track via UI/API
2. System stores in `tracked_games` table
3. `is_active = true` by default
4. This is for discovering available sets, not for syncing cards

### 3. Discover Sets

1. System automatically discovers sets for tracked games (background job runs weekly)
2. User can view discovered sets in the UI
3. User can then selectively track specific sets they're interested in

### 4. Track Sets (Active Sync)

1. User selects specific sets to track from discovered sets
2. System stores in `tracked_sets` table
3. `is_active = true` by default
4. This is where actual card syncing happens

### 5. Sync Cards for Tracked Sets

1. System automatically syncs cards for tracked sets (background job runs weekly)
2. User can also manually trigger a sync for a specific set on-demand
3. Cards and variants are stored/updated in the database
4. User can view synced cards in the UI

---

## Inventory Management Workflow

### Adding Cards to Inventory

1. User searches for card (by name, set, etc.)
2. User selects card and adds to inventory
3. System creates `inventory_item` record (card-level entry)
4. User specifies variant details:
   - Variant (condition + printing)
   - Quantity
   - Notes (optional, variant-specific)
5. System creates `inventory_item_variant` record linking to `card_variant`
6. System calls service method to fetch initial price and statistics (batch preferred, single lookup if needed)
7. Price and statistics are stored in `card_variants` table
8. `inventory_item_variants.last_price_update_at` is set

### Updating Inventory

1. User edits inventory:
   - Add/remove variants (add new variant entry or delete existing)
   - Update quantity for existing variant
   - Update notes (card-level or variant-level)
2. System updates `inventory_item` or `inventory_item_variant` records
3. If variant quantity changes, value is recalculated
4. If all variants removed, optionally delete `inventory_item`

### Removing from Inventory

1. User deletes inventory item or specific variant:
   - Delete variant: Remove `inventory_item_variant` record
   - Delete card: Remove `inventory_item` record (cascades to variants)
2. Price history and statistics remain in `card_variants` table

---

## Price Update Workflow

### Automatic Price Updates

1. System automatically updates prices for inventory items (background job runs hourly)
2. Prices are updated for variants that haven't been updated in the last 24 hours
3. User sees updated prices reflected in their inventory view

### Manual Price Update

1. User triggers price update for specific card variant(s) via UI
2. System fetches latest price and statistics from JustTCG API
3. Updated prices are displayed to the user
4. Price history and statistics are stored for future reference

---

## Rate Limit Management (User Perspective)

### Viewing Rate Limit Status

1. User can view current API rate limit status in the UI
2. Shows:
   - Current plan
   - Requests used vs. available (daily and monthly)
   - When limits will reset
3. System automatically tracks and updates this information

### Rate Limit Impact

1. If rate limits are reached, background jobs pause
2. System automatically resumes when limits reset
3. User may see delays in price updates or data syncing if limits are hit

---

## Game Event Workflow

### Creating Game Event

1. User creates game event via UI/API
2. User specifies:
   - Game
   - Event type (release, championship, etc.)
   - Title
   - Description (optional)
   - Start date
   - End date (optional)
   - Whether it affects pricing
3. System stores in `game_events` table

### Event-Triggered Price Updates

1. When event with `affects_pricing = true` is created:
   - Optionally trigger price update for related cards
   - Or schedule price update for event start date
2. User can manually trigger price updates based on events

### Viewing Events

1. User can view all events for a game
2. Filter by:
   - Active events
   - Upcoming events
   - Past events
   - Events that affect pricing

---

## Data Synchronization (User Perspective)

### Sets Discovery

1. System automatically discovers new sets for tracked games (weekly)
2. User can view newly discovered sets in the UI
3. User can track sets they're interested in

### Card Sync

1. System automatically syncs cards for tracked sets (weekly)
2. User can manually trigger a sync for a specific set if needed
3. Cards become available in the system after sync completes
4. User can view sync status and last sync time

### Sync Status

1. User can see when sets were last synced
2. User can see sync status (in progress, completed, failed)
3. If sync fails, user can retry manually
