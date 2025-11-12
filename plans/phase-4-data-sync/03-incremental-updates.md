# Incremental Updates

## Overview
Implement incremental sync logic to only fetch new/updated data based on last sync timestamps.

## Step-by-Step Plan

### 1. Review Last Sync Tracking

**Tables**:
- `tracked_games.last_sets_discovery_at` - When sets were last discovered
- `tracked_sets.last_sync_at` - When cards were last synced

**Reference**: [Database Schema](../../docs/03-database-schema.md) - tracked_games and tracked_sets tables

---

### 2. Implement Needs Discovery Check

**File**: `app/models/tracked_game.ts`

**Method**: `needsDiscovery()`

**Implementation**:
```typescript
needsDiscovery(): boolean {
  // If never discovered, needs discovery
  if (!this.lastSetsDiscoveryAt) {
    return true
  }

  // If discovered more than 7 days ago, needs discovery
  const daysSinceDiscovery = DateTime.now().diff(this.lastSetsDiscoveryAt, 'days').days
  return daysSinceDiscovery >= 7
}
```

**Reference**: [Data Models - TrackedGame](../../docs/04-data-models.md#2-trackedgame-model)

---

### 3. Implement Needs Sync Check

**File**: `app/models/tracked_set.ts`

**Method**: `needsSync()`

**Implementation**:
```typescript
needsSync(): boolean {
  // If never synced, needs sync
  if (!this.lastSyncAt) {
    return true
  }

  // If synced more than 7 days ago, needs sync
  const daysSinceSync = DateTime.now().diff(this.lastSyncAt, 'days').days
  return daysSinceSync >= 7
}
```

**Reference**: [Data Models - TrackedSet](../../docs/04-data-models.md#5-trackedset-model)

---

### 4. Update Discovery Logic to Check Needs

**File**: `app/jobs/processors/discover_sets_processor.ts`

**Action**: Only discover if `needsDiscovery()` returns true

**Implementation**: Already implemented - processors check `needsDiscovery()` before processing

---

### 5. Update Sync Logic to Check Needs

**File**: `app/jobs/processors/sync_tracked_sets_processor.ts`

**Action**: Only sync if `needsSync()` returns true

**Implementation**: Already implemented - processors check `needsSync()` before processing

---

### 6. Handle JustTCG `last_updated` Field

**Purpose**: Use JustTCG's `last_updated` field to determine if data changed

**Note**: JustTCG API includes `last_updated` timestamps on games, sets, and cards

**Implementation**:
```typescript
// In JustTCGService.getSets()
// Compare JustTCG last_updated with database last_updated_at
// Only update if JustTCG timestamp is newer

const existingSet = await Set.findBy('justTcgSetId', setData.id)
if (existingSet && existingSet.lastUpdatedAt >= setData.last_updated_at) {
  // No update needed
  continue
}

// Update set
await Set.updateOrCreate(
  { justTcgSetId: setData.id },
  {
    // ... fields including lastUpdatedAt from JustTCG
  }
)
```

**Reference**: [Database Schema - games.last_updated_at](../../docs/03-database-schema.md#2-games)

---

### 7. Add Force Sync Option

**Purpose**: Allow manual/on-demand sync to bypass `needsSync()` check

**File**: `app/services/TrackingService.ts`

**Method**: `syncSet(setId, force = false)`

**Implementation**:
```typescript
async syncSet(setId: string, force: boolean = false): Promise<void> {
  const trackedSet = await TrackedSet.findByOrFail('set_id', setId)
  
  // Check if sync needed (unless forced)
  if (!force && !trackedSet.needsSync()) {
    return // No sync needed
  }

  // Sync cards
  const user = await User.findOrFail(trackedSet.userId)
  const justTcgService = new JustTCGService(user)
  await justTcgService.getCardsBySet(setId, trackedSet)
}
```

---

## Testing

Test incremental updates:

```typescript
// In REPL
const TrackedSet = await import('#models/tracked_set')

// Get a tracked set
const trackedSet = await TrackedSet.default.first()

// Check if needs sync
console.log('Needs sync:', trackedSet.needsSync())
console.log('Last sync:', trackedSet.lastSyncAt)

// Manually set lastSyncAt to recent time
trackedSet.lastSyncAt = DateTime.now()
await trackedSet.save()

// Check again
console.log('Needs sync after update:', trackedSet.needsSync())
```

---

## Completion Checklist

- [ ] `needsDiscovery()` method implemented
- [ ] `needsSync()` method implemented
- [ ] Discovery logic checks needsDiscovery()
- [ ] Sync logic checks needsSync()
- [ ] JustTCG last_updated field used for comparison
- [ ] Force sync option available
- [ ] Incremental updates working correctly
- [ ] Timestamps updated correctly

