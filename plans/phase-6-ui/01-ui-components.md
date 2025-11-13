# PrimeVue Component System

## Overview

Build reusable Vue 3 + PrimeVue components first, so pages can consume a consistent design system.

## Step-by-Step Plan

### 1. Configure PrimeVue Plugins

- **File**: `resources/js/app.ts`
- **Action**: Register `PrimeVue`, `ToastService`, `ConfirmationService`, and global directives (`tooltip`).
- **Reference**: `resources/js/app.ts` in this repo.

### 2. Global Styles

- **File**: `resources/css/app.css`
- **Action**: Import PrimeVue theme, PrimeFlex utilities, and PrimeIcons. Define base typography and colors.

### 3. Layout Shell

- **File**: `resources/js/components/AppLayout.vue`
- **Purpose**: Top-level shell with navigation, flash toasts, and slot for page content.
- **Features**:
  - PrimeVue `Menubar` with links to Dashboard, Games, Inventory
  - Logout button wired to `POST /logout`
  - `<FlashMessages />` component renders global toast notifications

### 4. Messaging & Feedback

- **File**: `resources/js/components/FlashMessages.vue`
- **Purpose**: Watch shared Inertia flash props and push PrimeVue toasts (`success`, `error`, `warning`).

### 5. Page Scaffolding Components

- **Files**:
  - `resources/js/components/PageHeader.vue`
  - `resources/js/components/SectionCard.vue`
  - `resources/js/components/StatCard.vue`
  - `resources/js/components/TrackedStatus.vue`
- **Usage**:
  - `PageHeader`: Title, subtitle, actions slot
  - `SectionCard`: Card wrapper with title, subtitle, actions slot
  - `StatCard`: Numeric summary with optional icon & helper text
  - `TrackedStatus`: Tag + relative-time helper (discovery/sync/price)

### 6. Domain-Specific Components

- **File**: `resources/js/components/GameEventForm.vue`
- **Purpose**: Reusable create/edit form with PrimeVue form controls.
- **Features**:
  - Uses `useForm` from Inertia
  - Wraps PrimeVue `Dropdown`, `Calendar`, `Textarea`, `Checkbox`
  - Emits POST or PATCH depending on `method` prop

## Testing Checklist

- [ ] `npm run dev` with `node ace inertia:start --watch` (if SSR later) or standard Vite dev server
- [ ] Verify global navigation renders and links work
- [ ] Trigger flash messages (e.g., login failure) and confirm toast display
- [ ] Snapshot test key components with Storybook or Cypress (optional)

## Completion Criteria

- [ ] PrimeVue plugins registered and themed
- [ ] Layout + flash messaging components built
- [ ] Page scaffolding components available to pages
- [ ] Game event form reusable for create/edit flows
- [ ] Components documented in `resources/js/components`
