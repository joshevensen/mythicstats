import type { HttpContext } from '@adonisjs/core/http'
import Set from '#models/set'
import Card from '#models/card'
import InventoryItem from '#models/inventory_item'
import CardService from '#services/card_service'

export default class CardsController {
  async index({ params, auth, inertia, request }: HttpContext) {
    const user = await auth.getUserOrFail()
    const set = await Set.findOrFail(params.setId)
    await set.load('game')

    let query = Card.query().where('set_id', set.id).orderBy('number', 'asc')
    const search = request.input('search')
    if (search) {
      query = query.where((q) => {
        q.where('name', 'ilike', `%${search}%`).orWhere('number', 'ilike', `%${search}%`)
      })
    }
    const cards = await query

    const cardIds = cards.map((c) => c.id)
    const inventoryItems = await InventoryItem.query()
      .where('user_id', user.id)
      .whereIn('card_id', cardIds)
      .select('card_id')
    const inventoryCardIds = inventoryItems.map((item) => item.cardId)

    const cardsWithInventory = cards.map((card) => ({
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      details: card.details,
      inInventory: inventoryCardIds.includes(card.id),
    }))

    return inertia.render('Cards/Index', {
      set: {
        id: set.id,
        name: set.name,
        slug: set.slug,
        releaseDate: set.releaseDate?.toISODate() ?? null,
        game: set.game
          ? {
              id: set.game.id,
              name: set.game.name,
            }
          : null,
      },
      cards: cardsWithInventory,
      filters: {
        search: search ?? '',
      },
    })
  }

  async show({ params, auth, inertia }: HttpContext) {
    const user = await auth.getUserOrFail()
    const card = await Card.findOrFail(params.cardId)
    await card.load('set', (q) => q.preload('game'))
    await card.load('variants')

    const inventoryItemModel = await InventoryItem.query()
      .where('user_id', user.id)
      .where('card_id', card.id)
      .preload('variants', (q) => q.preload('variant'))
      .first()

    const inventoryItem = inventoryItemModel
      ? {
          id: inventoryItemModel.id,
          notes: inventoryItemModel.notes,
          variants: inventoryItemModel.variants.map((variant) => ({
            id: variant.id,
            quantity: variant.quantity,
            lastPriceUpdateAt: variant.lastPriceUpdateAt?.toISO() ?? null,
            details: variant.variant
              ? {
                  id: variant.variant.id,
                  condition: variant.variant.condition,
                  printing: variant.variant.printing,
                  language: variant.variant.language,
                  price: variant.variant.price,
                }
              : null,
          })),
        }
      : null

    return inertia.render('Cards/Show', {
      card: {
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity,
        details: card.details,
        set: card.set
          ? {
              id: card.set.id,
              name: card.set.name,
              slug: card.set.slug,
              game: card.set.game
                ? {
                    id: card.set.game.id,
                    name: card.set.game.name,
                  }
                : null,
            }
          : null,
        variants: card.variants.map((variant) => ({
          id: variant.id,
          condition: variant.condition,
          printing: variant.printing,
          language: variant.language,
          price: variant.price,
          currency: variant.currency,
          lastUpdated: variant.lastUpdated,
          priceChange7d: variant.priceChange7d,
        })),
      },
      inventoryItem,
    })
  }

  async update({ params, request, response, session }: HttpContext) {
    const data = request.only(['name', 'number', 'rarity', 'details'])
    const svc = new CardService()
    await svc.updateCard(Number(params.cardId), data as any)
    session.flash('success', 'Card updated successfully')
    return response.redirect().back()
  }

  async updateVariant({ params, request, response, session }: HttpContext) {
    const data = request.only(['price', 'condition', 'printing', 'language'])
    const svc = new CardService()
    await svc.updateCardVariant(Number(params.variantId), data as any)
    session.flash('success', 'Variant updated successfully')
    return response.redirect().back()
  }
}
