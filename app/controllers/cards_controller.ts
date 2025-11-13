import type { HttpContext } from '@adonisjs/core/http'
import Set from '#models/set'
import Card from '#models/card'
import InventoryItem from '#models/inventory_item'
import CardService from '#services/card_service'

export default class CardsController {
  async index({ params, auth, view, request }: HttpContext) {
    await auth.getUserOrFail()
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
    const inventoryCardIds = await InventoryItem.query().whereIn('card_id', cardIds).pluck('card_id')

    const cardsWithInventory = cards.map((card) => ({
      ...card.serialize(),
      inInventory: inventoryCardIds.includes(card.id),
    }))

    return view.render('pages/cards/index', { set, cards: cardsWithInventory, search })
  }

  async show({ params, auth, view }: HttpContext) {
    const user = await auth.getUserOrFail()
    const card = await Card.findOrFail(params.cardId)
    await card.load('set')
    await card.load('variants')

    const inventoryItem = await InventoryItem.query()
      .where('user_id', user.id)
      .where('card_id', card.id)
      .preload('variants', (q) => q.preload('variant'))
      .first()

    return view.render('pages/cards/show', { card, inventoryItem })
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


