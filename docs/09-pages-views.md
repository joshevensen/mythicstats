# Pages & Views

## Overview

Simple CRUD-style pages for internal tool use. Focus on functionality over fancy UI.

## Page Structure

### 1. Dashboard (`/`)

**Purpose**: Overview of inventory, API status, and recent activity

**Content**:

- Inventory summary
  - Total cards in inventory
  - Total inventory value
- Tracked Games
  - List only tracked games
  - Link to `/games/:gameId`
- API status
  - Current plan
  - Monthly usage (limit, used, remaining, percentage, reset date)
  - Daily usage (limit, used, remaining, percentage, reset time)
  - Rate limit per minute
  - Last updated timestamp
- Recent activity
  - Last sync times
  - Recent price updates
  - Recent inventory changes

**Actions**: None (read-only overview)

---

### 2. Games (`/games`)

**Purpose**: List all available games

**Content**:

- List of all available games (from JustTCG)
- Indicates which games are tracked
- Shows last sets discovery time for tracked games

**Actions**:

- Track game (add to tracked_games)
- Untrack game (remove from tracked_games)
- Toggle active status
- View game details (link to game details page)

---

### 3. Game Details (`/games/:gameId`)

**Purpose**: View game information and manage sets

**Content**:

- Game information (at top)
  - Name, card count, sets count
  - Last updated
  - Tracked status and last sets discovery time
- Sets list (below game info)
  - Simple list of sets for the game
  - Columns: Name, Release Date, Card Count, Tracked Status
  - Indicates which sets are tracked
  - Shows last sync time for tracked sets

**Actions**:

- Track/untrack game
- Toggle game active status
- **Discover sets** (manual JustTCG API request - fetches available sets for this game)
- Track set (add to tracked_sets)
- Untrack set (remove from tracked_sets)
- Toggle set active status
- View set details (link to set details page)

---

### 4. Game Events (`/games/:gameId/events`)

**Purpose**: List game events

**Content**:

- Game information (at top, same as game details page)
- List of game events
  - Event type, title, dates
  - Whether it affects pricing
  - Active/upcoming/past status

**Actions**:

- Create event (link to create page)
- Edit event (link to edit page)
- Delete event
- Filter by type, date range

---

### 4a. Create Game Event (`/games/:gameId/events/create`)

**Purpose**: Create a new game event

**Content**:

- Game information (at top)
- Event creation form
  - Event type (dropdown)
  - Title (text input)
  - Description (textarea)
  - Start date (date input)
  - End date (date input)
  - Affects pricing (checkbox)

**Actions**:

- Submit form (create event)
- Cancel (return to events list)

---

### 4b. Edit Game Event (`/games/:gameId/events/:eventId`)

**Purpose**: View and edit a game event

**Content**:

- Game information (at top)
- Event information display
- Event edit form (pre-filled)
  - Event type (dropdown)
  - Title (text input)
  - Description (textarea)
  - Start date (date input)
  - End date (date input)
  - Affects pricing (checkbox)

**Actions**:

- Submit form (update event)
- Delete event
- Cancel (return to events list)

---

### 5. Set Details (`/sets/:setId`)

**Purpose**: View set information and card summary

**Content**:

- Set information
  - Name, release date, card count
  - Game information
  - Tracked status and last sync time
- Card summary
  - Total cards in set
  - Cards synced count
  - Cards in inventory count
  - Price range (min/max) for cards in set
- Quick actions
  - Track/untrack set
  - Toggle active status
  - Manual sync (trigger sync on-demand)
  - View all cards (link to cards page)

**Actions**:

- Track/untrack set
- Toggle active status
- **Manual sync** (manual JustTCG API request - syncs card data for this set)
- View cards list

---

### 6. Cards (`/sets/:setId/cards`)

**Purpose**: View cards in a set

**Note**: This is a list view. For set information and card summary, see Set Details page.

**Content**:

- List of cards in the set
- Card details (name, number, rarity)
- Link to card details page

**Actions**:

- Search/filter cards
- View card details
- Add card to inventory (link to inventory)

---

### 7. Card Details (`/cards/:cardId`)

**Purpose**: View detailed card information

