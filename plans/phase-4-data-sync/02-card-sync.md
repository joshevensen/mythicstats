# Card Sync

## Overview

Implement logic to sync card data for tracked sets, including pagination handling and variant storage.

## Step-by-Step Plan

### 1. Review Card Sync Requirements

**Key Points**:

- Sync cards for tracked sets only
- Use pagination to fetch all cards
- Store cards and variants in database
- Update `tracked_sets.last_sync_at`

**Reference**: [Services - getCardsBySet()](../../docs/05-services.md#getcardsbysetsetid-string-trackedset-trackedset)

---

### 2. Implement Card Sync Logic

**File**: `app/services/TrackingService.ts` or `app/services/SyncService.ts`

**Method**: `syncCardsForTrackedSets(userId)`

**Implementation**:

```typescript
async syncCardsForTrackedSets(userId: number): Promise<void> {
  const User = await import('#models/user')
  const user = await User.default.findOrFail(userId)

  const justTcgService = new JustTCGService(user)

  // Get all active tracked sets
  const trackedSets = await TrackedSet.query()
    .where('user_id', userId)
    .where('is_active', true)
    .preload('set')

  // Sync cards for each tracked set
  for (const trackedSet of trackedSets) {
    // Check if sync needed
    if (!trackedSet.needsSync()) {
      continue
    }

    // Sync cards (getCardsBySet handles pagination)
    await justTcgService.getCardsBySet(trackedSet.setId, trackedSet)

    // Mark synced (done by getCardsBySet if trackedSet provided)
  }
}
```

---

### 3. Verify Pagination Handling

**File**: `app/services/JustTCGService.ts`

**Ensure**: `getCardsBySet()` handles pagination correctly

**Check**:

- Starts with `offset=0`
- Uses correct `limit` (20 or 100 based on plan)
- Increments `offset` by batch size
- Continues until no more results
- Updates rate limit info after each page

**Reference**: [Phase 2 - API Methods](../phase-2-api-integration/02-api-methods.md#3-implement-getcardsbyset-method)

---

### 4. Verify Variant Storage

**File**: `app/services/JustTCGService.ts`

**Ensure**: All variant fields are mapped correctly

**Check**:

- Basic fields (condition, printing, language, price)
- All statistics fields (7d, 30d, 90d, 1y, all-time)
- Price history JSONB fields
- All fields from [Database Schema - card_variants](../../docs/03-database-schema.md#6-card_variants)

---

### 5. Integrate with SyncTrackedSetsProcessor

**File**: `app/jobs/processors/sync_tracked_sets_processor.ts`

**Action**: Use service method or implement directly

**Implementation**: Already done in [Phase 3 - Job Processors](../phase-3-job-system/02-job-processors.md#4-create-synctrackedsetsprocessor)

---

### 6. Handle Sync Edge Cases

**Scenarios**:

- Set has no cards (empty response)
- Set not found in JustTCG
- Partial sync (some cards fail)
- Rate limits during sync
- Large sets (1000+ cards)

**Handling**:

- Empty response: Mark as synced anyway
- Not found: Log error, don't mark as synced
- Partial sync: Continue with remaining cards
- Rate limits: Handled by base processor
- Large sets: Pagination handles this

---

## Testing

Test card sync:

```typescript
// In REPL
const User = await import('#models/user')
const TrackingService = await import('#services/TrackingService')
const TrackedSet = await import('#models/tracked_set')

const user = await User.default.first()
const trackingService = new TrackingService.default()

// Get a tracked set
const trackedSet = await TrackedSet.default
  .query()
  .where('user_id', user.id)
  .where('is_active', true)
  .first()

if (trackedSet) {
  // Sync cards for this set
  const JustTCGService = await import('#services/JustTCGService')
  const justTcgService = new JustTCGService.default(user)
  await justTcgService.getCardsBySet(trackedSet.setId, trackedSet)

  // Verify cards were created
  const Card = await import('#models/card')
  const cards = await Card.default.query().where('set_id', trackedSet.setId)
  console.log('Cards synced:', cards.length)
}
```

---

## Completion Checklist

- [ ] Card sync logic implemented
- [ ] Pagination working correctly
- [ ] All variant fields mapped
- [ ] Cards and variants stored in database
- [ ] Updates tracked_sets.last_sync_at
- [ ] Handles edge cases
- [ ] Works with SyncTrackedSetsProcessor
- [ ] Card sync tested with real API
