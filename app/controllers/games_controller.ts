import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import Set from '#models/set'
import TrackedGame from '#models/tracked_game'
import TrackedSet from '#models/tracked_set'
import TrackingService from '#services/tracking_service'
import JustTCGService from '#services/just_tcg_service'

export default class GamesController {
  async index({ auth, view }: HttpContext) {
    const user = await auth.getUserOrFail()
    const games = await Game.query().orderBy('name', 'asc')
    const trackedGameIds = await TrackedGame.query().where('user_id', user.id).pluck('game_id')
    const gamesWithTracking = await Promise.all(
      games.map(async (game) => {
        const tracked = trackedGameIds.includes(game.id)
        const trackedGame = tracked
          ? await TrackedGame.query().where('user_id', user.id).where('game_id', game.id).first()
          : null
        return { ...game.serialize(), isTracked: tracked, trackedGame }
      })
    )
    return view.render('pages/games/index', { games: gamesWithTracking })
  }

  async show({ params, auth, view }: HttpContext) {
    const user = await auth.getUserOrFail()
    const game = await Game.findOrFail(params.gameId)
    const sets = await Set.query().where('game_id', game.id).orderBy('release_date', 'desc')
    const trackedSetIds = await TrackedSet.query()
      .where('user_id', user.id)
      .whereIn('set_id', sets.map((s) => s.id))
      .pluck('set_id')
    const setsWithTracking = await Promise.all(
      sets.map(async (set) => {
        const tracked = trackedSetIds.includes(set.id)
        const trackedSet = tracked
          ? await TrackedSet.query().where('user_id', user.id).where('set_id', set.id).first()
          : null
        return { ...set.serialize(), isTracked: tracked, trackedSet }
      })
    )
    const trackedGame = await TrackedGame.query().where('user_id', user.id).where('game_id', game.id).first()
    return view.render('pages/games/show', { game, sets: setsWithTracking, trackedGame })
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


