import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Game from './game.js'

export default class TrackedGame extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare gameId: number

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare lastSetsDiscoveryAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Game)
  declare game: BelongsTo<typeof Game>

  static byUser = scope((query, userId: number) => {
    query.where('user_id', userId)
  })

  static active = scope((query) => {
    query.where('is_active', true)
  })

  needsDiscovery(): boolean {
    if (!this.isActive) return false
    if (!this.lastSetsDiscoveryAt) return true
    // Discovery needed if last discovery was more than 7 days ago
    const daysSinceDiscovery = DateTime.now().diff(this.lastSetsDiscoveryAt, 'days').days
    return daysSinceDiscovery >= 7
  }

  async markDiscoveryComplete() {
    this.lastSetsDiscoveryAt = DateTime.now()
    await this.save()
  }
}
