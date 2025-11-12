# View Templates

## Overview
Create Edge view templates for all pages in the application.

## Step-by-Step Plan

### 1. Create Base Layout Template

**File**: `resources/views/layouts/app.edge`

**Purpose**: Base layout with navigation and common structure

**Structure**:
```edge
<!DOCTYPE html>
<html>
<head>
  <title>MythicStats</title>
  @entryPointStyles('app')
</head>
<body>
  <nav>
    <a href="/">Dashboard</a>
    <a href="/games">Games</a>
    <a href="/inventory">Inventory</a>
  </nav>

  <main>
    @!section('content')
  </main>

  @entryPointScripts('app')
</main>
</body>
</html>
```

---

### 2. Create Navigation Component

**File**: `resources/views/components/nav.edge`

**Purpose**: Reusable navigation component

**Implementation**: Simple navigation links

---

### 3. Create Dashboard View

**File**: `resources/views/pages/dashboard.edge`

**Purpose**: Dashboard page with inventory summary, API status, and recent activity

**Structure**:
- Inventory summary cards
- API status section
- Recent activity list

**Reference**: [Pages & Views - Dashboard](../../docs/09-pages-views.md#1-dashboard)

---

### 4. Create Games List View

**File**: `resources/views/pages/games/index.edge`

**Purpose**: List all games

**Structure**:
- Simple table with columns: Name, Cards Count, Sets Count, Tracked Status
- Action buttons: Track/Untrack, View Details

**Reference**: [Pages & Views - Games](../../docs/09-pages-views.md#2-games)

---

### 5. Create Game Details View

**File**: `resources/views/pages/games/show.edge`

**Purpose**: Game details with sets list

**Structure**:
- Game information section (top)
- Sets list table (below)
- Action buttons: Discover Sets, Track/Untrack sets

**Reference**: [Pages & Views - Game Details](../../docs/09-pages-views.md#3-game-details)

---

### 6. Create Game Events List View

**File**: `resources/views/pages/game_events/index.edge`

**Purpose**: List game events

**Structure**:
- Game information (top)
- Events table
- Action buttons: Create, Edit, Delete

**Reference**: [Pages & Views - Game Events](../../docs/09-pages-views.md#4-game-events)

---

### 7. Create Game Event Create Form

**File**: `resources/views/pages/game_events/create.edge`

**Purpose**: Create event form

**Structure**:
- Game information (top)
- Form with fields: event type, title, description, dates, affects pricing

**Reference**: [Pages & Views - Create Game Event](../../docs/09-pages-views.md#4a-create-game-event)

---

### 8. Create Game Event Edit Form

**File**: `resources/views/pages/game_events/edit.edge`

**Purpose**: Edit event form (pre-filled)

**Structure**: Same as create form but with pre-filled values

**Reference**: [Pages & Views - Edit Game Event](../../docs/09-pages-views.md#4b-edit-game-event)

---

### 9. Create Set Details View

**File**: `resources/views/pages/sets/show.edge`

**Purpose**: Set information and card summary

**Structure**:
- Set information section
- Card summary section
- Quick action buttons

**Reference**: [Pages & Views - Set Details](../../docs/09-pages-views.md#5-set-details)

---

### 10. Create Cards List View

**File**: `resources/views/pages/cards/index.edge`

**Purpose**: List cards in a set

**Structure**:
- Simple table: Name, Number, Rarity
- Search/filter input
- Link to card details

**Reference**: [Pages & Views - Cards](../../docs/09-pages-views.md#6-cards)

---

### 11. Create Card Details View

**File**: `resources/views/pages/cards/show.edge`

**Purpose**: Detailed card view with variants

**Structure**:
- Card information
- Variants table with pricing
- Inventory status section

**Reference**: [Pages & Views - Card Details](../../docs/09-pages-views.md#7-card-details)

---

### 12. Create Inventory List View

**File**: `resources/views/pages/inventory/index.edge`

**Purpose**: List inventory items

**Structure**:
- Table: Card Name, Set, Total Quantity, Total Value, Last Price Update
- Expandable rows to show variants
- Action buttons: Remove, Update Prices

**Reference**: [Pages & Views - Inventory](../../docs/09-pages-views.md#8-inventory)

---

### 13. Create Inventory Item Details View

**File**: `resources/views/pages/inventory/show.edge`

**Purpose**: Detailed inventory item view

**Structure**:
- Card information
- Variants table with quantities and prices
- Total value calculation
- Notes section

**Reference**: [Pages & Views - Inventory Item Details](../../docs/09-pages-views.md#9-inventory-item-details)

---

## Testing

Test views:

```bash
# Start dev server
npm run dev

# Visit pages in browser
# http://localhost:3333
# http://localhost:3333/games
# etc.
```

---

## Completion Checklist

- [ ] Base layout template created
- [ ] Navigation component created
- [ ] Dashboard view created
- [ ] Games list view created
- [ ] Game details view created
- [ ] Game events list view created
- [ ] Game event create form created
- [ ] Game event edit form created
- [ ] Set details view created
- [ ] Cards list view created
- [ ] Card details view created
- [ ] Inventory list view created
- [ ] Inventory item details view created
- [ ] All views render correctly

