# Integration Tests

## Overview

Create integration tests for API integration, job execution, and data synchronization.

## Step-by-Step Plan

### 1. Test API Integration (with Mocks)

**Files**: `tests/integration/api/`

**Purpose**: Test JustTCGService with mocked SDK responses

**Scenarios**:

- Successful API calls
- Rate limit errors
- Network errors
- Invalid responses

**Note**: Mock `justtcg-js` SDK to avoid real API calls

---

### 2. Test Job Execution

**Files**: `tests/integration/jobs/`

**Purpose**: Test job processors with mocked services

**Scenarios**:

- Jobs execute successfully
- Jobs handle rate limits
- Jobs reschedule correctly
- Jobs update timestamps

**Note**: Use test Redis instance or mock BullMQ

---

### 3. Test Data Synchronization

**Files**: `tests/integration/sync/`

**Purpose**: Test sync logic end-to-end

**Scenarios**:

- Sets discovery syncs sets to database
- Card sync syncs cards and variants
- Price updates update variant prices
- Incremental updates work correctly

---

### 4. Test Rate Limit Handling

**Files**: `tests/integration/rate_limits/`

**Purpose**: Test rate limit integration

**Scenarios**:

- Jobs reschedule when rate limited
- Rate limit info updates from API responses
- Controllers check rate limits before manual requests

---

## Testing

Run integration tests:

```bash
npm test -- --files tests/integration
```

---

## Completion Checklist

- [ ] API integration tests written
- [ ] Job execution tests written
- [ ] Data synchronization tests written
- [ ] Rate limit handling tests written
- [ ] All integration tests passing
- [ ] Mocks working correctly
