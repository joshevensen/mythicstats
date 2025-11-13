import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import InventoryItem from '#models/inventory_item'
import InventoryItemVariant from '#models/inventory_item_variant'
import InventoryService from '#services/inventory_service'

export default class InventoryController {
  async index({ auth, view }: HttpContext) {
    const user = await auth.getUserOrFail()
    const inventoryItems = await InventoryItem.query()
      .where('user_id', user.id)
      .preload('card', (q) => q.preload('set'))
      .preload('variants', (q) => q.preload('variant'))

    const itemsWithTotals = inventoryItems.map((item) => {
      const totalQuantity = item.variants.reduce((sum, v) => sum + v.quantity, 0)
      const totalValue = item.variants.reduce((sum, v) => sum + v.quantity * (v.variant?.price ?? 0), 0)
      const lastPriceUpdate = item.variants
        .map((v) => v.lastPriceUpdateAt)
        .filter((d): d is DateTime => d !== null)
        .sort((a, b) => b.toMillis() - a.toMillis())[0]
      return { ...item.serialize(), totalQuantity, totalValue, lastPriceUpdate }
    })

    return view.render('pages/inventory/index', { inventoryItems: itemsWithTotals })
  }

  async show({ params, auth, view }: HttpContext) {
    const user = await auth.getUserOrFail()
    const inventoryItem = await InventoryItem.query()
      .where('id', Number(params.inventoryItemId))
      .where('user_id', user.id)
      .preload('card', (q) => q.preload('set'))
      .preload('variants', (q) => q.preload('variant'))
      .firstOrFail()

    const totalValue = inventoryItem.variants.reduce((sum, v) => sum + v.quantity * (v.variant?.price ?? 0), 0)
    return view.render('pages/inventory/show', { inventoryItem, totalValue })
  }

  async store({ request, auth, response, session }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new InventoryService()
    const { card_id, notes } = request.only(['card_id', 'notes'])
    try {
      await svc.addCardToInventory(user.id, Number(card_id), notes)
      session.flash('success', 'Card added to inventory')
    } catch (error) {
      session.flash('error', `Failed to add card: ${(error as Error).message}`)
    }
    return response.redirect().back()
  }

  async destroy({ params, auth, response, session }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new InventoryService()
    try {
      await svc.removeCardFromInventory(Number(params.inventoryItemId), user.id)
      session.flash('success', 'Card removed from inventory')
    } catch (error) {
      session.flash('error', `Failed to remove card: ${(error as Error).message}`)
    }
    return response.redirect('/inventory')
  }

  async updateQuantity({ params, request, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new InventoryService()
    const { quantity } = request.only(['quantity'])
    if (Number(quantity) < 0) {
      return response.badRequest({ error: 'Quantity must be non-negative' })
    }
    await svc.updateVariantQuantity(Number(params.inventoryItemVariantId), Number(quantity), user.id)
    return response.json({ success: true })
  }

  async resyncVariants({ params, auth, response, session }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new InventoryService()
    try {
      await svc.resyncInventoryVariants(Number(params.inventoryItemId), user.id)
      session.flash('success', 'Inventory variants resynced')
    } catch (error) {
      session.flash('error', `Failed to resync: ${(error as Error).message}`)
    }
    return response.redirect().back()
  }

  async updatePrices({ auth, response, session }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new InventoryService()
    try {
      await svc.updateInventoryPrices(user.id)
      session.flash('success', 'Prices updated successfully')
    } catch (error) {
      session.flash('error', `Failed to update prices: ${(error as Error).message}`)
    }
    return response.redirect().back()
  }
}


