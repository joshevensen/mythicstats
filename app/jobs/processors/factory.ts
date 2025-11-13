import User from '#models/user'
import type { BaseProcessor } from './base_processor.js'
import { DiscoverSetsProcessor } from './discover_sets_processor.js'
import { SyncTrackedSetsProcessor } from './sync_tracked_sets_processor.js'
import { UpdateInventoryPricesProcessor } from './update_inventory_prices_processor.js'

export class ProcessorFactory {
  static create(jobName: string, user: User): BaseProcessor {
    switch (jobName) {
      case 'discover-sets':
        return new DiscoverSetsProcessor(user)
      case 'sync-tracked-sets':
        return new SyncTrackedSetsProcessor(user)
      case 'update-inventory-prices':
        return new UpdateInventoryPricesProcessor(user)
      default:
        throw new Error(`Unknown job type: ${jobName}`)
    }
  }
}
