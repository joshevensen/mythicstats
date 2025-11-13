# Error Handling

## Overview

Implement comprehensive error handling for API calls, network errors, and invalid responses.

## Step-by-Step Plan

### 1. Create Error Types

**File**: `app/services/JustTCGService.ts` (or separate `app/services/errors.ts`)

**Purpose**: Define custom error types for better error handling

**Implementation**:

```typescript
export class RateLimitError extends Error {
  constructor(
    message: string,
    public resetTime?: DateTime,
    public usage?: any
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}
```

---

### 2. Handle SDK Errors

**File**: `app/services/JustTCGService.ts`

**Purpose**: Wrap SDK calls with error handling

**Implementation**:

```typescript
private async handleSdkCall<T>(
  apiCall: () => Promise<JustTCGApiResponse<T>>
): Promise<JustTCGApiResponse<T>> {
  try {
    const response = await apiCall()

    // Check for API-level errors in response
    if (response.error) {
      await this.handleApiError(response)
    }

    // Update rate limit info (even on error, if usage available)
    if (response.usage) {
      await this.updateRateLimitInfo(response)
    }

    return response
  } catch (error) {
    // Handle network errors
    if (error instanceof Error && error.message.includes('network')) {
      throw new NetworkError('Network error occurred', error)
    }

    // Handle SDK errors
    throw new ApiError(`SDK Error: ${error.message}`, undefined, error)
  }
}
```

---

### 3. Handle Rate Limit Errors (429)

**File**: `app/services/JustTCGService.ts`

**Purpose**: Handle rate limit errors specifically

**Implementation**:

```typescript
private async handleApiError(response: JustTCGApiResponse<any>): Promise<void> {
  if (response.error?.code === 429) {
    // Rate limit exceeded
    const resetTime = this.calculateResetTime()

    throw new RateLimitError(
      'Rate limit exceeded. Please try again later.',
      resetTime,
      response.usage
    )
  }

  // Other API errors
  if (response.error) {
    throw new ApiError(
      response.error.message || 'API error occurred',
      response.error.code,
      response
    )
  }
}
```

---

### 4. Add Retry Logic for Network Errors

**File**: `app/services/JustTCGService.ts`

**Purpose**: Retry network errors with exponential backoff

**Implementation**:

```typescript
private async retryWithBackoff<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error as Error

      // Don't retry rate limit errors
      if (error instanceof RateLimitError) {
        throw error
      }

      // Don't retry non-network errors
      if (!(error instanceof NetworkError)) {
        throw error
      }

      // Calculate delay (exponential backoff)
      const delay = initialDelay * Math.pow(2, attempt)

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
```

**Usage**:

```typescript
async getGames(): Promise<JustTCGApiResponse<Game[]>> {
  return this.retryWithBackoff(async () => {
    // ... existing getGames logic
  })
}
```

---

### 5. Validate API Responses

**File**: `app/services/JustTCGService.ts`

**Purpose**: Validate response structure before processing

**Implementation**:

```typescript
private validateResponse<T>(response: JustTCGApiResponse<T>): void {
  if (!response) {
    throw new ApiError('Invalid response: response is null or undefined')
  }

  if (!response.data && !response.error) {
    throw new ApiError('Invalid response: missing data and error fields')
  }

  // Validate data structure if needed
  if (response.data && !Array.isArray(response.data) && typeof response.data !== 'object') {
    throw new ApiError('Invalid response: data is not in expected format')
  }
}
```

---

### 6. Add Logging

**File**: `app/services/JustTCGService.ts`

**Purpose**: Log errors for debugging

**Implementation**:

```typescript
import logger from '@adonisjs/core/services/logger'

private logError(error: Error, context: Record<string, any> = {}): void {
  logger.error('JustTCGService error', {
    error: error.message,
    name: error.name,
    stack: error.stack,
    ...context,
  })
}
```

**Usage**:

```typescript
catch (error) {
  this.logError(error, { method: 'getGames', userId: this.user.id })
  throw error
}
```

---

### 7. Update All Methods with Error Handling

**File**: `app/services/JustTCGService.ts`

**Action**: Wrap all API methods with error handling

**Pattern**:

```typescript
async someApiMethod(...args): Promise<...> {
  try {
    // Check rate limit
    const rateLimitCheck = await this.checkRateLimit()
    if (!rateLimitCheck.canMake) {
      throw new RateLimitError(rateLimitCheck.reason!)
    }

    // Make API call with retry
    const response = await this.retryWithBackoff(async () => {
      return await this.handleSdkCall(() => this.client.v1.someMethod(...))
    })

    // Validate response
    this.validateResponse(response)

    // Process data
    // ...

    return response
  } catch (error) {
    this.logError(error as Error, { method: 'someApiMethod' })
    throw error
  }
}
```

---

## Testing

Test error handling:

```typescript
// In REPL or test
const User = await import('#models/user')
const JustTCGService = await import('#services/JustTCGService')

const user = await User.default.first()
const service = new JustTCGService.default(user)

// Test rate limit error
try {
  // Set user to rate limited state
  user.apiRequestsRemaining = 0
  await user.save()

  await service.getGames()
} catch (error) {
  console.log('Error type:', error.constructor.name)
  console.log('Error message:', error.message)
}

// Test network error (simulate by using invalid API key temporarily)
// Test invalid response (mock SDK response)
```

---

## Completion Checklist

- [ ] Custom error types created
- [ ] SDK errors handled
- [ ] Rate limit errors (429) handled
- [ ] Network errors handled with retry
- [ ] Response validation implemented
- [ ] Error logging implemented
- [ ] All methods wrapped with error handling
- [ ] Errors tested (rate limit, network, invalid response)
- [ ] Error messages are user-friendly
