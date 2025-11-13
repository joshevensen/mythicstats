# BullMQ Setup

## Overview

Install BullMQ packages, configure Redis connection, and set up the job queue infrastructure.

## Step-by-Step Plan

### 1. Install BullMQ Packages

**Commands**:

```bash
npm install bullmq ioredis
npm install --save-dev @types/ioredis
```

**Verify Installation**:

```bash
npm list bullmq ioredis
```

---

### 2. Verify Redis is Running

**Check Redis Connection**:

```bash
redis-cli ping
# Should return: PONG
```

**If Redis is not running**:

```bash
# macOS (Homebrew)
brew services start redis

# Linux
sudo systemctl start redis
```

**Reference**: [Setup & Configuration](../../docs/02-setup-configuration.md) - Redis setup section

---

### 3. Add Redis Environment Variables

**File**: `.env`

**Add**:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional, leave empty if no password
```

**Update**: `start/env.ts` to validate Redis environment variables

**Add to env.ts**:

```typescript
REDIS_HOST: Env.schema.string({ format: 'host' }),
REDIS_PORT: Env.schema.number(),
REDIS_PASSWORD: Env.schema.string.optional(),
```

---

### 4. Create BullMQ Configuration File

**File**: `config/bullmq.ts`

**Implementation**:

```typescript
import env from '#start/env'
import { defineConfig } from '@adonisjs/bullmq'

export default defineConfig({
  connection: {
    host: env.get('REDIS_HOST', 'localhost'),
    port: env.get('REDIS_PORT', 6379),
    password: env.get('REDIS_PASSWORD', undefined),
    maxRetriesPerRequest: null, // Required for BullMQ
  },
  queues: {
    'mythicstats-jobs': {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    },
  },
})
```

**Reference**: [BullMQ Job System](../../docs/07-bullmq-job-system.md) - Configuration section

---

### 5. Create BullMQ Service/Provider

**File**: `app/services/QueueService.ts` (or use AdonisJS BullMQ provider if available)

**Purpose**: Centralized queue management

**Implementation**:

```typescript
import { Queue } from 'bullmq'
import bullmqConfig from '#config/bullmq'

export default class QueueService {
  private queues: Map<string, Queue> = new Map()

  getQueue(name: string = 'mythicstats-jobs'): Queue {
    if (!this.queues.has(name)) {
      const config = bullmqConfig.queues[name]
      const queue = new Queue(name, {
        connection: bullmqConfig.connection,
        defaultJobOptions: config?.defaultJobOptions,
      })
      this.queues.set(name, queue)
    }
    return this.queues.get(name)!
  }

  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close()
    }
    this.queues.clear()
  }
}
```

**Note**: If using AdonisJS BullMQ package, use its provider instead.

---

### 6. Register Queue Service (if needed)

**File**: `providers/app_provider.ts` or create `providers/queue_provider.ts`

**Purpose**: Initialize queue service on app boot

**Implementation**:

```typescript
import { ApplicationContract } from '@adonisjs/core/types'
import QueueService from '#services/QueueService'

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  async ready() {
    // Initialize queue service
    const queueService = new QueueService()
    this.app.container.singleton('services/queue', () => queueService)
  }

  async shutdown() {
    // Close queues on shutdown
    const queueService = await this.app.container.make('services/queue')
    await queueService.close()
  }
}
```

---

## Testing

Test Redis connection and queue creation:

```typescript
// In REPL
import QueueService from '#services/QueueService'

const queueService = new QueueService()
const queue = queueService.getQueue('mythicstats-jobs')

// Test adding a job
await queue.add('test-job', { test: 'data' })

// Check queue stats
const counts = await queue.getJobCounts()
console.log('Queue counts:', counts)

// Clean up
await queueService.close()
```

---

## Completion Checklist

- [ ] BullMQ and ioredis packages installed
- [ ] Redis running and accessible
- [ ] Redis environment variables configured
- [ ] BullMQ configuration file created
- [ ] Queue service/provider created
- [ ] Queue can be instantiated
- [ ] Test job can be added to queue
- [ ] Queue connection verified
