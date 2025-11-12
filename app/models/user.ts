import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import TrackedGame from './tracked_game.js'
import TrackedSet from './tracked_set.js'
import InventoryItem from './inventory_item.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  // API Rate Limit Information
  @column()
  declare apiPlan: string | null

  @column()
  declare apiMonthlyLimit: number | null

  @column()
  declare apiDailyLimit: number | null

  @column()
  declare apiRateLimit: number | null // requests per minute

  @column()
  declare apiRequestsUsed: number

  @column()
  declare apiDailyRequestsUsed: number

  @column()
  declare apiRequestsRemaining: number

  @column()
  declare apiDailyRequestsRemaining: number

  @column.dateTime()
  declare apiLimitInfoUpdatedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => TrackedGame)
  declare trackedGames: HasMany<typeof TrackedGame>

  @hasMany(() => TrackedSet)
  declare trackedSets: HasMany<typeof TrackedSet>

  @hasMany(() => InventoryItem)
  declare inventoryItems: HasMany<typeof InventoryItem>

  // Methods
  canMakeApiRequest(count: number = 1): boolean {
    return (
      (this.apiRequestsRemaining ?? 0) >= count &&
      (this.apiDailyRequestsRemaining ?? 0) >= count
    )
  }

  updateRateLimitInfo(usage: {
    plan?: string
    monthlyLimit?: number
    dailyLimit?: number
    rateLimit?: number
    requestsUsed?: number
    dailyRequestsUsed?: number
    requestsRemaining?: number
    dailyRequestsRemaining?: number
  }) {
    if (usage.plan !== undefined) this.apiPlan = usage.plan
    if (usage.monthlyLimit !== undefined) this.apiMonthlyLimit = usage.monthlyLimit
    if (usage.dailyLimit !== undefined) this.apiDailyLimit = usage.dailyLimit
    if (usage.rateLimit !== undefined) this.apiRateLimit = usage.rateLimit
    if (usage.requestsUsed !== undefined) this.apiRequestsUsed = usage.requestsUsed
    if (usage.dailyRequestsUsed !== undefined) this.apiDailyRequestsUsed = usage.dailyRequestsUsed
    if (usage.requestsRemaining !== undefined) this.apiRequestsRemaining = usage.requestsRemaining
    if (usage.dailyRequestsRemaining !== undefined)
      this.apiDailyRequestsRemaining = usage.dailyRequestsRemaining
    this.apiLimitInfoUpdatedAt = DateTime.now()
  }

  hasExtraRequests(): boolean {
    return (this.apiRequestsRemaining ?? 0) > 20
  }

  isNearLimit(): boolean {
    return (this.apiRequestsRemaining ?? 0) < 10 || (this.apiDailyRequestsRemaining ?? 0) < 10
  }

  requestsRemainingPercentage(): number {
    if (!this.apiMonthlyLimit) return 0
    return ((this.apiRequestsRemaining ?? 0) / this.apiMonthlyLimit) * 100
  }
}