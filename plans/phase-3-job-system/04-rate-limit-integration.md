# Rate Limit Integration

## Overview
Integrate rate limit checking and updates into all job processors to ensure jobs respect API limits and reschedule when needed.

## Step-by-Step Plan

### 1. Enhance Base Processor Rate Limit Checking

**File**: `app/jobs/processors/base_processor.ts`

**Purpose**: Add comprehensive rate limit checking and rescheduling logic

**Implementation**:
```typescript
protected async checkAndHandleRateLimit(job: Job, requiredRequests: number = 1): Promise<boolean> {
  // Refresh user from database to get latest rate limit info
  await this.user.refresh()

  // Check if can make request
  const canMake = await this.user.canMakeApiRequest(requiredRequests)

  if (!canMake) {
    // Calculate reset time
    const resetTime = this.calculateResetTime()
    const delayMs = resetTime.diffNow('milliseconds').milliseconds

    // Reschedule job for after reset
    if (delayMs > 0) {
      await job.moveToDelayed(delayMs)
      console.log(`Job ${job.id} rescheduled for ${resetTime.toISO()}`)
      return false
    }
  }

  return true
}

protected calculateResetTime(): DateTime {
  // Check which limit is exhausted
  const dailyExhausted = this.user.apiDailyRequestsRemaining === 0
  const monthlyExhausted = this.user.apiRequestsRemaining === 0

  if (dailyExhausted) {
    return this.user.getDailyResetTime()
  }

  if (monthlyExhausted) {
    return this.user.getMonthlyResetTime()
  }

  // Default to daily reset (soonest)
  return this.user.getDailyResetTime()
}
```

---

### 2. Update Processors to Check Rate Limits

**File**: `app/jobs/processors/base_processor.ts`

**Update**: `process()` method to check rate limits before handling

**Implementation**:
```typescript
async process(job: Job): Promise<void> {
  try {
    // Check rate limit before processing
    const canProceed = await this.checkAndHandleRateLimit(job)
    if (!canProceed) {
      return // Job rescheduled, exit
    }

    // Process job
    await this.handle(job)
  } catch (error) {
    // Handle rate limit errors specifically
    if (error instanceof RateLimitError) {
      // Reschedule job
      const resetTime = error.resetTime || this.calculateResetTime()
      const delayMs = resetTime.diffNow('milliseconds').milliseconds
      await job.moveToDelayed(delayMs)
      return
    }

    // Log other errors
    console.error(`Job ${job.id} failed:`, error)
    throw error // Let BullMQ handle retry
  }
}
```

---

### 3. Update Rate Limit Info After Each API Call

**File**: `app/jobs/processors/base_processor.ts`

**Purpose**: Ensure rate limit info is updated after every API response

**Implementation**:
```typescript
protected async makeApiCall<T>(
  apiCall: () => Promise<JustTCGApiResponse<T>>
): Promise<JustTCGApiResponse<T>> {
  // Make API call
  const response = await apiCall()

  // Update rate limit info (this is done by JustTCGService, but refresh user)
  await this.user.refresh()

  // Check if we hit rate limit
  if (response.error?.code === 429) {
    // Update rate limit info from response
    if (response.usage) {
      await this.justTcgService.updateRateLimitInfo(response)
      await this.user.refresh()
    }

    // Throw rate limit error
    throw new RateLimitError(
      'Rate limit exceeded',
      this.calculateResetTime(),
      response.usage
    )
  }

  return response
}
```

---

### 4. Update DiscoverSetsProcessor

**File**: `app/jobs/processors/discover_sets_processor.ts`

**Action**: Use rate limit checking before each game

**Implementation**:
```typescript
protected async handle(job: Job): Promise<void> {
  const trackedGames = await TrackedGame.query()
    .where('user_id', this.user.id)
    .where('is_active', true)
    .preload('game')

  for (const trackedGame of trackedGames) {
    // Check rate limit before each game
    if (!(await this.checkAndHandleRateLimit(job))) {
      return // Rescheduled, exit
    }

    // Fetch sets
    await this.makeApiCall(() => 
      this.justTcgService.getSets(trackedGame.gameId, trackedGame)
    )

    // Update progress
    await job.updateProgress({
      processed: trackedGames.indexOf(trackedGame) + 1,
      total: trackedGames.length,
    })
  }
}
```

---

### 5. Update SyncTrackedSetsProcessor

