import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Game from './game.js'
import Card from './card.js'
import TrackedSet from './tracked_set.js'

export default class Set extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare gameId: number

  @column()
  declare justTcgSetId: string

  @column()
  declare name: string

  @column()
  declare slug: string | null

  @column.date()
  declare releaseDate: DateTime | null

  @column()
  declare cardsCount: number | null

  @column()
  declare lastUpdatedAt: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Game)
  declare game: BelongsTo<typeof Game>

  @hasMany(() => Card)
  declare cards: HasMany<typeof Card>

  @hasMany(() => TrackedSet)
  declare trackedSets: HasMany<typeof TrackedSet>

  static async findByJustTcgId(justTcgId: string) {
    return await this.findBy('just_tcg_set_id', justTcgId)
  }

  static async findOrCreateByJustTcgId(
    data: {
      justTcgSetId: string
      name: string
      slug?: string | null
      releaseDate?: string | null
      cardsCount?: number | null
    },
    gameId: number
  ) {
    const normalized = {
      gameId,
      justTcgSetId: data.justTcgSetId,
      name: data.name,
      slug: data.slug ?? null,
      releaseDate: data.releaseDate ? DateTime.fromISO(data.releaseDate) : null,
      cardsCount: data.cardsCount ?? null,
    }

    let set = await this.findBy('just_tcg_set_id', data.justTcgSetId)
    if (!set) {
      set = await this.create(normalized)
    } else {
      set.merge(normalized)
      await set.save()
    }
    return set
  }

  syncFromJustTCG(data: {
    id: string
    name: string
    slug?: string
    release_date?: string
    cards_count?: number
    last_updated?: number
  }) {
    this.justTcgSetId = data.id
    this.name = data.name
    this.slug = data.slug ?? null
    this.releaseDate = data.release_date ? DateTime.fromISO(data.release_date) : null
    this.cardsCount = data.cards_count ?? null
    this.lastUpdatedAt = data.last_updated ?? null
  }
}
