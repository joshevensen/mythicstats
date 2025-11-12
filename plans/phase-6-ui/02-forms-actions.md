# Forms & Actions

## Overview
Create forms and action buttons for all user interactions.

## Step-by-Step Plan

### 1. Track/Untrack Game Forms

**Files**: `resources/views/pages/games/index.edge` and `resources/views/pages/games/show.edge`

**Implementation**: Simple form buttons

```edge
@if(game.isTracked)
  <form method="POST" action="/games/{{ game.id }}/track" style="display: inline;">
    @csrfField()
    <input type="hidden" name="_method" value="DELETE">
    <button type="submit">Untrack</button>
  </form>
@else
  <form method="POST" action="/games/{{ game.id }}/track" style="display: inline;">
    @csrfField()
    <button type="submit">Track</button>
  </form>
@end
```

---

### 2. Track/Untrack Set Forms

**Files**: `resources/views/pages/games/show.edge` and `resources/views/pages/sets/show.edge`

**Implementation**: Similar to track/untrack game forms

---

### 3. Add to Inventory Form

**Files**: `resources/views/pages/cards/show.edge` and `resources/views/pages/cards/index.edge`

**Implementation**:
```edge
<form method="POST" action="/inventory">
  @csrfField()
  <input type="hidden" name="card_id" value="{{ card.id }}">
  <textarea name="notes" placeholder="Notes (optional)"></textarea>
  <button type="submit">Add to Inventory</button>
</form>
```

---

### 4. Update Quantity Form

**File**: `resources/views/pages/inventory/show.edge`

**Implementation**: Inline quantity editing or modal

```edge
<form method="PATCH" action="/inventory/variants/{{ variant.id }}/quantity" class="inline-form">
  @csrfField()
  <input type="number" name="quantity" value="{{ variant.quantity }}" min="0">
  <button type="submit">Update</button>
</form>
```

---

### 5. Game Event Create/Edit Form

**Files**: `resources/views/pages/game_events/create.edge` and `resources/views/pages/game_events/edit.edge`

**Fields**:
- Event type (dropdown: release, championship, tournament, ban, other)
- Title (text input)
- Description (textarea)
- Start date (date input)
- End date (date input, optional)
- Affects pricing (checkbox)

**Implementation**:
```edge
<form method="POST" action="/events">
  @csrfField()
  <input type="hidden" name="game_id" value="{{ game.id }}">
  
  <label>Event Type</label>
  <select name="event_type" required>
    <option value="release">Release</option>
    <option value="championship">Championship</option>
    <option value="tournament">Tournament</option>
    <option value="ban">Ban</option>
    <option value="other">Other</option>
  </select>

  <label>Title</label>
  <input type="text" name="title" required>

  <label>Description</label>
  <textarea name="description"></textarea>

  <label>Start Date</label>
  <input type="date" name="start_date" required>

  <label>End Date</label>
  <input type="date" name="end_date">

  <label>
    <input type="checkbox" name="affects_pricing" value="1">
    Affects Pricing
  </label>

  <button type="submit">Create Event</button>
  <a href="/games/{{ game.id }}/events">Cancel</a>
</form>
```

---

### 6. Manual JustTCG API Request Buttons

**Files**: Various views

**Discover Sets Button** (`resources/views/pages/games/show.edge`):
```edge
<form method="POST" action="/games/{{ game.id }}/discover-sets" style="display: inline;">
  @csrfField()
  <button type="submit" onclick="return confirm('This will use API requests. Continue?')">
    Discover Sets
  </button>
</form>
```

**Sync Set Button** (`resources/views/pages/sets/show.edge`):
```edge
<form method="POST" action="/sets/{{ set.id }}/sync" style="display: inline;">
  @csrfField()
  <button type="submit" onclick="return confirm('This will use API requests. Continue?')">
    Sync Set
  </button>
</form>
```

**Update Prices Button** (`resources/views/pages/inventory/index.edge`):
```edge
<form method="POST" action="/inventory/update-prices" style="display: inline;">
  @csrfField()
  <button type="submit" onclick="return confirm('This will use API requests. Continue?')">
    Update Prices
  </button>
</form>
```

**Rate Limit Check**: Controllers should check rate limits before processing these requests.

---

### 7. Manual Card Correction Form

**File**: `resources/views/pages/cards/show.edge`

**Purpose**: Allow manual correction of card/variant data

**Implementation**: Edit form for card fields and variant fields

---

## Testing

Test forms:

```bash
# Start dev server
npm run dev

# Test forms in browser
# Submit forms and verify actions work
# Check validation errors display
# Check success/error flash messages
```

---

## Completion Checklist

- [ ] Track/untrack game forms created
- [ ] Track/untrack set forms created
- [ ] Add to inventory form created
- [ ] Update quantity form created
- [ ] Game event create/edit forms created
- [ ] Manual API request buttons created
- [ ] Card correction form created
- [ ] Forms validate correctly
- [ ] Flash messages display
- [ ] Forms tested

