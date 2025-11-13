# JustTCG API Integration

## Overview

Reference for the JustTCG API endpoints, rate limits, and SDK setup. For implementation details, see [Services](./05-services.md).

**Example Responses**: See `games.json`, `sets.json`, and `cards.json` in this directory for real API response examples.

## API Endpoints

Based on [JustTCG API Documentation](https://justtcg.com/docs):

### Games Endpoint

- **GET** `/v1/games` - List all available games
- **Response includes**: `id`, `name`, `cards_count`, `sets_count`, `last_updated`

### Sets Endpoint

- **GET** `/v1/sets?game={gameId}` - List sets for a game (game ID required)
- **Response includes**: `id`, `name`, `game_id`, `game`, `cards_count`, `release_date`

### Cards Endpoint

- **GET** `/v1/cards` - Card lookup/search endpoint
  - Query by ID: `cardId`
  - Query by set: `set={setId}`
  - Filter by: `condition`, `printing`
  - Pagination for query by set: `limit` (max 100 for paid, 20 for free), `offset`
- **POST** `/v1/cards` - Batch card lookup (up to 200 items for Enterprise, 100 for paid, 20 for free)
- **Response includes**: Card object with `variants` array containing pricing

**Pagination**:

- When querying by `set`, results are paginated
- Use `limit` (20 for free, 100 for paid) and `offset` to paginate
- Must make multiple requests to get all cards for most sets
- Example: `/v1/cards?set={setId}&limit=100&offset=0`

---

## Rate Limiting

### Plan Limits

Based on [JustTCG API Documentation](https://justtcg.com/docs#rate-limits--usage):

| Plan         | Monthly Limit    | Daily Limit     | Cards/Request     |
| ------------ | ---------------- | --------------- | ----------------- |
| Free         | 1,000 requests   | 100 requests    | 20 cards/request  |
| Starter      | 10,000 requests  | 1,000 requests  | 100 cards/request |
| Professional | 50,000 requests  | 5,000 requests  | 100 cards/request |
| Enterprise   | 500,000 requests | 50,000 requests | 200 cards/request |

### Reset Times

- **Daily limit**: Resets at midnight (00:00) UTC
- **Monthly limit**:
  - Free: On day of month account was created at midnight UTC
  - Paid: On successful payment at start of each billing cycle

### Rate Limit Metadata

Every API response includes `_metadata` (transformed to `usage` by SDK) with:

- Current plan
- Monthly/daily limits
- Requests used and remaining
- Rate limit per minute

This metadata is automatically extracted and stored in the `users` table after every API call.

---

## SDK Setup

### Installation

```bash
npm install justtcg-js
```

### Configuration

The SDK automatically uses the `JUSTTCG_API_KEY` environment variable for authentication.

**Environment Variable**:

```
JUSTTCG_API_KEY=your_api_key
```

**Note**: SDK handles base URL automatically, no need to configure.

### SDK Response Structure

The SDK returns `JustTCGApiResponse<T>` with:

- `data`: The main data payload
- `pagination`: Pagination metadata (total, limit, offset, hasMore)
  - **Note**: Raw API returns `meta`, SDK transforms to `pagination`
- `usage`: API usage metadata (transformed from `_metadata`)
  - **Note**: Raw API returns `_metadata`, SDK transforms to `usage`
  - `apiRequestLimit`, `apiDailyLimit`, `apiRateLimit`
  - `apiRequestsUsed`, `apiDailyRequestsUsed`
  - `apiRequestsRemaining`, `apiDailyRequestsRemaining`
  - `apiPlan`
- `error`: Error message (if API returns an error)
- `code`: Error code (if API returns an error)

**Raw API Response Structure**:

- Raw API responses include `meta` (pagination) and `_metadata` (rate limits)
- SDK automatically transforms these to `pagination` and `usage` for cleaner access
- See example JSON files (`games.json`, `sets.json`, `cards.json`) for raw response structure

### Error Handling

- **SDK-level errors** (authentication, invalid parameters): Thrown as exceptions
- **API-level errors** (validation, rate limits): Returned in `response.error` and `response.code` properties
- **Rate limit errors (429)**: Returned in response object, not thrown

---

## Integration Approach

### When to Use Which Method

**For syncing sets (primary use case)**:

- Use `getCardsBySet(setId)` - Handles pagination automatically, updates database

**For batch price updates**:

- Use `getCardsBatch(justTcgIds)` - Efficient for multiple specific cards/variants

**For single card lookup**:

- Use `getCard(justTcgId)` - Only when batching isn't possible (rare)

**For discovering sets**:

- Use `getSets(gameId)` - Fetches all sets for a game

**For initial game list**:

- Use `getGames()` - Fetches all available games

### Key Principles

1. **Always batch when possible** - Maximize cards per request (20-200 depending on plan)
2. **Pagination is automatic** - Services handle pagination for you
3. **Database updates are automatic** - JustTCGService upserts data automatically
4. **Rate limits are tracked** - Rate limit info updated after every API call
5. **Use JustTCG IDs** - All methods use JustTCG IDs as primary identifiers

---

## Implementation Details

For detailed implementation information, see:

- **[Services](./05-services.md)** - Service methods and business logic
- **[BullMQ Job System](./07-bullmq-job-system.md)** - Background job execution
- **[User Workflows](./08-user-workflows.md)** - User-facing processes
