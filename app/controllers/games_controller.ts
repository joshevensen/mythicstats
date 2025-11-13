import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import Set from '#models/set'
import TrackedGame from '#models/tracked_game'
import TrackedSet from '#models/tracked_set'
import TrackingService from '#services/tracking_service'
import JustTCGService from '#services/just_tcg_service'

function serializeTrackedGame(trackedGame: TrackedGame | null) {
  if (!trackedGame) return null
  return {
    id: trackedGame.id,
    isActive: trackedGame.isActive,
    lastSetsDiscoveryAt: trackedGame.lastSetsDiscoveryAt?.toISO() ?? null,
    createdAt: trackedGame.createdAt.toISO(),
  }
}

function serializeTrackedSet(trackedSet: TrackedSet | null) {
  if (!trackedSet) return null
  return {
    id: trackedSet.id,
    isActive: trackedSet.isActive,
    lastSyncAt: trackedSet.lastSyncAt?.toISO() ?? null,
    createdAt: trackedSet.createdAt.toISO(),
  }
}

export default class GamesController {
  async index({ auth, inertia }: HttpContext) {
    const user = await auth.getUserOrFail()
    const games = await Game.query().orderBy('name', 'asc')
    const trackedGames = await TrackedGame.query().where('user_id', user.id)
    const trackedMap = new Map(trackedGames.map((tg) => [tg.gameId, tg]))

    const gamesWithTracking = games.map((game) => ({
      id: game.id,
      name: game.name,
      slug: game.slug,
      cardsCount: game.cardsCount,
      setsCount: game.setsCount,
      isTracked: trackedMap.has(game.id),
      trackedGame: serializeTrackedGame(trackedMap.get(game.id) ?? null),
    }))

    return inertia.render('Games/Index', { games: gamesWithTracking })
  }

  async show({ params, auth, inertia }: HttpContext) {
    const user = await auth.getUserOrFail()
    const game = await Game.findOrFail(params.gameId)
    const sets = await Set.query().where('game_id', game.id).orderBy('release_date', 'desc')

    const trackedSets = await TrackedSet.query()
      .where('user_id', user.id)
      .whereIn(
        'set_id',
        sets.map((s) => s.id)
      )

    const trackedSetMap = new Map(trackedSets.map((ts) => [ts.setId, ts]))
    const trackedGame = await TrackedGame.query()
      .where('user_id', user.id)
      .where('game_id', game.id)
      .first()

    const setsWithTracking = sets.map((set) => ({
      id: set.id,
      name: set.name,
      slug: set.slug,
      releaseDate: set.releaseDate?.toISODate() ?? null,
      cardsCount: set.cardsCount,
      isTracked: trackedSetMap.has(set.id),
      trackedSet: serializeTrackedSet(trackedSetMap.get(set.id) ?? null),
    }))

    return inertia.render('Games/Show', {
      game: {
        id: game.id,
        name: game.name,
        slug: game.slug,
        cardsCount: game.cardsCount,
        setsCount: game.setsCount,
      },
      sets: setsWithTracking,
      trackedGame: serializeTrackedGame(trackedGame ?? null),
    })
  }

  async track({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new TrackingService()
    await svc.trackGame(user.id, Number(params.gameId))
    return response.redirect().back()
  }

  async untrack({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new TrackingService()
    await svc.untrackGame(user.id, Number(params.gameId))
    return response.redirect().back()
  }

  async toggleActive({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const svc = new TrackingService()
    await svc.toggleGameTracking(user.id, Number(params.gameId))
    return response.redirect().back()
  }

  async discoverSets({ params, auth, response, session }: HttpContext) {
    const user = await auth.getUserOrFail()
    const just = new JustTCGService(user)
    try {
      const trackedGame = await TrackedGame.query()
        .where('user_id', user.id)
        .where('game_id', Number(params.gameId))
        .firstOrFail()
      await just.getSets(Number(params.gameId), trackedGame)
      session.flash('success', 'Sets discovered successfully')
    } catch (error) {
      session.flash('error', `Failed to discover sets: ${(error as Error).message}`)
    }
    return response.redirect().back()
  }
}
