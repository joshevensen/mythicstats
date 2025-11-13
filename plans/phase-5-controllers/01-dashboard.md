# Dashboard Controller

## Overview

Create the dashboard controller that displays inventory summary, API status, and recent activity.

## Step-by-Step Plan

### 1. Create DashboardController

**File**: `app/controllers/dashboard_controller.ts`

**Command**:

```bash
node ace make:controller Dashboard
```

---

### 2. Implement Index Method

**File**: `app/controllers/dashboard_controller.ts`

**Route**: `GET /`

**Purpose**: Display dashboard with inventory summary, API status, and recent activity

**Implementation**:

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import InventoryItem from '#models/inventory_item'
import InventoryItemVariant from '#models/inventory_item_variant'
import JustTCGService from '#services/JustTCGService'
import ApiUsageService from '#services/ApiUsageService'

export default class DashboardController {
  async index({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()

    // Inventory summary
    const inventoryItems = await InventoryItem.query()
      .where('user_id', user.id)
      .preload('variants', (query) => {
        query.preload('variant')
      })

    const totalCards = inventoryItems.length
    const totalQuantity = inventoryItems.reduce((sum, item) => {
      return sum + item.variants.reduce((qty, v) => qty + v.quantity, 0)
    }, 0)

    // Calculate total value
    let totalValue = 0
    for (const item of inventoryItems) {
      for (const variant of item.variants) {
        totalValue += variant.quantity * (variant.variant.price || 0)
      }
    }

    // API status
    const justTcgService = new JustTCGService(user)
    const apiStatus = justTcgService.getRateLimitStatus()

    // Recent activity (last sync times, recent price updates)
    const recentSyncs = await TrackedSet.query()
      .where('user_id', user.id)
      .whereNotNull('last_sync_at')
      .orderBy('last_sync_at', 'desc')
      .limit(5)
      .preload('set')

    const recentPriceUpdates = await InventoryItemVariant.query()
      .whereHas('inventoryItem', (q) => q.where('user_id', user.id))
      .whereNotNull('last_price_update_at')
      .orderBy('last_price_update_at', 'desc')
      .limit(5)
      .preload('inventoryItem', (q) => q.preload('card'))

    return view.render('pages/dashboard', {
      inventorySummary: {
        totalCards,
        totalQuantity,
        totalValue,
      },
      apiStatus,
      recentActivity: {
        syncs: recentSyncs,
        priceUpdates: recentPriceUpdates,
      },
    })
  }
}
```

**Reference**: [Pages & Views - Dashboard](../../docs/09-pages-views.md#1-dashboard)

---

### 3. Add Route

**File**: `start/routes.ts`

**Implementation**:

```typescript
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.get('/', '#controllers/dashboard_controller.index').use(middleware.auth())
```

---

### 4. Create Dashboard View

**File**: `resources/views/pages/dashboard.edge`

**Purpose**: Display dashboard content

**Structure**:

- Inventory summary cards (total cards, quantity, value)
- API status section (plan, usage, remaining)
- Recent activity list (syncs, price updates)

**Reference**: [Pages & Views - Dashboard](../../docs/09-pages-views.md#1-dashboard)

**Note**: View template creation is in Phase 6.

---

## Testing

Test dashboard:

```typescript
// In REPL or test
import DashboardController from '#controllers/dashboard_controller'
import { HttpContext } from '@adonisjs/core/http'

// Mock HttpContext
const ctx = {
  auth: {
    getUserOrFail: async () => await User.first(),
  },
  view: {
    render: async (template, data) => console.log('Render:', template, data),
  },
} as HttpContext

const controller = new DashboardController()
await controller.index(ctx)
```

---

## Completion Checklist

- [ ] DashboardController created
- [ ] Index method implemented
- [ ] Inventory summary calculated
- [ ] API status retrieved
- [ ] Recent activity queried
- [ ] Route added
- [ ] Controller tested
