# Phase 4: Data Synchronization

## Overview
Implement data synchronization logic for games, sets, cards, and price updates.

## Steps

1. [Sets Discovery](./01-sets-discovery.md) - Discover sets for tracked games
2. [Card Sync](./02-card-sync.md) - Sync cards for tracked sets
3. [Incremental Updates](./03-incremental-updates.md) - Implement incremental sync
4. [Price Updates](./04-price-updates.md) - Update card variant prices

## Dependencies

- Phase 2 complete (JustTCGService)
- Phase 3 complete (Job system)
- Phase 1 complete (Models)

## References

- [Services](../../docs/05-services.md) - Service methods
- [BullMQ Job System](../../docs/07-bullmq-job-system.md) - Job processors
- [User Workflows](../../docs/08-user-workflows.md) - Sync workflows

## Completion Criteria

- [ ] Sets discovery working
- [ ] Card sync working
- [ ] Incremental updates implemented
- [ ] Price updates working
- [ ] All sync logic tested

