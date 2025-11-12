import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import InventoryItem from './inventory_item.js'
import CardVariant from './card_variant.js'

export default class InventoryItemVariant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare inventoryItemId: number

  @column()
  declare variantId: number

  @column()
  declare quantity: number

  @column()
  declare notes: string | null

  @column.dateTime()
  declare lastPriceUpdateAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => InventoryItem)
  declare inventoryItem: BelongsTo<typeof InventoryItem>

  @belongsTo(() => CardVariant)
  declare variant: BelongsTo<typeof CardVariant>

  static needsPriceUpdate = scope((query) => {
    query.where((q) => {
      q.whereNull('last_price_update_at')
        .orWhere('last_price_update_at', '<', DateTime.now().minus({ days: 1 }).toSQL())
    }).where('quantity', '>', 0)
  })

  static byInventoryItem = scope((query, inventoryItemId: number) => {
    query.where('inventory_item_id', inventoryItemId)
  })

  static byVariant = scope((query, variantId: number) => {
    query.where('variant_id', variantId)
  })

  needsPriceUpdate(): boolean {
    if (this.quantity === 0) return false
    if (!this.lastPriceUpdateAt) return true
    const daysSinceUpdate = DateTime.now().diff(this.lastPriceUpdateAt, 'days').days
    return daysSinceUpdate >= 1
  }

  async updatePrice() {
    this.lastPriceUpdateAt = DateTime.now()
    await this.save()
  }

  async value(): Promise<number> {
    await this.load('variant')
    if (!this.variant) return 0
    return this.quantity * this.variant.price
  }

  async variantPrice(): Promise<number | null> {
    await this.load('variant')
    return this.variant?.price ?? null
  }
}
