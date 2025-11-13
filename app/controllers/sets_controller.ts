import type { HttpContext } from '@adonisjs/core/http'
import Set from '#models/set'
import Card from '#models/card'
import CardVariant from '#models/card_variant'
import InventoryItem from '#models/inventory_item'
import TrackedSet from '#models/tracked_set'
import TrackingService from '#services/tracking_service'
import JustTCGService from '#services/just_tcg_service'

function serializeTrackedSet(trackedSet: TrackedSet | null) {
  if (!trackedSet) return null
  return {
    id: trackedSet.id,
    isActive: trackedSet.isActive,
    lastSyncAt: trackedSet.lastSyncAt?.toISO() ?? null,
    createdAt: trackedSet.createdAt.toISO(),
  }
}

export default class SetsController {
  async show({ params, auth, inertia }: HttpContext) {
    const user = await auth.getUserOrFail()
    const set = await Set.findOrFail(params.setId)
    await set.load('game')

    const trackedSet = await TrackedSet.query()
      .where('user_id', user.id)
      .where('set_id', set.id)
      .first()

    const totalCardsRow = await Card.query().where('set_id', set.id).count('* as total')
    const totalCards = Number((totalCardsRow[0] as any).total ?? 0)

    const cardsInInventoryRow = await InventoryItem.query()
      .where('user_id', user.id)
      .whereIn('card_id', (q) => q.select('id').from('cards').where('set_id', set.id))
      .count('* as total')
    const cardsInInventory = Number((cardsInInventoryRow[0] as any).total ?? 0)

    const minPriceRow = await CardVariant.query()
      .whereHas('card', (q) => q.where('set_id', set.id))
      .min('price as min_price')
    const maxPriceRow = await CardVariant.query()
      .whereHas('card', (q) => q.where('set_id', set.id))
      .max('price as max_price')
    const minPrice = Number((minPriceRow[0] as any).min_price ?? 0)
    const maxPrice = Number((maxPriceRow[0] as any).max_price ?? 0)

    return inertia.render('Sets/Show', {
      set: {
        id: set.id,
        name: set.name,
        slug: set.slug,
        releaseDate: set.releaseDate?.toISODate() ?? null,
        cardsCount: set.cardsCount,
        game: set.game
          ? {
              id: set.game.id,
              name: set.game.name,
            }
          : null,
      },
      trackedSet: serializeTrackedSet(trackedSet ?? null),
      cardSummary: {
        total: totalCards,
        inInventory: cardsInInventory,
        priceRange: { min: minPrice, max: maxPrice },
      },
    })
  }

  async track({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new TrackingService()
    await svc.trackSet(user.id, Number(params.setId))
    return response.redirect().back()
  }

  async untrack({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new TrackingService()
    await svc.untrackSet(user.id, Number(params.setId))
    return response.redirect().back()
  }

  async toggleActive({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new TrackingService()
    await svc.toggleSetTracking(user.id, Number(params.setId))
    return response.redirect().back()
  }

  async sync({ params, auth, response, session }: HttpContext) {
    const user = await auth.getUserOrFail()
    const just = new JustTCGService(user)
    try {
      const trackedSet = await TrackedSet.query()
        .where('user_id', user.id)
        .where('set_id', Number(params.setId))
        .firstOrFail()
      await just.getCardsBySet(Number(params.setId), trackedSet)
      session.flash('success', 'Set synced successfully')
    } catch (error) {
      session.flash('error', `Failed to sync set: ${(error as Error).message}`)
    }
    return response.redirect().back()
  }
}
