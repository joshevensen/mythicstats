# Setup & Configuration

## Overview

This document covers initial setup, configuration, authentication, and development workflow for the MythicStats application.

---

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Redis (for BullMQ job queue)
- JustTCG API key

---

## Initial Setup

### 1. Install Dependencies

```bash
npm install
npm install justtcg-js bullmq ioredis
npm install --save-dev @types/ioredis
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# Application
NODE_ENV=development
PORT=3333
APP_KEY=your-app-key-here  # Generate with: node ace generate:key
HOST=localhost
LOG_LEVEL=info

# Session
SESSION_DRIVER=cookie

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=mythicstats

# JustTCG API
JUSTTCG_API_KEY=your_justtcg_api_key_here

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional, leave empty if no password
```

**Note**: Generate `APP_KEY` using:

```bash
node ace generate:key
```

### 3. Database Setup

```bash
# Run migrations
node ace migration:run

# (Optional) Rollback if needed
node ace migration:rollback
```

### 4. Redis Setup

#### Local Development

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### Production

- Use a managed Redis service (Redis Cloud, AWS ElastiCache, etc.)
- Update `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` in production environment

### 5. Create Initial User

Since this is a single-user internal tool, create the initial user:

**Option 1: Using AdonisJS REPL**

```bash
node ace repl

# In REPL:
const User = await import('#models/user')
const hash = await import('@adonisjs/core/services/hash')

const user = await User.default.create({
  email: 'josh@mythicfoxgames.com',
  password: await hash.default.make('wNr8nz9Ap6'),
  fullName: 'Josh Evensen'
})

console.log('User created:', user.id)
```

---

## Authentication

### Overview

The application uses session-based authentication via AdonisJS Auth package.

### Configuration

- **Config File**: `config/auth.ts`
- **Guard**: `web` (session-based)
- **User Model**: `app/models/user.ts`
- **Session**: Cookie-based (configured in `config/session.ts`)

### Login Flow

1. User visits protected route
2. If not authenticated, redirected to `/login`
3. After login, session created
4. Session persists for 2 hours (configurable in `config/session.ts`)

### Routes Protection

**All routes should be protected** (except login/register if you add them):

```typescript
// start/routes.ts
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.get('/', '#controllers/dashboard_controller.index').use(middleware.auth())
router.get('/games', '#controllers/games_controller.index').use(middleware.auth())
// ... etc
```

### Creating Login/Register Pages

Since this is a single-user internal tool, you may want to:

- **Option A**: Create simple login page (no registration)
- **Option B**: Skip auth for local development (remove auth middleware)
- **Option C**: Use basic HTTP auth for simple protection

**Simple Login Controller Example**:

```typescript
// app/controllers/auth_controller.ts
import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
  async showLogin({ view }: HttpContext) {
    return view.render('auth/login')
  }

  async login({ request, auth, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      await auth.use('web').attempt(email, password)
      return response.redirect('/')
    } catch {
      return response.redirect().back()
    }
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/login')
  }
}
```

---

## BullMQ Configuration

### Configuration File

Create `config/bullmq.ts`:

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

### Starting Job Workers

**Development**:

```bash
# In a separate terminal
node ace bullmq:listen mythicstats-jobs
```

**Production**:

- Use a process manager (PM2, systemd, etc.)
- Run workers as background processes
- Monitor worker health

---

## Development Workflow

### Running the Application

```bash
# Start development server
npm run dev

# Or using Ace
node ace serve --watch
```

### Common Commands

```bash
# Database
node ace migration:run          # Run migrations
node ace migration:rollback     # Rollback last migration
node ace migration:status       # Check migration status
node ace db:seed                # Run seeders

# Code Generation
node ace make:controller        # Create controller
node ace make:model             # Create model
node ace make:migration         # Create migration
node ace make:service           # Create service (custom command or manual)

# BullMQ
node ace bullmq:listen          # Start job worker
node ace bullmq:queue:clear    # Clear job queue (if command exists)

# Testing
npm test                        # Run tests
```

### Project Structure

```
mythicstats/
├── app/
│   ├── controllers/           # HTTP controllers
│   ├── jobs/
│   │   └── processors/        # Job processors
│   ├── middleware/           # Custom middleware
│   ├── models/               # Lucid models
│   ├── services/             # Business logic services
│   └── exceptions/           # Exception handlers
├── config/                    # Configuration files
├── database/
│   ├── migrations/           # Database migrations
│   └── seeders/             # Database seeders
├── resources/
│   ├── views/                # Edge templates
│   ├── css/                  # Stylesheets
│   └── js/                   # JavaScript
├── start/
│   ├── routes.ts             # Route definitions
│   ├── kernel.ts             # Middleware registration
│   └── env.ts                # Environment validation
└── docs/                     # Documentation
```

