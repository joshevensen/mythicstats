# Manual Testing

## Overview

Manual testing checklist to verify application functionality with real API calls and user workflows.

## Step-by-Step Plan

### 1. Test with Real JustTCG API

**Scenarios**:

- [ ] Fetch games from JustTCG
- [ ] Fetch sets for a game
- [ ] Fetch cards for a set
- [ ] Batch fetch cards
- [ ] Verify rate limit info updates
- [ ] Test with rate limited state

**Steps**:

1. Set up test environment with real API key
2. Make API calls through service
3. Verify data persists to database
4. Check rate limit info updates
5. Test rate limit scenarios

---

### 2. Test Rate Limit Scenarios

**Scenarios**:

- [ ] Jobs reschedule when rate limited
- [ ] Manual requests check rate limits
- [ ] Rate limit info displays correctly
- [ ] Rate limits reset correctly

**Steps**:

1. Set user to rate limited state
2. Try to make API request
3. Verify request is blocked/rescheduled
4. Wait for reset time
5. Verify requests work again

---

### 3. Test Inventory Management

**Scenarios**:

- [ ] Add card to inventory
- [ ] Inventory variants created automatically
- [ ] Update variant quantity
- [ ] Remove card from inventory
- [ ] Resync inventory variants
- [ ] Price updates work

**Steps**:

1. Add a card to inventory
2. Verify variants created
3. Update quantities
4. Remove card
5. Resync variants
6. Update prices

---

### 4. Test Game Event Creation

**Scenarios**:

- [ ] Create event
- [ ] Edit event
- [ ] Delete event
- [ ] Filter events
- [ ] Events display correctly

**Steps**:

1. Create a game event
2. Edit the event
3. Delete the event
4. Test filtering

---

### 5. Test Data Synchronization

**Scenarios**:

- [ ] Track a game
- [ ] Discover sets for tracked game
- [ ] Track a set
- [ ] Sync cards for tracked set
- [ ] Verify incremental updates work

**Steps**:

1. Track a game
2. Run discover-sets job
3. Track a set
4. Run sync-tracked-sets job
5. Verify data in database

---

### 6. Test Manual API Requests

**Scenarios**:

- [ ] Discover sets button works
- [ ] Sync set button works
- [ ] Update prices button works
- [ ] Rate limit checks work
- [ ] Success/error messages display

**Steps**:

1. Click "Discover Sets" button
2. Click "Sync Set" button
3. Click "Update Prices" button
4. Verify rate limit checks
5. Check flash messages

---

## Testing Checklist

- [ ] All manual test scenarios completed
- [ ] No errors encountered
- [ ] All features working as expected
- [ ] Rate limits respected
- [ ] Data persists correctly
- [ ] UI displays correctly
- [ ] Forms validate correctly

---

## Completion Checklist

- [ ] Real API testing completed
- [ ] Rate limit scenarios tested
- [ ] Inventory management tested
- [ ] Game event creation tested
- [ ] Data synchronization tested
- [ ] Manual API requests tested
- [ ] All manual tests passed