**File**: `app/jobs/processors/sync_tracked_sets_processor.ts`

**Action**: Check rate limits before each set, handle pagination rate limits

**Implementation**:
```typescript
protected async handle(job: Job): Promise<void> {
  const trackedSets = await TrackedSet.query()
    .where('user_id', this.user.id)
    .where('is_active', true)
    .preload('set')

  for (const trackedSet of trackedSets) {
    // Check rate limit before each set
    if (!(await this.checkAndHandleRateLimit(job))) {
      return // Rescheduled, exit
    }

    // Sync cards (getCardsBySet handles pagination and rate limits internally)
    await this.makeApiCall(() =>
      this.justTcgService.getCardsBySet(trackedSet.setId, trackedSet)
    )

    // Update progress
    await job.updateProgress({
      processed: trackedSets.indexOf(trackedSet) + 1,
      total: trackedSets.length,
    })
  }
}
```

---

### 6. Update UpdateInventoryPricesProcessor

**File**: `app/jobs/processors/update_inventory_prices_processor.ts`

**Action**: Check rate limits before each batch

**Implementation**:
```typescript
protected async handle(job: Job): Promise<void> {
  const variants = await InventoryItemVariant.query()
    .where('user_id', this.user.id)
    .where((query) => {
      query
        .whereNull('last_price_update_at')
        .orWhere('last_price_update_at', '<', DateTime.now().minus({ hours: 24 }))
    })
    .preload('variant')

  const justTcgIds = variants
    .map((iv) => iv.variant.justTcgVariantId)
    .filter((id): id is string => id !== null)

  const batchSize = this.user.apiPlan === 'Free Tier' ? 20 : 100

  for (let i = 0; i < justTcgIds.length; i += batchSize) {
    // Check rate limit before each batch
    if (!(await this.checkAndHandleRateLimit(job, 1))) {
      return // Rescheduled, exit
    }

    const batch = justTcgIds.slice(i, i + batchSize)

    // Fetch prices for batch
    await this.makeApiCall(() =>
      this.justTcgService.getCardsBatch(batch)
    )

    // Update last_price_update_at
    // ... update logic

    // Update progress
    await job.updateProgress({
      processed: Math.min(i + batchSize, justTcgIds.length),
      total: justTcgIds.length,
    })
  }
}
```

---

### 7. Add Rate Limit Logging

**File**: `app/jobs/processors/base_processor.ts`

**Purpose**: Log when jobs are rescheduled due to rate limits

**Implementation**:
```typescript
import logger from '@adonisjs/core/services/logger'

protected async checkAndHandleRateLimit(job: Job, requiredRequests: number = 1): Promise<boolean> {
  await this.user.refresh()
  const canMake = await this.user.canMakeApiRequest(requiredRequests)

  if (!canMake) {
    const resetTime = this.calculateResetTime()
    const delayMs = resetTime.diffNow('milliseconds').milliseconds

    if (delayMs > 0) {
      await job.moveToDelayed(delayMs)
      
      logger.info('Job rescheduled due to rate limit', {
        jobId: job.id,
        jobName: job.name,
        resetTime: resetTime.toISO(),
        dailyRemaining: this.user.apiDailyRequestsRemaining,
        monthlyRemaining: this.user.apiRequestsRemaining,
      })
      
      return false
    }
  }

  return true
}
```

---

## Testing

Test rate limit integration:

```typescript
// In REPL or test
// Set user to rate limited state
const User = await import('#models/user')
const user = await User.default.first()
user.apiRequestsRemaining = 0
await user.save()

// Try to process job
const { ProcessorFactory } = await import('#jobs/processors/factory')
const processor = ProcessorFactory.create('discover-sets', user)

const mockJob = {
  id: 'test-1',
  data: { userId: user.id },
  moveToDelayed: async (delay: number) => {
    console.log('Job rescheduled with delay:', delay)
  },
} as Job

await processor.process(mockJob)
// Should reschedule job instead of processing
```

---

## Completion Checklist

- [ ] Base processor checks rate limits before processing
- [ ] Base processor reschedules jobs when rate limited
- [ ] All processors use rate limit checking
- [ ] Rate limit info updated after each API call
- [ ] Rate limit errors handled gracefully
- [ ] Jobs reschedule correctly when rate limited
- [ ] Rate limit logging implemented
- [ ] Reset time calculation working
- [ ] Rate limit integration tested

