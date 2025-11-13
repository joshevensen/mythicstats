import InventoryItem from '#models/inventory_item'
import InventoryItemVariant from '#models/inventory_item_variant'
import Card from '#models/card'
import PriceUpdateService from './price_update_service.js'

export default class InventoryService {
  async addCardToInventory(userId: number, cardId: number, notes?: string) {
    await Card.findOrFail(cardId)
    const existing = await InventoryItem.query().where('user_id', userId).where('card_id', cardId).first()
    if (existing) {
      if (notes !== undefined) {
        existing.notes = notes
        await existing.save()
      }
      return existing
    }
    return await InventoryItem.create({ userId, cardId, notes: notes ?? null })
  }

  async removeCardFromInventory(inventoryItemId: number, userId: number): Promise<boolean> {
    const item = await InventoryItem.query().where('id', inventoryItemId).where('user_id', userId).first()
    if (!item) return false
    await item.delete()
    return true
  }

  async updateVariantQuantity(inventoryItemVariantId: number, quantity: number, userId: number) {
    const variant = await InventoryItemVariant.query()
      .where('id', inventoryItemVariantId)
      .whereHas('inventoryItem', (q) => q.where('user_id', userId))
      .firstOrFail()
    variant.quantity = quantity
    await variant.save()
    return variant
  }

  async resyncInventoryVariants(inventoryItemId: number, userId: number) {
    const item = await InventoryItem.query().where('id', inventoryItemId).where('user_id', userId).firstOrFail()
    // AfterCreate hook on InventoryItem creates variants when created.
    // Here, we resync to current card variants.
    const cardVariants = await (await item.related('card').query().firstOrFail()).related('variants').query()
    const existing = await item.related('variants').query()
    const existingByVariantId = new Map(existing.map((iv) => [iv.variantId, iv]))

    let added = 0
    const keepIds = new Set<number>()

    // Add missing
    for (const cv of cardVariants) {
      keepIds.add(cv.id)
      if (!existingByVariantId.has(cv.id)) {
        await InventoryItemVariant.create({
          inventoryItemId: item.id,
          variantId: cv.id,
          quantity: 0,
        })
        added++
      }
    }

    // Remove variants that no longer exist on card
    let removed = 0
    for (const iv of existing) {
      if (!keepIds.has(iv.variantId)) {
        await iv.delete()
        removed++
      }
    }

    return { added, removed }
  }

  async updateInventoryPrices(userId: number): Promise<void> {
    const priceService = new PriceUpdateService()
    await priceService.updateInventoryPrices(userId)
  }
}