---

## Error Handling

### Global Exception Handler

Located at `app/exceptions/handler.ts`

### Error Handling Strategy

1. **API Errors** (JustTCG):
   - Rate limit errors (429): Log, update user rate limit info, reschedule job
   - Network errors: Retry with exponential backoff
   - Invalid responses: Log error, skip item, continue processing

2. **Database Errors**:
   - Validation errors: Return to user with error messages
   - Constraint violations: Log and return user-friendly error
   - Connection errors: Log and retry

3. **Job Errors**:
   - Failed jobs: Retry up to 3 times with exponential backoff
   - Rate limit errors: Reschedule for after limit reset
   - Permanent failures: Log and mark job as failed

### Error Logging

- Use AdonisJS Logger (`logger.error()`)
- Log to console in development
- Configure file/remote logging for production

---

## Route Organization

### Route Structure

```typescript
// start/routes.ts
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Apply auth middleware to all routes
router
  .group(() => {
    // Dashboard
    router.get('/', '#controllers/dashboard_controller.index')

    // Games
    router.get('/games', '#controllers/games_controller.index')
    router.get('/games/:gameId', '#controllers/games_controller.show')
    router.post('/games/:gameId/track', '#controllers/games_controller.track')
    router.post('/games/:gameId/discover-sets', '#controllers/games_controller.discoverSets')

    // Sets
    router.get('/sets/:setId', '#controllers/sets_controller.show')
    router.post('/sets/:setId/track', '#controllers/sets_controller.track')
    router.post('/sets/:setId/sync', '#controllers/sets_controller.sync')

    // Cards
    router.get('/sets/:setId/cards', '#controllers/cards_controller.index')
    router.get('/cards/:cardId', '#controllers/cards_controller.show')

    // Inventory
    router.get('/inventory', '#controllers/inventory_controller.index')
    router.get('/inventory/:inventoryItemId', '#controllers/inventory_controller.show')
    router.post('/inventory', '#controllers/inventory_controller.store')
    router.post('/inventory/update-prices', '#controllers/inventory_controller.updatePrices')

    // Game Events
    router.get('/games/:gameId/events', '#controllers/game_events_controller.index')
    router.get('/games/:gameId/events/create', '#controllers/game_events_controller.create')
    router.get('/games/:gameId/events/:eventId', '#controllers/game_events_controller.edit')
    router.post('/events', '#controllers/game_events_controller.store')
    router.patch('/events/:eventId', '#controllers/game_events_controller.update')
    router.delete('/events/:eventId', '#controllers/game_events_controller.destroy')
  })
  .use(middleware.auth())

// Auth routes (if you add login)
router
  .group(() => {
    router.get('/login', '#controllers/auth_controller.showLogin')
    router.post('/login', '#controllers/auth_controller.login')
    router.post('/logout', '#controllers/auth_controller.logout')
  })
  .use(middleware.guest())
```

---

## Production Deployment

### Environment Variables

- Set all environment variables in production environment
- Use secure secret management (AWS Secrets Manager, etc.)
- Never commit `.env` file

### Database

- Run migrations: `node ace migration:run`
- Backup database regularly
- Monitor database performance

### Redis

- Use managed Redis service
- Configure connection pooling
- Monitor memory usage

### Application

- Use process manager (PM2, systemd)
- Run multiple workers for job processing
- Set up health checks
- Configure logging (file or remote service)
- Set up monitoring/alerting

### BullMQ Workers

- Run workers as separate processes
- Use process manager to restart on failure
- Monitor job queue size
- Set up alerts for failed jobs

---

## Troubleshooting

### Common Issues

**Redis Connection Errors**:

- Verify Redis is running: `redis-cli ping`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`
- Check firewall rules

**Database Connection Errors**:

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `createdb mythicstats`

**JustTCG API Errors**:

- Verify `JUSTTCG_API_KEY` is set correctly
- Check API rate limits in user table
- Review API response in logs

**Job Not Running**:

- Verify worker is running: `node ace bullmq:listen`
- Check Redis connection
- Review job queue in Redis: `redis-cli KEYS bull:*`

---

## Next Steps

1. Complete initial setup (database, Redis, environment variables)
2. Create initial user
3. Follow [Implementation Plans](../plans/README.md) for development
4. Reference other documentation as needed during implementation
