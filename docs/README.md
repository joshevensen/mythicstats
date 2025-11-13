# MythicStats Project Documentation

This directory contains the complete planning and design documentation for the MythicStats project.

## Documentation Index

### 1. [Project Overview](./01-project-overview.md)

High-level overview of the project, its purpose, core functionality, and technology stack.

**Read this first** to understand what we're building.

---

### 2. [Setup & Configuration](./02-setup-configuration.md)

Initial setup and configuration guide:

- Prerequisites and installation
- Environment variables
- Database and Redis setup
- Authentication setup
- BullMQ configuration
- Development workflow
- Production deployment

**Read this** before starting development or deployment.

---

### 3. [Database Schema](./03-database-schema.md)

Complete database schema design including:

- All tables with columns and types
- Relationships between tables
- Indexes and constraints
- Migration order

**Reference this** when creating migrations and models.

---

### 4. [Data Models](./04-data-models.md)

Lucid model specifications:

- All models with fields and types
- Model relationships
- Model methods and scopes
- Validation rules
- Model hooks

**Reference this** when creating Lucid models.

---

### 5. [Services](./05-services.md)

Service layer architecture and methods:

- JustTCGService (API wrapper)
- TrackingService (track/untrack games and sets)
- InventoryService (inventory management)
- CardService (manual corrections)
- ApiUsageService (rate limit stats)

**Reference this** when implementing business logic shared between jobs and controllers.

---

### 6. [JustTCG API Integration](./06-just-tcg-api-integration.md)

Reference for JustTCG API:

- API endpoints and structure
- Rate limiting details and plan limits
- SDK setup and configuration
- Integration approach and best practices

**Reference this** for JustTCG API details and integration guidance.

**Note**: Implementation details are in [Services](./05-services.md).

---

### 7. [BullMQ Job System](./07-bullmq-job-system.md)

Architecture for the job queue system:

- Job types and their purposes
- Job scheduling and priorities
- Rate limit integration
- Job processors structure
- Configuration

**Reference this** when setting up BullMQ and creating jobs.

---

### 8. [User Workflows](./08-user-workflows.md)

User-facing workflows for key processes:

- Initial setup
- Inventory management
- Price updates
- Rate limit status
- Game events
- Data synchronization

**Reference this** to understand user interactions and system behavior from the user's perspective.

**Note**: Technical job execution details are documented in [BullMQ Job System](./07-bullmq-job-system.md).

---

### 9. [Pages & Views](./09-pages-views.md)

Page structure and UI design:

- Dashboard
- Games, Sets, Cards pages
- Inventory management
- Game events
- API status

**Reference this** when building views and controllers.

---

### 10. [Implementation Plans](../plans/README.md)

Step-by-step implementation plans organized by phase:

- Phase-by-phase breakdown
- Individual task plans with detailed steps
- Code examples and references
- Completion checklists

**Use this** to track progress and plan development.

---

## Quick Start Guide

1. **Start here**: Read [Project Overview](./01-project-overview.md)
2. **Setup environment**: Follow [Setup & Configuration](./02-setup-configuration.md) to get your development environment ready
3. **Plan database**: Review [Database Schema](./03-database-schema.md) and [Data Models](./04-data-models.md)
4. **Understand architecture**: Read [Services](./05-services.md), [JustTCG API Integration](./06-just-tcg-api-integration.md), and [BullMQ Job System](./07-bullmq-job-system.md)
5. **Start building**: Follow [Implementation Plans](../plans/README.md)
6. **Reference as needed**: Use [User Workflows](./08-user-workflows.md) and [Pages & Views](./09-pages-views.md) during development

---

## Key Concepts

### Rate Limiting

- Tracked in `users` table with fields: `api_requests_remaining`, `api_daily_requests_remaining`, `api_plan`, etc.
- When `api_requests_remaining > 0` and `api_daily_requests_remaining > 0`: API can be accessed
- When either is 0: Jobs wait until limits reset (daily at midnight UTC, monthly based on plan)
- Rate limit info is automatically updated from SDK response `usage` object after every API call

### Tracked Games

- Only games in `tracked_games` table are synced
- Prevents unnecessary API calls
- User controls which games to track

### Inventory Priority

- Cards in inventory get price updates more frequently
- Inventory items have `last_price_update_at` to track update frequency
- Price updates prioritize inventory items

### Job System

- BullMQ manages all background jobs
- Jobs check rate limits before making API calls
- Jobs reschedule themselves when rate limited
- Hourly jobs for regular updates

---

## Notes

- This is an **internal tool** for personal use only
- All API calls must respect JustTCG rate limits
- Rate limit tracking is critical to avoid API spam
- Jobs should be resilient to failures and rate limits
- Data synchronization should be incremental when possible

---

## Questions or Updates

As the project evolves, update these documents to reflect:

- Changes in API structure
- Additional features
- Refinements to workflows
- Lessons learned during implementation
