# Phase 3: BullMQ Job System

## Overview

Set up BullMQ job queue system with processors, scheduling, and rate limit integration.

## Steps

1. [BullMQ Setup](./01-bullmq-setup.md) - Install packages and configure
2. [Job Processors](./02-job-processors.md) - Create job processors
3. [Job Scheduling](./03-job-scheduling.md) - Set up repeatable jobs
4. [Rate Limit Integration](./04-rate-limit-integration.md) - Integrate rate limits with jobs

## Dependencies

- Phase 2 complete (JustTCGService available)
- Redis running
- BullMQ packages installed

## References

- [BullMQ Job System](../../docs/07-bullmq-job-system.md) - Job system architecture
- [Services](../../docs/05-services.md) - Service methods used by jobs
- [Setup & Configuration](../../docs/02-setup-configuration.md) - Redis setup

## Completion Criteria

- [ ] BullMQ configured
- [ ] All job processors created
- [ ] Jobs scheduled correctly
- [ ] Rate limit integration working
- [ ] Jobs can run successfully
