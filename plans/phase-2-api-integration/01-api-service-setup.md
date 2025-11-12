# API Service Setup

## Overview
Install the JustTCG SDK and create the base JustTCGService wrapper class.

## Step-by-Step Plan

### 1. Install JustTCG SDK

**Command**:
```bash
npm install justtcg-js
```

**Verify Installation**:
```bash
npm list justtcg-js
```

---

### 2. Verify Environment Variable

**File**: `.env`

**Check**:
- `JUSTTCG_API_KEY` is set
- Value is valid (get from JustTCG dashboard)

**Reference**: [Setup & Configuration](../../docs/02-setup-configuration.md) - Environment variables section

---

### 3. Create Service Directory

**Action**: Create services directory if it doesn't exist

**Directory**: `app/services/`

**Command** (if needed):
```bash
mkdir -p app/services
```

---

### 4. Create JustTCGService Class

**File**: `app/services/JustTCGService.ts`

**Structure**:
```typescript
import { JustTCG } from 'justtcg-js'
import User from '#models/user'
import type { JustTCGApiResponse } from 'justtcg-js'

export default class JustTCGService {
  private client: JustTCG
  private user: User

  constructor(user: User) {
    this.user = user
    this.client = new JustTCG() // SDK automatically uses JUSTTCG_API_KEY env var
  }

  // Methods will be added in next step
}
```

**Key Points**:
- SDK automatically reads `JUSTTCG_API_KEY` from environment
- Service is instantiated with a User instance (for rate limit checking)
- Client is created once per service instance

**Reference**: [Services - JustTCGService](../../docs/05-services.md#1-justtcgservice)

---

### 5. Add Rate Limit Helper Methods

**File**: `app/services/JustTCGService.ts`

**Add Methods**:
```typescript
/**
 * Check if API can be accessed
 */
async checkRateLimit(): Promise<boolean> {
  return this.user.canMakeApiRequest()
}

/**
 * Update rate limit info from SDK response
 */
async updateRateLimitInfo(response: JustTCGApiResponse<any>): Promise<void> {
  if (response.usage) {
    await this.user.updateRateLimitInfo(response.usage)
  }
}
```

**Reference**: [Data Models - User Model](../../docs/04-data-models.md#1-user-model) for `canMakeApiRequest()` and `updateRateLimitInfo()` methods

---

## Testing

After setup, verify service can be instantiated:

```typescript
// In REPL or test
const User = await import('#models/user')
const JustTCGService = await import('#services/JustTCGService')

const user = await User.default.first()
const service = new JustTCGService.default(user)

console.log('Service created successfully')
```

---

## Completion Checklist

- [ ] `justtcg-js` package installed
- [ ] `JUSTTCG_API_KEY` environment variable set
- [ ] `JustTCGService` class created
- [ ] Service can be instantiated with User
- [ ] Rate limit helper methods added
- [ ] No TypeScript errors

