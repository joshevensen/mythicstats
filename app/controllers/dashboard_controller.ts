import type { HttpContext } from '@adonisjs/core/http'
import InventoryItem from '#models/inventory_item'
import InventoryItemVariant from '#models/inventory_item_variant'
import TrackedSet from '#models/tracked_set'
import JustTCGService from '#services/just_tcg_service'

export default class DashboardController {
  async index({ auth, view }: HttpContext) {
    const user = await auth.getUserOrFail()

    const inventoryItems = await InventoryItem.query()
      .where('user_id', user.id)
      .preload('variants', (q) => q.preload('variant'))

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
    const apiStatus = justTcg.getRateLimitStatus()

    const recentSyncs = await TrackedSet.query()
      .where('user_id', user.id)
      .whereNotNull('last_sync_at')
      .orderBy('last_sync_at', 'desc')
      .limit(5)
      .preload('set')

    const recentPriceUpdates = await InventoryItemVariant.query()
      .whereHas('inventoryItem', (q) => q.where('user_id', user.id))
      .whereNotNull('last_price_update_at')
      .orderBy('last_price_update_at', 'desc')
      .limit(5)
      .preload('inventoryItem', (q) => q.preload('card'))

    return view.render('pages/dashboard', {
      inventorySummary: { totalCards, totalQuantity, totalValue },
      apiStatus,
      recentActivity: { syncs: recentSyncs, priceUpdates: recentPriceUpdates },
    })
  }
}


