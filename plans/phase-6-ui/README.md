# Phase 6: User Interface

## Overview

Migrate the UI layer to Inertia.js with Vue 3 and PrimeVue. Build reusable components first, then wire form actions, and finally compose pages.

## Steps

1. [PrimeVue Component System](./01-ui-components.md) – Layout, flash toasts, status widgets, game-event form
2. [Inertia Forms & Actions](./02-forms-actions.md) – Interactive flows for tracking, syncing, inventory, and events
3. [Inertia Pages & Layouts](./03-pages-and-layouts.md) – Dashboard, games, sets, cards, inventory, and game events

## Dependencies

- Phase 5 complete (Controllers returning serialisable props)
- `@adonisjs/inertia`, Vue 3, PrimeVue, PrimeFlex installed
- `start/inertia.ts` sharing auth + flash data

## References

- [Inertia.js Docs](https://inertiajs.com/) – SPA routing & form helpers
- [PrimeVue Docs](https://primevue.org/) – Component usage & theming
- [Pages & Views](../../docs/09-pages-views.md) – Page specifications

## Completion Criteria

- [ ] PrimeVue + Inertia configured and themed
- [ ] Component library published under `resources/js/components`
- [ ] Forms/actions submit via Inertia with flash feedback
- [ ] All target pages render with new layout
- [ ] Smoke tests confirm navigation and key actions
