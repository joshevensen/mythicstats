# Inertia Pages & Layouts

## Overview

Compose Vue 3 Inertia pages using the shared component library. Pages should hydrate data from controllers and lean on PrimeVue tables/forms.

## Step-by-Step Plan

### 1. Dashboard (`resources/js/pages/Dashboard/Index.vue`)

- Use `AppLayout`, `PageHeader`, `StatCard`, `SectionCard`, `TrackedStatus`.
- Render inventory summary cards, API usage progress, recent syncs, recent price updates (PrimeVue `DataTable`).
- Provide quick action button to `/inventory`.

### 2. Games

- **Index** (`Games/Index.vue`):
  - Search box filters client-side.
  - DataTable lists games with track/untrack/toggle/discover buttons.
- **Show** (`Games/Show.vue`):
  - Summary card for game stats and tracking status.
  - Sets DataTable with per-set actions (track/untrack/toggle/sync).

### 3. Sets (`Sets/Show.vue`)

- Show card summary stats (total, inventory, price range).
- Buttons for track/untrack/toggle/sync.
- Link to cards list.

### 4. Cards

- **Index** (`Cards/Index.vue`):
  - Inertia GET form for search.
  - DataTable with inventory badges and link to detail.
- **Show** (`Cards/Show.vue`):
  - Card edit form (name/number/rarity/details).
  - Inventory snapshot.
  - Variants table with inline price edits.

### 5. Inventory

- **Index** (`Inventory/Index.vue`):
  - Table with total quantity/value and last price update.
  - Button to trigger `/inventory/update-prices`.
- **Show** (`Inventory/Show.vue`):
  - Summary card (quantity, value, notes).
  - Variants table with inline quantity edits and resync button.

### 6. Game Events

- **Index** (`GameEvents/Index.vue`):
  - Timeline table with edit/delete buttons.
- **Create** (`GameEvents/Create.vue`) & **Edit** (`GameEvents/Edit.vue`):
  - Wrap `<GameEventForm />`.
  - Provide cancel/back buttons.

### 7. Routing Updates

- Ensure `start/routes.ts` uses controllers returning `inertia.render`.
- Remove references to `view.render` for protected pages.

## Testing Checklist

- [ ] Navigate through each page without full reloads
- [ ] Sorting/pagination works on PrimeVue tables
- [ ] All actions (track, sync, update quantities, event CRUD) show toasts
- [ ] Search forms reflect query params
- [ ] Pages responsive on tablet/desktop

## Completion Criteria

- [ ] All Inertia pages built under `resources/js/pages/**`
- [ ] Layout/components reused consistently
- [ ] Controller props serialise cleanly (no DateTime objects leaking)
- [ ] Manual and automated smoke tests run
- [ ] README updated with new UI stack instructions
