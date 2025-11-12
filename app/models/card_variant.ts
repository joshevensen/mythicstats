import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Card from './card.js'
import InventoryItemVariant from './inventory_item_variant.js'

export default class CardVariant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare cardId: number

  @column()
  declare justTcgVariantId: string

  @column()
  declare tcgplayerSkuId: string | null

  @column()
  declare condition: string

  @column()
  declare printing: string | null

  @column()
  declare language: string | null

  @column()
  declare price: number

  @column()
  declare currency: string

  @column()
  declare lastUpdated: number | null // Unix timestamp

  // 24hr & 7d Statistics
  @column()
  declare priceChange24hr: number | null

  @column()
  declare priceChange7d: number | null

  @column()
  declare avgPrice7d: number | null

  @column()
  declare minPrice7d: number | null

  @column()
  declare maxPrice7d: number | null

  @column()
  declare stddevPopPrice7d: number | null

  @column()
  declare covPrice7d: number | null

  @column()
  declare iqrPrice7d: number | null

  @column()
  declare trendSlope7d: number | null

  @column()
  declare priceChangesCount7d: number | null

  @column()
  declare priceHistory7d: Array<{ p: number; t: number }> | null

  // 30d Statistics
  @column()
  declare priceChange30d: number | null

  @column()
  declare avgPrice30d: number | null

  @column()
  declare minPrice30d: number | null

  @column()
  declare maxPrice30d: number | null

  @column()
  declare stddevPopPrice30d: number | null

  @column()
  declare covPrice30d: number | null

  @column()
  declare iqrPrice30d: number | null

  @column()
  declare trendSlope30d: number | null

  @column()
  declare priceChangesCount30d: number | null

  @column()
  declare priceRelativeTo30dRange: number | null

  @column()
  declare priceHistory30d: Array<{ p: number; t: number }> | null

  // 90d Statistics
  @column()
  declare priceChange90d: number | null

  @column()
  declare avgPrice90d: number | null

  @column()
  declare minPrice90d: number | null

  @column()
  declare maxPrice90d: number | null

  @column()
  declare stddevPopPrice90d: number | null

  @column()
  declare covPrice90d: number | null

  @column()
  declare iqrPrice90d: number | null

  @column()
  declare trendSlope90d: number | null

  @column()
  declare priceChangesCount90d: number | null

  @column()
  declare priceRelativeTo90dRange: number | null

  // 1 Year Statistics
  @column()
  declare minPrice1y: number | null

  @column()
  declare maxPrice1y: number | null

  // All Time Statistics
  @column()
  declare minPriceAllTime: number | null

  @column.dateTime()
  declare minPriceAllTimeDate: DateTime | null

  @column()
  declare maxPriceAllTime: number | null

  @column.dateTime()
  declare maxPriceAllTimeDate: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Card)
  declare card: BelongsTo<typeof Card>

  @hasMany(() => InventoryItemVariant)
  declare inventoryItemVariants: HasMany<typeof InventoryItemVariant>

  static byCondition = scope((query, condition: string) => {
    query.where('condition', condition)
  })

  static byPrinting = scope((query, printing: string) => {
    query.where('printing', printing)
  })

  static priceIncreasing = scope((query) => {
    query.where((q) => {
      q.where('trend_slope_7d', '>', 0).orWhere('trend_slope_30d', '>', 0)
    })
  })

  static highVolatility = scope((query) => {
    query.where((q) => {
      q.where('cov_price_7d', '>', 0.2).orWhere('cov_price_30d', '>', 0.2)
    })
  })

  static recentlyUpdated = scope((query, days: number = 7) => {
    const cutoff = DateTime.now().minus({ days }).toUnixInteger()
    query.where('last_updated', '>=', cutoff)
  })

  static async findByJustTcgId(justTcgId: string) {
    return await this.findBy('just_tcg_variant_id', justTcgId)
  }

  getPriceHistory7d(): Array<{ price: number; timestamp: number }> {
    if (!this.priceHistory7d) return []
    return this.priceHistory7d.map((item) => ({
      price: item.p,
      timestamp: item.t,
    }))
  }

  getPriceHistory30d(): Array<{ price: number; timestamp: number }> {
    if (!this.priceHistory30d) return []
    return this.priceHistory30d.map((item) => ({
      price: item.p,
      timestamp: item.t,
    }))
  }

  isPriceIncreasing(): boolean {
    return (this.trendSlope7d ?? 0) > 0 || (this.trendSlope30d ?? 0) > 0
  }

  getVolatility(): number {
    return this.covPrice7d ?? this.covPrice30d ?? 0
  }

  isNearAllTimeHigh(): boolean {
    if (!this.maxPriceAllTime || !this.price) return false
    const diff = this.maxPriceAllTime - this.price
    return diff <= this.maxPriceAllTime * 0.05 // Within 5% of all-time high
  }

  isNearAllTimeLow(): boolean {
    if (!this.minPriceAllTime || !this.price) return false
    const diff = this.price - this.minPriceAllTime
    return diff <= this.minPriceAllTime * 0.05 // Within 5% of all-time low
  }

  getPricePosition(): number {
    return this.priceRelativeTo30dRange ?? this.priceRelativeTo90dRange ?? 0.5
  }
}