**Content**:

- Card information (name, number, rarity, details)
- All variants with pricing
  - Condition, printing, language
  - Current price
  - Price statistics (7d, 30d, 90d)
  - Price history chart
- Inventory status (if in inventory)
  - Which variants are owned
  - Quantities

**Actions**:

- Add to inventory

---

### 8. Inventory (`/inventory`)

**Purpose**: Manage card inventory

**Content**:

- List of cards in inventory
  - Card name, set
  - Total quantity across all variants
  - Total value
  - Last price update
- Expandable to show variants
  - Variant details (condition, printing)
  - Quantity per variant
  - Current price
  - Value (quantity × price)

**Actions**:

- Remove card from inventory
- Update variant quantity
- **Update prices** (manual JustTCG API request - updates prices for all inventory variants)
- Resync inventory variants (after card variants change)

---

### 9. Inventory Item Details (`/inventory/:inventoryItemId`)

**Purpose**: Detailed view of a single inventory item

**Content**:

- Card information
- All variants with quantities
- Price information per variant
- Total value calculation
- Notes (card-level and variant-level)

**Actions**:

- Update variant quantities
- Update notes
- Remove from inventory
- Resync variants

---

## Navigation Structure

```
Dashboard (/) - Includes API status
├── Games (/games)
│   ├── Game Details (/games/:gameId) - Game info + sets list
│   │   └── Set Details (/sets/:setId)
│   │       └── Cards (/sets/:setId/cards)
│   │           └── Card Details (/cards/:cardId)
│   └── Game Events (/games/:gameId/events)
│       ├── Create Event (/games/:gameId/events/create)
│       └── Edit Event (/games/:gameId/events/:eventId)
├── Inventory (/inventory)
│   └── Inventory Item Details (/inventory/:inventoryItemId)
```

## Common UI Patterns

### Lists

- Simple table format
- Sortable columns
- Basic filtering/search
- Pagination if needed

### Forms

- Standard form inputs
- Validation feedback
- Success/error messages

### Actions

- Buttons for primary actions
- Links for navigation
- Confirmation dialogs for destructive actions

### Status Indicators

- Badges for status (tracked/untracked, active/inactive)
- Color coding for rate limits (green/yellow/red)
- Timestamps for last sync/update

---

## Page-Specific Details

### Dashboard

- **Layout**: Grid of summary cards + activity list
- **Updates**: Real-time or refresh button
- **Charts**: Simple line chart for price history (if needed)

### Games/Sets/Cards Lists

- **Table columns**: Key fields only (minimal for sets list since there can be hundreds)
- **Filters**: Search by name, filter by tracked status
- **Actions**: Row-level action buttons
- **Sets list**: Keep it simple - just name, release date, card count, tracked status
- **Game Details**: Game info section at top, sets list below

### Inventory

- **Grouping**: By card, expandable to show variants
- **Calculations**: Show totals (quantity, value) prominently
- **Updates**: Inline quantity editing or modal

### Set Details

- **Layout**: Set info section + card summary section
- **Card summary**: Statistics about cards in the set (total, synced, in inventory, price range)
- **Quick actions**: Prominent buttons for track/untrack, sync

### Game Events

- **Calendar view**: Optional (simple list is fine)
- **Filtering**: By type, date range
- **Status**: Color-coded (active/upcoming/past)
- **Forms**: Separate pages for create/edit (no modals)

### Manual JustTCG API Requests

- **Game Details**: "Discover Sets" button - manually triggers sets discovery for the game
- **Set Details**: "Sync Set" button - manually triggers card data sync for the set
- **Inventory**: "Update Prices" button - manually triggers price updates for all inventory variants
- All manual requests check API rate limits before execution
- Show confirmation/status messages after requests complete

---

## Implementation Notes

- Use AdonisJS view templates (Edge templates)
- Keep styling minimal (internal tool)
- Focus on functionality and data clarity
- Mobile-friendly but desktop-optimized
- No complex animations or transitions

---

## Future Enhancements (Optional)

- Price history charts
- Inventory value trends
- Export inventory to CSV
- Bulk operations (bulk add to inventory, bulk update quantities)
