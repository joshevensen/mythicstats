import { DateTime } from 'luxon'
import type { Job } from 'bullmq'
import User from '#models/user'
import InventoryItemVariant from '#models/inventory_item_variant'
import { BaseProcessor } from './base_processor.js'

export class UpdateInventoryPricesProcessor extends BaseProcessor {
  constructor(user: User) {
    super(user)
  }

  protected async handle(job: Job): Promise<void> {
    const invVariants = await InventoryItemVariant.query()
      .whereHas('inventoryItem', (q) => q.where('user_id', this.user.id))
      .where((q) => {
        q.whereNull('last_price_update_at').orWhere(
          'last_price_update_at',
          '<',
          DateTime.now().minus({ days: 1 }).toSQL()
        )
      })
      .preload('variant')

    const justTcgCardIds = Array.from(
      new Set(
        invVariants
          .map((iv) => iv.variant)
          .filter((v): v is NonNullable<typeof v> => !!v)
          .map((v) => v.cardId)
      )
    )

    if (justTcgCardIds.length === 0) {
      return
    }

    // We will call getCardsBatch with card JustTCG ids indirectly through variant->card mapping inside service
    // To reuse PriceUpdateService mapping would require duplicate logic here, so we fetch per batch using the service API.
    // Build a set of invVariant IDs to mark after each batch by matching cardId -> updates
    // Simplify: rely on DB upserts by getCardsBatch and then mark all needing updates as updated in one shot

    const batchSize = this.user.apiPlan === 'Free Tier' ? 20 : 100
    for (let i = 0; i < justTcgCardIds.length; i += batchSize) {
      const canProceed = await this.checkAndHandleRateLimit(job, 1)
      if (!canProceed) return
      const batch = justTcgCardIds.slice(i, i + batchSize)
      await this.justTcgService.getCardsBatch(batch as unknown as string[])
      await job.updateProgress({ processed: Math.min(i + batchSize, justTcgCardIds.length), total: justTcgCardIds.length })
    }

    // Mark all inventory variants as updated now
    const allInvIds = invVariants.map((iv) => iv.id)
    if (allInvIds.length > 0) {
      await InventoryItemVariant.query()
        .whereIn('id', allInvIds)
        .update({ last_price_update_at: DateTime.now().toSQL() })
    }
  }
}


