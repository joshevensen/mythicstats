# Phase 2: JustTCG API Integration

## Overview

Set up the JustTCG API service wrapper with rate limiting, error handling, and all API methods.

## Steps

1. [API Service Setup](./01-api-service-setup.md) - Install SDK and create service
2. [API Methods](./02-api-methods.md) - Implement all API wrapper methods
3. [Rate Limiting Logic](./03-rate-limiting-logic.md) - Rate limit checking and updates
4. [Error Handling](./04-error-handling.md) - Handle API errors gracefully

## Dependencies

- Phase 1 complete (models available)
- `justtcg-js` package installed
- `JUSTTCG_API_KEY` environment variable set

## References

- [JustTCG API Integration](../../docs/06-just-tcg-api-integration.md) - API reference
- [Services](../../docs/05-services.md#1-justtcgservice) - Service specifications
- [Setup & Configuration](../../docs/02-setup-configuration.md) - Environment setup

## Completion Criteria

- [ ] JustTCGService created
- [ ] All API methods implemented
- [ ] Rate limiting logic working
- [ ] Error handling implemented
- [ ] Service tested with real API calls
