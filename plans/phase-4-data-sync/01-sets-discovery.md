# Sets Discovery

## Overview

Implement logic to discover available sets for tracked games and store them in the database.

## Step-by-Step Plan

### 1. Review TrackingService

**File**: `app/services/TrackingService.ts`

**Purpose**: Service for managing tracked games and sets

**Reference**: [Services - TrackingService](../../docs/05-services.md#2-trackingservice)

**Key Methods**:

- `trackGame(userId, gameId)` - Add game to tracked_games
- `getTrackedGames(userId)` - Get all tracked games for user
- `getActiveTrackedGames(userId)` - Get active tracked games

---

### 2. Implement Sets Discovery Logic

**File**: `app/services/TrackingService.ts` or create `app/services/SyncService.ts`

**Method**: `discoverSetsForTrackedGames(userId)`

**Implementation**:

```typescript
async discoverSetsForTrackedGames(userId: number): Promise<void> {
  const User = await import('#models/user')
  const user = await User.default.findOrFail(userId)

  const justTcgService = new JustTCGService(user)

  // Get all active tracked games
  const trackedGames = await TrackedGame.query()
    .where('user_id', userId)
    .where('is_active', true)
    .preload('game')

  // Discover sets for each tracked game
  for (const trackedGame of trackedGames) {
    // Check if discovery needed
    if (!trackedGame.needsDiscovery()) {
      continue
    }

    // Fetch sets from JustTCG
    await justTcgService.getSets(trackedGame.gameId, trackedGame)

    // Mark discovery complete (done by getSets if trackedGame provided)
  }
}
```

**Reference**: [Services - getSets()](../../docs/05-services.md#getsetsgameid-string-trackedgame-trackedgame)

---

### 3. Integrate with DiscoverSetsProcessor

**File**: `app/jobs/processors/discover_sets_processor.ts`

**Action**: Use TrackingService or implement discovery logic directly

**Implementation**:

```typescript
import TrackingService from '#services/TrackingService'

export class DiscoverSetsProcessor extends BaseProcessor {
  private trackingService: TrackingService

  constructor(user: User) {
    super(user)
    this.trackingService = new TrackingService()
  }

  protected async handle(job: Job): Promise<void> {
    // Use service method or implement directly
    await this.trackingService.discoverSetsForTrackedGames(this.user.id)

    // Or implement directly:
    const trackedGames = await TrackedGame.query()
      .where('user_id', this.user.id)
      .where('is_active', true)
      .preload('game')

    for (const trackedGame of trackedGames) {
      if (!trackedGame.needsDiscovery()) {
        continue
      }

      await this.makeApiCall(() => this.justTcgService.getSets(trackedGame.gameId, trackedGame))
    }
  }
}
```

---

### 4. Handle Discovery Edge Cases

**Scenarios to Handle**:

- Game has no sets (empty response)
- Game not found in JustTCG
- Network errors during discovery
- Rate limits during discovery

**Implementation**: Already handled by:

- JustTCGService error handling
- Base processor rate limit checking
- Job retry logic

---

## Testing

Test sets discovery:

```typescript
// In REPL
const User = await import('#models/user')
const TrackingService = await import('#services/TrackingService')

const user = await User.default.first()
const trackingService = new TrackingService.default()

// Discover sets for tracked games
await trackingService.discoverSetsForTrackedGames(user.id)

// Verify sets were created
const Set = await import('#models/set')
const sets = await Set.default.query().preload('game')
console.log('Sets discovered:', sets.length)
```

---

## Completion Checklist

- [ ] Sets discovery logic implemented
- [ ] Integrates with TrackingService
- [ ] Uses JustTCGService.getSets()
- [ ] Updates tracked_games.last_sets_discovery_at
- [ ] Handles edge cases
- [ ] Works with DiscoverSetsProcessor
- [ ] Sets discovery tested
