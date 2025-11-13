# Inertia Forms & Actions

## Overview

Implement user interactions with Inertia form helpers and PrimeVue inputs. All form submissions should use Inertia navigation to keep SPA experience intact.

## Step-by-Step Plan

### 1. Shared Flash Messages

- **File**: `start/inertia.ts`
- Share `flash` data from the session so Vue pages can show success/error toasts via `<FlashMessages />`.

### 2. Simple Action Buttons

- Use `router.post`, `router.patch`, `router.delete` to trigger controller actions directly from buttons.
- Examples:
  - Track/untrack game: `router.post(/games/:id/track)` / `router.delete(...)`
  - Discover sets: `router.post(/games/:id/discover-sets)`
  - Sync set: `router.post(/sets/:id/sync)`
  - Update prices: `router.post(/inventory/update-prices)`
- Add `preserveScroll: true` for idempotent operations to avoid jumping the viewport.

### 3. Search & Filters

- Use `useForm` with GET requests to maintain query params.
- Example (`Cards/Index.vue`):
  ```ts
  const form = useForm({ search: props.filters.search ?? '' })
  router.get(`/sets/${setId}/cards`, form.data(), { replace: true, preserveState: true })
  ```
- Keep filter state in the URL for deep linking.

### 4. Card Editing Form

- **File**: `resources/js/pages/Cards/Show.vue`
- Wrap inputs with PrimeVue `InputText`/`Textarea`.
- Use `useForm` for PATCH request to `/cards/:cardId`.
- Parse JSON details before submit.

### 5. Variant Price Updates

- Use reactive state per row and call `router.patch(/cards/variants/:variantId)`.
- Provide loading feedback per row while awaiting response.

### 6. Inventory Quantity Updates

- **Controller**: Redirect back with flash rather than returning JSON.
- **UI**: Inline `InputNumber` with save button calling `router.patch(/inventory/variants/:id/quantity)`.

### 7. Game Event Create/Edit

- Reuse `<GameEventForm />` component.
- For create: `form.post('/events')`
- For edit: `form.patch('/events/:id')`
- Convert PrimeVue `Calendar` values to ISO `yyyy-mm-dd` strings on submit.

### 8. Confirmation UX

- For destructive actions (delete event, untrack), use `window.confirm` or wire PrimeVue `ConfirmDialog`.
- Ensure controllers flash success/error messages.

## Testing

```bash
npm run dev

# Use the UI to:
# - Track/untrack games and sets
# - Create/edit game events
# - Update inventory quantities
# - Trigger price syncs
# Confirm toast notifications appear and state updates without full page reloads.
```

## Completion Checklist

- [ ] All button actions use Inertia navigation
- [ ] Search/filter forms preserve URL state
- [ ] Card correction form patches successfully
- [ ] Variant price updates persist and show feedback
- [ ] Inventory quantity edits redirect with flash messages
- [ ] Game event form works for create/edit flows
- [ ] Manual API triggers surface success/error toasts
- [ ] End-to-end interactions tested in browser
