import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Set from './set.js'

export default class TrackedSet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare setId: number

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare lastSyncAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Set)
  declare set: BelongsTo<typeof Set>

  static byUser = scope((query, userId: number) => {
    query.where('user_id', userId)
  })

  static active = scope((query) => {
    query.where('is_active', true)
  })

  static needsSync = scope((query) => {
    query.where('is_active', true).where((q) => {
      q.whereNull('last_sync_at').orWhere('last_sync_at', '<', DateTime.now().minus({ days: 1 }).toSQL())
    })
  })

  needsSync(): boolean {
    if (!this.isActive) return false
    if (!this.lastSyncAt) return true
    // Sync needed if last sync was more than 1 day ago
    const daysSinceSync = DateTime.now().diff(this.lastSyncAt, 'days').days
    return daysSinceSync >= 1
  }

  async markSynced() {
    this.lastSyncAt = DateTime.now()
    await this.save()
  }
}
