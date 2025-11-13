import type { HttpContext } from '@adonisjs/core/http'
import InventoryItem from '#models/inventory_item'
import InventoryItemVariant from '#models/inventory_item_variant'
import TrackedSet from '#models/tracked_set'
import JustTCGService from '#services/just_tcg_service'

export default class DashboardController {
  async index({ auth, inertia }: HttpContext) {
    const user = await auth.getUserOrFail()

    const inventoryItems = await InventoryItem.query()
      .where('user_id', user.id)
      .preload('variants', (q) => q.preload('variant'))
      .preload('card', (q) => q.preload('set'))

    const totalCards = inventoryItems.length
    const totalQuantity = inventoryItems.reduce(
      (sum, item) => sum + item.variants.reduce((qty, v) => qty + v.quantity, 0),
      0
    )
    let totalValue = 0
    for (const item of inventoryItems) {
      for (const v of item.variants) {
        totalValue += v.quantity * (v.variant?.price ?? 0)
      }
    }

    const justTcg = new JustTCGService(user)
    const apiStatusRaw = justTcg.getRateLimitStatus()
    const apiStatus = {
      ...apiStatusRaw,
      resetTime: apiStatusRaw.resetTime?.toISO() ?? null,
    }

    const recentSyncsModels = await TrackedSet.query()
      .where('user_id', user.id)
      .whereNotNull('last_sync_at')
      .orderBy('last_sync_at', 'desc')
      .limit(5)
      .preload('set', (q) => q.preload('game'))

    const recentSyncs = recentSyncsModels.map((trackedSet) => ({
      id: trackedSet.id,
      lastSyncAt: trackedSet.lastSyncAt?.toISO() ?? null,
      set: trackedSet.set
        ? {
            id: trackedSet.set.id,
            name: trackedSet.set.name,
            slug: trackedSet.set.slug,
            releaseDate: trackedSet.set.releaseDate?.toISODate() ?? null,
            game: trackedSet.set.game
              ? {
                  id: trackedSet.set.game.id,
                  name: trackedSet.set.game.name,
                }
              : null,
          }
        : null,
    }))

    const recentPriceUpdateModels = await InventoryItemVariant.query()
      .whereHas('inventoryItem', (q) => q.where('user_id', user.id))
      .whereNotNull('last_price_update_at')
      .orderBy('last_price_update_at', 'desc')
      .limit(5)
      .preload('inventoryItem', (q) => q.preload('card', (card) => card.preload('set')))
      .preload('variant')

    const recentPriceUpdates = recentPriceUpdateModels.map((variant) => ({
      id: variant.id,
      lastPriceUpdateAt: variant.lastPriceUpdateAt?.toISO() ?? null,
      price: variant.variant?.price ?? null,
      condition: variant.variant?.condition ?? null,
      inventoryItem: variant.inventoryItem
        ? {
            id: variant.inventoryItem.id,
            notes: variant.inventoryItem.notes,
            card: variant.inventoryItem.card
              ? {
                  id: variant.inventoryItem.card.id,
                  name: variant.inventoryItem.card.name,
                  number: variant.inventoryItem.card.number,
                  set: variant.inventoryItem.card.set
                    ? {
                        id: variant.inventoryItem.card.set.id,
                        name: variant.inventoryItem.card.set.name,
                        slug: variant.inventoryItem.card.set.slug,
                      }
                    : null,
                }
              : null,
          }
        : null,
    }))

    return inertia.render('Dashboard/Index', {
      inventorySummary: { totalCards, totalQuantity, totalValue },
      apiStatus,
      recentActivity: {
        syncs: recentSyncs,
        priceUpdates: recentPriceUpdates,
      },
    })
  }
}
