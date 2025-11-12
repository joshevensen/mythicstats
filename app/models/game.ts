import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Set from './set.js'
import TrackedGame from './tracked_game.js'
import GameEvent from './game_event.js'

export default class Game extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare justTcgGameId: string

  @column()
  declare name: string

  @column()
  declare slug: string | null

  @column()
  declare cardsCount: number | null

  @column()
  declare setsCount: number | null

  @column()
  declare lastUpdatedAt: number | null // Unix timestamp

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Set)
  declare sets: HasMany<typeof Set>

  @hasMany(() => TrackedGame)
  declare trackedGames: HasMany<typeof TrackedGame>

  @hasMany(() => GameEvent)
  declare gameEvents: HasMany<typeof GameEvent>

  static async findByJustTcgId(justTcgId: string) {
    return await this.findBy('just_tcg_game_id', justTcgId)
  }

  static async findOrCreateByJustTcgId(data: {
    justTcgGameId: string
    name: string
    slug?: string | null
    cardsCount?: number | null
    setsCount?: number | null
    lastUpdatedAt?: number | null
  }) {
    let game = await this.findBy('just_tcg_game_id', data.justTcgGameId)
    if (!game) {
      game = await this.create(data)
    } else {
      game.merge(data)
      await game.save()
    }
    return game
  }

  syncFromJustTCG(data: {
    id: string
    name: string
    slug?: string
    cards_count?: number
    sets_count?: number
    last_updated?: number
  }) {
    this.justTcgGameId = data.id
    this.name = data.name
    this.slug = data.slug ?? null
    this.cardsCount = data.cards_count ?? null
    this.setsCount = data.sets_count ?? null
    this.lastUpdatedAt = data.last_updated ?? null
  }
}
