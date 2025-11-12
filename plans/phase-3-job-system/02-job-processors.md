# Job Processors

## Overview
Create job processors for all background jobs: discover-sets, sync-tracked-sets, and update-inventory-prices.

## Step-by-Step Plan

### 1. Create Job Processors Directory

**Directory**: `app/jobs/processors/`

**Command**:
```bash
mkdir -p app/jobs/processors
```

---

### 2. Create Base Processor Class

**File**: `app/jobs/processors/base_processor.ts`

**Purpose**: Shared logic for all processors (rate limit checking, error handling)

**Implementation**:
```typescript
import type { Job } from 'bullmq'
import User from '#models/user'
import JustTCGService from '#services/JustTCGService'

export abstract class BaseProcessor {
  protected user: User
  protected justTcgService: JustTCGService

  constructor(user: User) {
    this.user = user
    this.justTcgService = new JustTCGService(user)
  }

  /**
   * Check if can make API request
   */
  protected async canMakeRequest(): Promise<boolean> {
    return this.user.canMakeApiRequest()
  }

  /**
   * Process job with error handling
   */
  async process(job: Job): Promise<void> {
    try {
      // Check rate limit before processing
      if (!(await this.canMakeRequest())) {
        // Reschedule job for after rate limit reset
        const resetTime = this.calculateResetTime()
        await job.moveToDelayed(resetTime.diffNow('milliseconds').milliseconds)
        return
      }

      // Process job
      await this.handle(job)
    } catch (error) {
      // Log error
      console.error(`Job ${job.id} failed:`, error)
      throw error // Let BullMQ handle retry
    }
  }

  /**
   * Calculate when rate limit resets
   */
  protected calculateResetTime(): DateTime {
    // Use user model methods
    return this.user.getDailyResetTime() // or getMonthlyResetTime()
  }

  /**
   * Abstract method for job-specific logic
   */
  protected abstract handle(job: Job): Promise<void>
}
```

---

### 3. Create DiscoverSetsProcessor

**File**: `app/jobs/processors/discover_sets_processor.ts`

**Purpose**: Discover available sets for tracked games

**Job Name**: `discover-sets`

**Implementation**:
```typescript
import { BaseProcessor } from './base_processor.js'
import type { Job } from 'bullmq'
import TrackedGame from '#models/tracked_game'
import TrackingService from '#services/TrackingService'

export class DiscoverSetsProcessor extends BaseProcessor {
  private trackingService: TrackingService

  constructor(user: User) {
    super(user)
    this.trackingService = new TrackingService()
  }

  protected async handle(job: Job): Promise<void> {
    // Get all active tracked games
    const trackedGames = await TrackedGame.query()
      .where('user_id', this.user.id)
      .where('is_active', true)
      .preload('game')

    // Process each tracked game
    for (const trackedGame of trackedGames) {
      // Check if discovery needed
      if (!trackedGame.needsDiscovery()) {
        continue
      }

      // Fetch sets for this game
      await this.justTcgService.getSets(trackedGame.gameId, trackedGame)

      // Update job progress
      await job.updateProgress({
        processed: trackedGames.indexOf(trackedGame) + 1,
        total: trackedGames.length,
      })
    }
  }
}
```

