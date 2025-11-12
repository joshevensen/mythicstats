# Unit Tests

## Overview
Create unit tests for models, services, and job processors.

## Step-by-Step Plan

### 1. Set Up Testing Environment

**File**: `tests/bootstrap.ts`

**Purpose**: Configure test environment

**Check**: AdonisJS test setup is configured

---

### 2. Test Model Methods

**Files**: `tests/unit/models/`

**Models to Test**:
- User model rate limit methods
- TrackedGame needsDiscovery()
- TrackedSet needsSync()
- InventoryItem totalQuantity(), totalValue()
- InventoryItemVariant value()

**Example**:
```typescript
// tests/unit/models/user_test.ts
import { test } from '@japa/runner'
import User from '#models/user'

test.group('User Model', () => {
  test('canMakeApiRequest returns true when requests remaining', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password',
      apiRequestsRemaining: 10,
      apiDailyRequestsRemaining: 5,
    })

    assert.isTrue(user.canMakeApiRequest())
  })

  test('canMakeApiRequest returns false when rate limited', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password',
      apiRequestsRemaining: 0,
      apiDailyRequestsRemaining: 0,
    })

    assert.isFalse(user.canMakeApiRequest())
  })
})
```

---

### 3. Test Service Methods

**Files**: `tests/unit/services/`

**Services to Test**:
- JustTCGService methods (with mocks)
- TrackingService methods
- InventoryService methods
- CardService methods
- ApiUsageService methods

**Example**:
```typescript
// tests/unit/services/tracking_service_test.ts
import { test } from '@japa/runner'
import TrackingService from '#services/TrackingService'
import User from '#models/user'
import Game from '#models/game'

test.group('TrackingService', () => {
  test('trackGame creates tracked game', async ({ assert }) => {
    const user = await User.firstOrFail()
    const game = await Game.firstOrFail()
    const service = new TrackingService()

    const trackedGame = await service.trackGame(user.id, game.id)

    assert.exists(trackedGame)
    assert.equal(trackedGame.userId, user.id)
    assert.equal(trackedGame.gameId, game.id)
  })
})
```

---

### 4. Test Job Processors

**Files**: `tests/unit/jobs/processors/`

**Processors to Test**:
- DiscoverSetsProcessor
- SyncTrackedSetsProcessor
- UpdateInventoryPricesProcessor

**Note**: Mock JustTCGService and API calls

---

### 5. Test Rate Limiting Logic

**Files**: `tests/unit/services/just_tcg_service_test.ts`

**Scenarios**:
- Rate limit checking
- Rate limit updates from API response
- Rate limit error handling

---

## Testing

Run unit tests:

```bash
npm test
# or
node ace test
```

---

## Completion Checklist

- [ ] Testing environment configured
- [ ] Model method tests written
- [ ] Service method tests written
- [ ] Job processor tests written
- [ ] Rate limiting tests written
- [ ] All tests passing
- [ ] Test coverage acceptable

