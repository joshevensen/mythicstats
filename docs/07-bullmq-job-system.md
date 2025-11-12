# BullMQ Job System Architecture

## Overview
Use BullMQ for managing background jobs to sync data from JustTCG API and update prices.

## Queue Configuration

### Queue Setup
- **Queue Name**: `mythicstats-jobs`
- **Redis Connection**: Use Redis for BullMQ (separate from session storage if needed)
- **Concurrency**: Configurable per job type

## Job Types

### 1. `discover-sets`
**Purpose**: Discover available sets for tracked games

**Frequency**: Weekly (or on-demand)

**Process**:
1. Check rate limit status
2. If rate limited, reschedule for after limit expires
3. For each active tracked game:
   - Fetch all sets from JustTCG (`/v1/sets?game={gameId}`)
   - Store/update sets in `sets` table
   - Update `tracked_games.last_sets_discovery_at`
4. Low API cost - just fetching sets list

**Priority**: Low (discovery only, not critical)
**Retry**: Yes (with backoff)

---

### 2. `sync-tracked-sets`
**Purpose**: Sync card data for tracked sets

**Frequency**: Weekly

**Process**:
1. Check rate limit status
2. If rate limited, reschedule for after limit expires
3. For each active tracked set:
   - Check `last_sync_at` to determine if sync needed
   - Call sync logic for this set (shared with on-demand sync)
   - Query cards by set: `/v1/cards?set={setId}&limit={batchSize}&offset={offset}`
   - Paginate through all results:
     - Start with `offset=0`, `limit=20` (free) or `100` (paid)
     - Increment `offset` by batch size until no more results
   - Store/update cards and variants in database
   - Update `tracked_sets.last_sync_at`

**Priority**: Medium
**Retry**: Yes (with backoff)

**Note**: The same sync logic can be called on-demand for a specific set (e.g., when user manually triggers a sync). This is handled as a direct service method call, not a job.

---

### 3. `update-inventory-prices`
**Purpose**: Update prices for cards in inventory

**Frequency**: Hourly

**Process**:
1. Check rate limit status
2. If rate limited, reschedule for after limit expires
3. Query `inventory_item_variants` where:
   - `last_price_update_at` is null OR
   - `last_price_update_at` is older than 24 hours
4. **Batch approach** (preferred):
   - Collect all `variant_id` values (JustTCG variant IDs) that need updates
   - Batch fetch in groups of 20 (free) or 100 (paid plans) using `getCardsBatch()`
   - Update `card_variants` table with prices and statistics for all variants
   - Update `inventory_item_variants.last_price_update_at` for all updated variants
5. Process batches to maximize request efficiency and respect rate limits

**Priority**: High (inventory items are priority)
**Retry**: Yes (with backoff)

## Job Scheduling

### Recurring Jobs
Use BullMQ's repeatable jobs feature:

```typescript
// Weekly jobs
- discover-sets: Weekly (e.g., Monday at 02:00)
- sync-tracked-sets: Weekly (e.g., Monday at 03:00)

// Hourly jobs
- update-inventory-prices: Every hour at :15
```

### Job Priorities
1. `update-inventory-prices` - High (user's inventory)
2. `sync-tracked-sets` - Medium (background sync)
3. `discover-sets` - Low (discovery only, not critical)

**Note**: On-demand operations (syncing a single set or single card price) are handled as direct service method calls, not scheduled jobs. The `sync-tracked-sets` job can sync a specific set by calling the same underlying sync logic.

## Rate Limit Integration

### Before Job Execution
Every job that makes API calls should:
1. Check `users.api_requests_remaining > 0` (monthly)
2. Check `users.api_daily_requests_remaining > 0` (daily)
3. If both are true: proceed with API call
4. If either is 0 or null:
   - Calculate reset time (daily = midnight UTC, monthly = based on plan)
   - Reschedule job for after reset
   - Log that job was delayed

### After API Response
After every API response (from SDK):
1. Extract `usage` object from SDK response (SDK transforms `_metadata` to `usage`)
2. Update `users` table with current rate limit info from `usage`:
   - `api_plan`, limits, usage, remaining
   - `api_limit_info_updated_at = NOW()`
3. This keeps rate limit info current

### After Rate Limit Hit (429 Error)
When SDK returns rate limit error (in `response.error` and `response.code`):
1. Rate limit info should already be in `usage` object (if available)
2. Update `users` table with latest info from `usage` object
3. Calculate reset time (daily = midnight UTC, monthly = based on plan)
4. Reschedule current job for after reset
5. Pause other API-calling jobs until reset

## Job Processors

### Location
`app/jobs/processors/`

### Structure
```typescript
// app/jobs/processors/SyncTrackedGamesProcessor.ts
export class SyncTrackedGamesProcessor {
  async process(job: Job) {
    // Implementation
  }
}
```

## Job Queue Setup

### Configuration File
`config/bullmq.ts`

```typescript
export default {
  connection: {
    host: env.get('REDIS_HOST', 'localhost'),
    port: env.get('REDIS_PORT', 6379),
    // ... other Redis config
  },
  queues: {
    'mythicstats-jobs': {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    },
  },
}
```

## Job Management

### Starting Jobs
- Jobs should be registered in `start/jobs.ts` or similar
- Use AdonisJS providers to initialize BullMQ
- Start repeatable jobs on application boot

### Monitoring
- Use BullMQ dashboard (optional)
- Log job execution to application logs
- Track job success/failure rates

## Error Handling

### Job Failures
- Retry with exponential backoff
- After max retries, log error
- Don't mark as failed for rate limit errors (reschedule instead)

### Rate Limit Errors
- Don't count as job failure
- Reschedule for after limit expires
- Update `users` table with rate limit info from SDK response `usage` object
- Log rate limit event

## Dependencies

### Required Packages
```json
{
  "bullmq": "^latest",
  "ioredis": "^latest" // Redis client for BullMQ
}
```

### Redis Setup
- Redis instance required for BullMQ
- Can use same Redis as sessions or separate instance
- Configure connection in environment variables

## Testing
- Mock BullMQ for unit tests
- Test job processors in isolation
- Test rate limit integration
- Test job scheduling and rescheduling

