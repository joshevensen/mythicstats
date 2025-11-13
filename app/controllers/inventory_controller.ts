import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import InventoryItem from '#models/inventory_item'
import InventoryService from '#services/inventory_service'

export default class InventoryController {
  async index({ auth, inertia }: HttpContext) {
    const user = await auth.getUserOrFail()
    const inventoryItems = await InventoryItem.query()
      .where('user_id', user.id)
      .preload('card', (q) => q.preload('set', (setQuery) => setQuery.preload('game')))
      .preload('variants', (q) => q.preload('variant'))

    const itemsWithTotals = inventoryItems.map((item) => {
      const totalQuantity = item.variants.reduce((sum, v) => sum + v.quantity, 0)
      const totalValue = item.variants.reduce(
        (sum, v) => sum + v.quantity * (v.variant?.price ?? 0),
        0
      )
      const lastPriceUpdate = item.variants
        .map((v) => v.lastPriceUpdateAt)
        .filter((d): d is DateTime => d !== null)
        .sort((a, b) => b.toMillis() - a.toMillis())[0]
      return {
        id: item.id,
        notes: item.notes,
        totalQuantity,
        totalValue,
        lastPriceUpdateAt: lastPriceUpdate?.toISO() ?? null,
        card: item.card
          ? {
              id: item.card.id,
              name: item.card.name,
              number: item.card.number,
              set: item.card.set
                ? {
                    id: item.card.set.id,
                    name: item.card.set.name,
                  }
                : null,
            }
          : null,
      }
    })

    return inertia.render('Inventory/Index', { inventoryItems: itemsWithTotals })
  }

  async show({ params, auth, inertia }: HttpContext) {
    const user = await auth.getUserOrFail()
    const inventoryItem = await InventoryItem.query()
      .where('id', Number(params.inventoryItemId))
      .where('user_id', user.id)
      .preload('card', (q) => q.preload('set', (setQuery) => setQuery.preload('game')))
      .preload('variants', (q) => q.preload('variant'))
      .firstOrFail()

    const totalValue = inventoryItem.variants.reduce(
      (sum, v) => sum + v.quantity * (v.variant?.price ?? 0),
      0
    )

    return inertia.render('Inventory/Show', {
      inventoryItem: {
        id: inventoryItem.id,
        notes: inventoryItem.notes,
        card: inventoryItem.card
          ? {
              id: inventoryItem.card.id,
              name: inventoryItem.card.name,
              number: inventoryItem.card.number,
              set: inventoryItem.card.set
                ? {
                    id: inventoryItem.card.set.id,
                    name: inventoryItem.card.set.name,
                    game: inventoryItem.card.set.game
                      ? {
                          id: inventoryItem.card.set.game.id,
                          name: inventoryItem.card.set.game.name,
                        }
                      : null,
                  }
                : null,
            }
          : null,
        variants: inventoryItem.variants.map((variant) => ({
          id: variant.id,
          quantity: variant.quantity,
          lastPriceUpdateAt: variant.lastPriceUpdateAt?.toISO() ?? null,
          variant: variant.variant
            ? {
                id: variant.variant.id,
                condition: variant.variant.condition,
                printing: variant.variant.printing,
                language: variant.variant.language,
                price: variant.variant.price,
              }
            : null,
        })),
      },
      totalValue,
    })
  }

  async store({ request, auth, response, session }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new InventoryService()
    const cardId = Number(request.input('card_id'))
    const notes = request.input('notes')
    try {
      await svc.addCardToInventory(user.id, cardId, notes)
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

  async updateQuantity({ params, request, auth, response, session }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new InventoryService()
    const { quantity } = request.only(['quantity'])
    if (Number(quantity) < 0) {
      session.flash('error', 'Quantity must be non-negative')
      return response.redirect().back()
    }
    await svc.updateVariantQuantity(
      Number(params.inventoryItemVariantId),
      Number(quantity),
      user.id
    )
    session.flash('success', 'Variant quantity updated')
    return response.redirect().back()
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
