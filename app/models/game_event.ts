import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Game from './game.js'

export default class GameEvent extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare gameId: number

  @column()
  declare eventType: string // 'release', 'championship', 'tournament', 'ban', 'other'

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column.date()
  declare startDate: DateTime | null

  @column.date()
  declare endDate: DateTime | null

  @column()
  declare affectsPricing: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Game)
  declare game: BelongsTo<typeof Game>

  static active = scope((query) => {
    const now = DateTime.now()
    query
      .where('start_date', '<=', now.toSQLDate())
      .where((q) => {
        q.whereNull('end_date').orWhere('end_date', '>=', now.toSQLDate())
      })
  })

  static upcoming = scope((query) => {
    query.where('start_date', '>', DateTime.now().toSQLDate())
  })

  static affectsPricing = scope((query) => {
    query.where('affects_pricing', true)
  })

  isActive(): boolean {
    if (!this.startDate) return false
    const now = DateTime.now()
    const start = DateTime.fromJSDate(this.startDate.toJSDate())
    if (start > now) return false
    if (this.endDate) {
      const end = DateTime.fromJSDate(this.endDate.toJSDate())
      return end >= now
    }
    return true
  }

  isUpcoming(): boolean {
    if (!this.startDate) return false
    const start = DateTime.fromJSDate(this.startDate.toJSDate())
    return start > DateTime.now()
  }

  shouldTriggerPriceUpdate(): boolean {
    return this.affectsPricing && this.isActive()
  }
}
