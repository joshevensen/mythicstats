import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import GameEvent from '#models/game_event'

const EVENT_TYPES = ['release', 'tournament', 'banlist', 'spoiler', 'other']

export default class GameEventsController {
  async index({ params, auth, inertia }: HttpContext) {
    await auth.getUserOrFail()
    const game = await Game.findOrFail(params.gameId)
    const events = await GameEvent.query().where('game_id', game.id).orderBy('start_date', 'desc')

    const serializedEvents = events.map((event) => ({
      id: event.id,
      gameId: event.gameId,
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      startDate: event.startDate?.toISODate() ?? null,
      endDate: event.endDate?.toISODate() ?? null,
      affectsPricing: event.affectsPricing,
      createdAt: event.createdAt.toISO(),
    }))

    return inertia.render('GameEvents/Index', {
      game: {
        id: game.id,
        name: game.name,
      },
      events: serializedEvents,
      eventTypes: EVENT_TYPES,
    })
  }

  async create({ params, inertia }: HttpContext) {
    const game = await Game.findOrFail(params.gameId)
    return inertia.render('GameEvents/Create', {
      game: {
        id: game.id,
        name: game.name,
      },
      eventTypes: EVENT_TYPES,
    })
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

  async edit({ params, inertia }: HttpContext) {
    const game = await Game.findOrFail(params.gameId)
    const event = await GameEvent.findOrFail(params.eventId)
    return inertia.render('GameEvents/Edit', {
      game: {
        id: game.id,
        name: game.name,
      },
      event: {
        id: event.id,
        gameId: event.gameId,
        eventType: event.eventType,
        title: event.title,
        description: event.description,
        startDate: event.startDate?.toISODate() ?? null,
        endDate: event.endDate?.toISODate() ?? null,
        affectsPricing: event.affectsPricing,
      },
      eventTypes: EVENT_TYPES,
    })
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
