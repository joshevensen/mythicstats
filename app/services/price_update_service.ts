import { DateTime } from 'luxon'
import User from '#models/user'
import InventoryItemVariant from '#models/inventory_item_variant'
import Card from '#models/card'
import JustTCGService from './just_tcg_service.js'

/**
 * PriceUpdateService
 *
 * Updates prices for inventory variants using batch fetches.
 * Prioritizes inventory items and updates `last_price_update_at` after each batch.
 */
export default class PriceUpdateService {
  /**
   * Update prices for all inventory variants that need a refresh for a user.
   * Uses batching based on API plan. Updates DB via JustTCGService upserts.
   */
  async updateInventoryPrices(userId: number): Promise<void> {
    const user = await User.findOrFail(userId)
    const justTcg = new JustTCGService(user)

    // Variants needing price update (quantity > 0 and stale timestamps)
    const invVariants = await InventoryItemVariant.query()
      .whereHas('inventoryItem', (q) => q.where('user_id', userId))
      .where((q) => {
        q.whereNull('last_price_update_at').orWhere(
          'last_price_update_at',
          '<',
          DateTime.now().minus({ days: 1 }).toSQL()
        )
      })
      .preload('variant')

    if (invVariants.length === 0) {
      return
    }

    // Collect the owning card JustTCG IDs for each variant
    // We prefer card IDs because getCardsBatch currently posts { cardId }
    const cardIdsByInvVariantId: Map<number, string> = new Map()
    const uniqueCardDbIds = new Set<number>()
    for (const iv of invVariants) {
      if (iv.variant) {
        uniqueCardDbIds.add(iv.variant.cardId)
      }
    }

    if (uniqueCardDbIds.size === 0) {
      return
    }

    // Load all cards to map DB cardId -> justTcgCardId
    const cards = await Card.query().whereIn('id', Array.from(uniqueCardDbIds))
    const dbCardIdToJustTcgId = new Map<number, string>()
    for (const c of cards) {
      if (c.justTcgCardId) {
        dbCardIdToJustTcgId.set(c.id, c.justTcgCardId)
      }
    }

    for (const iv of invVariants) {
      const dbCardId = iv.variant?.cardId
      if (dbCardId && dbCardIdToJustTcgId.has(dbCardId)) {
        cardIdsByInvVariantId.set(iv.id, dbCardIdToJustTcgId.get(dbCardId)!)
      }
    }

    const allCardJustTcgIds = Array.from(new Set(cardIdsByInvVariantId.values()))
    if (allCardJustTcgIds.length === 0) {
      return
    }

    // Determine batch size from plan
    const batchSize = user.apiPlan === 'Free Tier' ? 20 : 100

    for (let i = 0; i < allCardJustTcgIds.length; i += batchSize) {
      const batch = allCardJustTcgIds.slice(i, i + batchSize)

      // Fetch and persist latest prices for cards and their variants
      await justTcg.getCardsBatch(batch)

      // Mark matching inventory variants as updated
      const invVariantIdsToMark: number[] = []
      for (const [invVariantId, justTcgCardId] of cardIdsByInvVariantId.entries()) {
        if (batch.includes(justTcgCardId)) {
          invVariantIdsToMark.push(invVariantId)
        }
      }

      if (invVariantIdsToMark.length > 0) {
        await InventoryItemVariant.query()
          .whereIn('id', invVariantIdsToMark)
          .update({ last_price_update_at: DateTime.now().toSQL() })
      }
    }
  }

  /**
   * Manually update prices for a single inventory item or all inventory items.
   * When inventoryItemId is provided, restricts to that item.
   */
  async updatePricesForInventory(userId: number, inventoryItemId?: number): Promise<void> {
    const user = await User.findOrFail(userId)
    const justTcg = new JustTCGService(user)

    let query = InventoryItemVariant.query().whereHas('inventoryItem', (q) =>
      q.where('user_id', userId)
    )
    if (inventoryItemId) {
      query = query.where('inventory_item_id', inventoryItemId)
    }
    const invVariants = await query.preload('variant')

    if (invVariants.length === 0) {
      return
    }

    // Same mapping approach as bulk update
    const cardIdsByInvVariantId: Map<number, string> = new Map()
    const uniqueCardDbIds = new Set<number>()
    for (const iv of invVariants) {
      if (iv.variant) {
        uniqueCardDbIds.add(iv.variant.cardId)
      }
    }
    if (uniqueCardDbIds.size === 0) {
      return
    }

    const cards = await Card.query().whereIn('id', Array.from(uniqueCardDbIds))
    const dbCardIdToJustTcgId = new Map<number, string>()
    for (const c of cards) {
      if (c.justTcgCardId) {
        dbCardIdToJustTcgId.set(c.id, c.justTcgCardId)
      }
    }
    for (const iv of invVariants) {
      const dbCardId = iv.variant?.cardId
      if (dbCardId && dbCardIdToJustTcgId.has(dbCardId)) {
        cardIdsByInvVariantId.set(iv.id, dbCardIdToJustTcgId.get(dbCardId)!)
      }
    }

    const allCardJustTcgIds = Array.from(new Set(cardIdsByInvVariantId.values()))
    if (allCardJustTcgIds.length === 0) {
      return
    }

    const batchSize = user.apiPlan === 'Free Tier' ? 20 : 100
    for (let i = 0; i < allCardJustTcgIds.length; i += batchSize) {
      const batch = allCardJustTcgIds.slice(i, i + batchSize)
      await justTcg.getCardsBatch(batch)

      const invVariantIdsToMark: number[] = []
      for (const [invVariantId, justTcgCardId] of cardIdsByInvVariantId.entries()) {
        if (batch.includes(justTcgCardId)) {
          invVariantIdsToMark.push(invVariantId)
        }
      }
      if (invVariantIdsToMark.length > 0) {
        await InventoryItemVariant.query()
          .whereIn('id', invVariantIdsToMark)
          .update({ last_price_update_at: DateTime.now().toSQL() })
      }
    }
  }
}