**Reference**: [BullMQ Job System - discover-sets](../../docs/07-bullmq-job-system.md#1-discover-sets)

---

### 4. Create SyncTrackedSetsProcessor

**File**: `app/jobs/processors/sync_tracked_sets_processor.ts`

**Purpose**: Sync card data for tracked sets

**Job Name**: `sync-tracked-sets`

**Implementation**:
```typescript
import { BaseProcessor } from './base_processor.js'
import type { Job } from 'bullmq'
import TrackedSet from '#models/tracked_set'

export class SyncTrackedSetsProcessor extends BaseProcessor {
  protected async handle(job: Job): Promise<void> {
    // Get all active tracked sets
    const trackedSets = await TrackedSet.query()
      .where('user_id', this.user.id)
      .where('is_active', true)
      .preload('set')

    // Process each tracked set
    for (const trackedSet of trackedSets) {
      // Check if sync needed
      if (!trackedSet.needsSync()) {
        continue
      }

      // Sync cards for this set
      await this.justTcgService.getCardsBySet(trackedSet.setId, trackedSet)

      // Update job progress
      await job.updateProgress({
        processed: trackedSets.indexOf(trackedSet) + 1,
        total: trackedSets.length,
      })
    }
  }
}
```

**Reference**: [BullMQ Job System - sync-tracked-sets](../../docs/07-bullmq-job-system.md#2-sync-tracked-sets)

---

### 5. Create UpdateInventoryPricesProcessor

**File**: `app/jobs/processors/update_inventory_prices_processor.ts`

**Purpose**: Update prices for cards in inventory

**Job Name**: `update-inventory-prices`

**Implementation**:
```typescript
import { BaseProcessor } from './base_processor.js'
import type { Job } from 'bullmq'
import InventoryItemVariant from '#models/inventory_item_variant'
import CardVariant from '#models/card_variant'

export class UpdateInventoryPricesProcessor extends BaseProcessor {
  protected async handle(job: Job): Promise<void> {
    // Get inventory variants needing price updates
    const variants = await InventoryItemVariant.query()
      .where('user_id', this.user.id)
      .where((query) => {
        query
          .whereNull('last_price_update_at')
          .orWhere('last_price_update_at', '<', DateTime.now().minus({ hours: 24 }))
      })
      .preload('variant')

    // Collect JustTCG variant IDs
    const justTcgIds = variants
      .map((iv) => iv.variant.justTcgVariantId)
      .filter((id): id is string => id !== null)

    // Batch fetch prices
    const batchSize = this.user.apiPlan === 'Free Tier' ? 20 : 100

    for (let i = 0; i < justTcgIds.length; i += batchSize) {
      const batch = justTcgIds.slice(i, i + batchSize)

      // Fetch prices for batch
      await this.justTcgService.getCardsBatch(batch)

      // Update last_price_update_at for variants in this batch
      const variantIds = variants
        .filter((iv) => batch.includes(iv.variant.justTcgVariantId))
        .map((iv) => iv.id)

      await InventoryItemVariant.query()
        .whereIn('id', variantIds)
        .update({ last_price_update_at: DateTime.now() })

      // Update job progress
      await job.updateProgress({
        processed: Math.min(i + batchSize, justTcgIds.length),
        total: justTcgIds.length,
      })
    }
  }
}
```

**Reference**: [BullMQ Job System - update-inventory-prices](../../docs/07-bullmq-job-system.md#3-update-inventory-prices)

---

### 6. Create Processor Factory

**File**: `app/jobs/processors/factory.ts`

**Purpose**: Create processor instances based on job name

**Implementation**:
```typescript
import User from '#models/user'
import { DiscoverSetsProcessor } from './discover_sets_processor.js'
import { SyncTrackedSetsProcessor } from './sync_tracked_sets_processor.js'
import { UpdateInventoryPricesProcessor } from './update_inventory_prices_processor.js'
import type { BaseProcessor } from './base_processor.js'

export class ProcessorFactory {
  static create(jobName: string, user: User): BaseProcessor {
    switch (jobName) {
      case 'discover-sets':
        return new DiscoverSetsProcessor(user)
      case 'sync-tracked-sets':
        return new SyncTrackedSetsProcessor(user)
      case 'update-inventory-prices':
        return new UpdateInventoryPricesProcessor(user)
      default:
        throw new Error(`Unknown job type: ${jobName}`)
    }
  }
}
```

---

## Testing

Test processors:

```typescript
// In REPL or test
import User from '#models/user'
import { ProcessorFactory } from '#jobs/processors/factory'
import type { Job } from 'bullmq'

const user = await User.first()
const processor = ProcessorFactory.create('discover-sets', user)

// Create mock job
const mockJob = {
  id: 'test-1',
  data: {},
  updateProgress: async (progress: any) => console.log('Progress:', progress),
} as Job

// Process job
await processor.process(mockJob)
```

---

## Completion Checklist

- [ ] Base processor class created
- [ ] DiscoverSetsProcessor created
- [ ] SyncTrackedSetsProcessor created
- [ ] UpdateInventoryPricesProcessor created
- [ ] Processor factory created
- [ ] All processors extend base processor
- [ ] Rate limit checking implemented
- [ ] Error handling implemented
- [ ] Job progress tracking implemented
- [ ] Processors tested

