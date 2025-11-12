# Rate Limiting Logic

## Overview
Implement comprehensive rate limiting logic that checks limits before API calls and updates rate limit information after every response.

## Step-by-Step Plan

### 1. Enhance `checkRateLimit()` Method

**File**: `app/services/JustTCGService.ts`

**Current**: Basic check for remaining requests

**Enhancement**: Add detailed checks and error messages

**Implementation**:
```typescript
async checkRateLimit(count: number = 1): Promise<{ canMake: boolean; reason?: string }> {
  // Check monthly limit
  if (this.user.apiRequestsRemaining < count) {
    return {
      canMake: false,
      reason: `Monthly limit exceeded. ${this.user.apiRequestsRemaining} remaining, need ${count}`,
    }
  }

  // Check daily limit
  if (this.user.apiDailyRequestsRemaining < count) {
    return {
      canMake: false,
      reason: `Daily limit exceeded. ${this.user.apiDailyRequestsRemaining} remaining, need ${count}`,
    }
  }

  // Check per-minute rate limit (if implemented)
  // This would require tracking recent requests in memory or Redis

  return { canMake: true }
}
```

**Reference**: [Data Models - User Model](../../docs/04-data-models.md#1-user-model) for rate limit methods

---

### 2. Enhance `updateRateLimitInfo()` Method

**File**: `app/services/JustTCGService.ts`

**Purpose**: Extract and update rate limit info from SDK response `usage` object

**SDK Response Structure**:
```typescript
{
  data: [...],
  usage: {
    plan: string,
    monthly_limit: number,
    daily_limit: number,
    rate_limit: number,
    requests_used: number,
    daily_requests_used: number,
    requests_remaining: number,
    daily_requests_remaining: number,
  }
}
```

**Implementation**:
```typescript
async updateRateLimitInfo(response: JustTCGApiResponse<any>): Promise<void> {
  if (!response.usage) {
    return // No usage info in response
  }

  const usage = response.usage

  // Update user with rate limit info
  this.user.apiPlan = usage.plan
  this.user.apiMonthlyLimit = usage.monthly_limit
  this.user.apiDailyLimit = usage.daily_limit
  this.user.apiRateLimit = usage.rate_limit
  this.user.apiRequestsUsed = usage.requests_used
  this.user.apiDailyRequestsUsed = usage.daily_requests_used
  this.user.apiRequestsRemaining = usage.requests_remaining
  this.user.apiDailyRequestsRemaining = usage.daily_requests_remaining
  this.user.apiLimitInfoUpdatedAt = DateTime.now()

  await this.user.save()
}
```

**Reference**: [Services - updateRateLimitInfo()](../../docs/05-services.md#updateratelimitinfouser-user-response-justtcgapiresponseany)

---

### 3. Add Rate Limit Checking to All API Methods

**File**: `app/services/JustTCGService.ts`

**Action**: Update all API methods to use enhanced rate limit checking

**Pattern**:
```typescript
async someApiMethod(...args): Promise<...> {
  // Check rate limit
  const rateLimitCheck = await this.checkRateLimit(1) // or count needed
  if (!rateLimitCheck.canMake) {
    throw new Error(`Cannot make API request: ${rateLimitCheck.reason}`)
  }

  // Make API call
  const response = await this.client.v1.someMethod(...)

  // Update rate limit info
  await this.updateRateLimitInfo(response)

  // ... rest of method
}
```

**Methods to Update**:
- `getGames()`
- `getSets()`
- `getCardsBySet()` (check before each page)
- `getCardsByGame()` (check before each page)
- `getCardsBatch()` (check before each batch)
- `getCard()`

---

### 4. Handle Rate Limit Errors from API

**File**: `app/services/JustTCGService.ts`

**Purpose**: Handle 429 (rate limit) errors returned by API

**SDK Error Structure**:
```typescript
{
  error: {
    code: 429,
    message: 'Rate limit exceeded',
  },
  usage: { ... } // May still include usage info
}
```

**Implementation**:
```typescript
async handleApiError(response: JustTCGApiResponse<any>): Promise<void> {
  if (response.error && response.error.code === 429) {
    // Update rate limit info even on error (if available)
    if (response.usage) {
      await this.updateRateLimitInfo(response)
    }

    // Calculate reset time
    const resetTime = this.calculateResetTime()

    throw new Error(`Rate limit exceeded. Resets at ${resetTime}`)
  }

  // Handle other errors
  if (response.error) {
    throw new Error(`API Error: ${response.error.message}`)
  }
}
```

---

### 5. Add Reset Time Calculation

**File**: `app/services/JustTCGService.ts`

**Purpose**: Calculate when rate limits reset

**Implementation**:
```typescript
calculateResetTime(): DateTime {
  // Daily reset: midnight UTC
  const now = DateTime.now().setZone('UTC')
  const dailyReset = now.startOf('day').plus({ days: 1 })

  // Monthly reset: depends on plan
  // For now, assume first of next month
  const monthlyReset = now.startOf('month').plus({ months: 1 })

  // Return the earlier reset time
  return dailyReset < monthlyReset ? dailyReset : monthlyReset
}
```

**Reference**: [User Model - getDailyResetTime()](../../docs/04-data-models.md#1-user-model) and `getMonthlyResetTime()`

---

### 6. Add Rate Limit Status Method

**File**: `app/services/JustTCGService.ts`

**Purpose**: Get current rate limit status (for UI display)

**Implementation**:
```typescript
getRateLimitStatus(): {
  plan: string | null
  monthly: {
    limit: number | null
    used: number | null
    remaining: number | null
    percentage: number
  }
  daily: {
    limit: number | null
    used: number | null
    remaining: number | null
    percentage: number
  }
  canMakeRequest: boolean
  resetTime: DateTime | null
} {
  return {
    plan: this.user.apiPlan,
    monthly: {
      limit: this.user.apiMonthlyLimit,
      used: this.user.apiRequestsUsed,
      remaining: this.user.apiRequestsRemaining,
      percentage: this.user.apiMonthlyLimit
        ? (this.user.apiRequestsUsed || 0) / this.user.apiMonthlyLimit * 100
        : 0,
    },
    daily: {
      limit: this.user.apiDailyLimit,
      used: this.user.apiDailyRequestsUsed,
      remaining: this.user.apiDailyRequestsRemaining,
      percentage: this.user.apiDailyLimit
        ? (this.user.apiDailyRequestsUsed || 0) / this.user.apiDailyLimit * 100
        : 0,
    },
    canMakeRequest: this.user.canMakeApiRequest(),
    resetTime: this.calculateResetTime(),
  }
}
```

---

## Testing

Test rate limiting:

```typescript
// In REPL
const User = await import('#models/user')
const JustTCGService = await import('#services/JustTCGService')

const user = await User.default.first()
const service = new JustTCGService.default(user)

// Check rate limit status
const status = service.getRateLimitStatus()
console.log('Rate limit status:', status)

// Try to make request when rate limited
try {
  await service.getGames()
} catch (error) {
  console.log('Rate limit error:', error.message)
}
```

---

## Completion Checklist

- [ ] Enhanced `checkRateLimit()` with detailed checks
- [ ] Enhanced `updateRateLimitInfo()` extracts all usage fields
- [ ] All API methods check rate limits before calls
- [ ] All API methods update rate limit info after calls
- [ ] Rate limit errors (429) handled gracefully
- [ ] Reset time calculation implemented
- [ ] Rate limit status method implemented
- [ ] Rate limiting tested with real API calls
- [ ] Rate limit info persists correctly to database

