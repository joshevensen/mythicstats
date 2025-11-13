import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import GameEvent from '#models/game_event'

export default class GameEventsController {
  async index({ params, auth, view }: HttpContext) {
    await auth.getUserOrFail()
    const game = await Game.findOrFail(params.gameId)
    const events = await GameEvent.query().where('game_id', game.id).orderBy('start_date', 'desc')
    return view.render('pages/game_events/index', { game, events })
  }

  async create({ params, view }: HttpContext) {
    const game = await Game.findOrFail(params.gameId)
    return view.render('pages/game_events/create', { game })
  }

  async store({ request, response, session }: HttpContext) {
    const data = request.only([
      'game_id',
      'event_type',
      'title',
      'description',
      'start_date',
      'end_date',
      'affects_pricing',
    ])
    const event = await GameEvent.create(data as any)
    session.flash('success', 'Event created successfully')
    return response.redirect(`/games/${event.gameId}/events`)
  }

  async edit({ params, view }: HttpContext) {
    const game = await Game.findOrFail(params.gameId)
    const event = await GameEvent.findOrFail(params.eventId)
    return view.render('pages/game_events/edit', { game, event })
  }

  async update({ params, request, response, session }: HttpContext) {
    const event = await GameEvent.findOrFail(params.eventId)
    const data = request.only([
      'event_type',
      'title',
      'description',
      'start_date',
      'end_date',
      'affects_pricing',
    ])
    event.merge(data)
    await event.save()
    session.flash('success', 'Event updated successfully')
    return response.redirect(`/games/${event.gameId}/events`)
  }

  async destroy({ params, response, session }: HttpContext) {
    const event = await GameEvent.findOrFail(params.eventId)
    const gameId = event.gameId
    await event.delete()
    session.flash('success', 'Event deleted successfully')
    return response.redirect(`/games/${gameId}/events`)
  }
}


