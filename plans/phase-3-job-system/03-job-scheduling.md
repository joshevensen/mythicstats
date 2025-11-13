# Job Scheduling

## Overview

Set up repeatable jobs with proper scheduling, priorities, and job registration on app boot.

## Step-by-Step Plan

### 1. Create Job Registration File

**File**: `start/jobs.ts`

**Purpose**: Register and schedule all repeatable jobs

**Implementation**:

```typescript
import { Queue } from 'bullmq'
import QueueService from '#services/QueueService'
import app from '@adonisjs/core/services/app'

export async function registerJobs() {
  const queueService = app.container.make('services/queue') as QueueService
  const queue = queueService.getQueue('mythicstats-jobs')

  // Get user (single user system)
  const User = await import('#models/user')
  const user = await User.default.first()

  if (!user) {
    throw new Error('No user found. Create a user first.')
  }

  // Schedule discover-sets (weekly, Monday at 02:00 UTC)
  await queue.add(
    'discover-sets',
    { userId: user.id },
    {
      repeat: {
        pattern: '0 2 * * 1', // Cron: Monday at 02:00 UTC
      },
      jobId: 'discover-sets-weekly',
      priority: 1, // Low priority
    }
  )

  // Schedule sync-tracked-sets (weekly, Monday at 03:00 UTC)
  await queue.add(
    'sync-tracked-sets',
    { userId: user.id },
    {
      repeat: {
        pattern: '0 3 * * 1', // Cron: Monday at 03:00 UTC
      },
      jobId: 'sync-tracked-sets-weekly',
      priority: 2, // Medium priority
    }
  )

  // Schedule update-inventory-prices (hourly at :15)
  await queue.add(
    'update-inventory-prices',
    { userId: user.id },
    {
      repeat: {
        pattern: '15 * * * *', // Cron: Every hour at :15
      },
      jobId: 'update-inventory-prices-hourly',
      priority: 3, // High priority
    }
  )
}
```

---

### 2. Register Jobs on App Boot

**File**: `providers/app_provider.ts` or `start/jobs.ts`

**Action**: Call `registerJobs()` when app starts

**Implementation**:

```typescript
// In app_provider.ts
import { ApplicationContract } from '@adonisjs/core/types'
import { registerJobs } from '../start/jobs.js'

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  async ready() {
    // Register jobs after app is ready
    await registerJobs()
  }
}
```

---

### 3. Create Worker File

**File**: `start/worker.ts`

**Purpose**: Process jobs from queue

**Implementation**:

```typescript
import { Worker } from 'bullmq'
import bullmqConfig from '#config/bullmq'
import { ProcessorFactory } from '#jobs/processors/factory'
import User from '#models/user'
import type { Job } from 'bullmq'

const worker = new Worker(
  'mythicstats-jobs',
  async (job: Job) => {
    // Get user from job data
    const user = await User.findOrFail(job.data.userId)

    // Create processor for this job
    const processor = ProcessorFactory.create(job.name, user)

    // Process job
    await processor.process(job)
  },
  {
    connection: bullmqConfig.connection,
    concurrency: 1, // Process one job at a time to respect rate limits
  }
)

// Handle worker events
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close()
  process.exit(0)
})
```

---

### 4. Create Worker Command

**File**: `commands/bullmq_worker.ts`

**Purpose**: Ace command to start worker

**Command**:

```bash
node ace make:command bullmq_worker
```

**Implementation**:

```typescript
import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { execa } from 'execa'

export default class BullmqWorker extends BaseCommand {
  static commandName = 'bullmq:worker'
  static description = 'Start BullMQ worker to process jobs'

  async run() {
    // Import and start worker
    await import('#start/worker')

    this.logger.info('BullMQ worker started')

    // Keep process alive
    process.on('SIGINT', () => {
      this.logger.info('Shutting down worker...')
      process.exit(0)
    })
  }
}
```

**Usage**:

```bash
node ace bullmq:worker
```

---

### 5. Configure Job Priorities

**File**: `config/bullmq.ts`

**Update**: Add priority configuration

**Implementation**:

```typescript
queues: {
  'mythicstats-jobs': {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      // Priority: Higher number = higher priority
      // 1 = Low, 2 = Medium, 3 = High
    },
  },
}
```

**Priority Order**:

1. `update-inventory-prices` - Priority 3 (High)
2. `sync-tracked-sets` - Priority 2 (Medium)
3. `discover-sets` - Priority 1 (Low)

---

### 6. Add Job Management Methods

**File**: `app/services/QueueService.ts`

**Purpose**: Helper methods for managing jobs

**Implementation**:

```typescript
async getRepeatableJobs(): Promise<any[]> {
  const queue = this.getQueue('mythicstats-jobs')
  return queue.getRepeatableJobs()
}

async removeRepeatableJob(jobKey: string): Promise<void> {
  const queue = this.getQueue('mythicstats-jobs')
  await queue.removeRepeatableByKey(jobKey)
}

async pauseQueue(): Promise<void> {
  const queue = this.getQueue('mythicstats-jobs')
  await queue.pause()
}

async resumeQueue(): Promise<void> {
  const queue = this.getQueue('mythicstats-jobs')
  await queue.resume()
}
```

---

## Testing

Test job scheduling:

```typescript
// In REPL
import { registerJobs } from '#start/jobs'

// Register jobs
await registerJobs()

// Check repeatable jobs
const QueueService = await import('#services/QueueService')
const queueService = new QueueService.default()
const repeatableJobs = await queueService.getRepeatableJobs()
console.log('Repeatable jobs:', repeatableJobs)
```

---

## Completion Checklist

- [ ] Job registration file created
- [ ] Jobs registered on app boot
- [ ] Worker file created
- [ ] Worker command created
- [ ] Job priorities configured
- [ ] Repeatable jobs scheduled correctly
- [ ] Worker can process jobs
- [ ] Jobs execute at scheduled times
- [ ] Job management methods implemented
