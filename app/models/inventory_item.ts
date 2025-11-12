import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, scope, afterCreate, beforeDelete } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Card from './card.js'
import InventoryItemVariant from './inventory_item_variant.js'
import CardVariant from './card_variant.js'

export default class InventoryItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare cardId: number

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Card)
  declare card: BelongsTo<typeof Card>

  @hasMany(() => InventoryItemVariant)
  declare variants: HasMany<typeof InventoryItemVariant>

  static byUser = scope((query, userId: number) => {
    query.where('user_id', userId)
  })

  static byCard = scope((query, cardId: number) => {
    query.where('card_id', cardId)
  })

  @afterCreate()
  static async createVariantsForAllCardVariants(item: InventoryItem) {
    // Get all card variants for this card
    const cardVariants = await CardVariant.query().where('card_id', item.cardId)
    
    // Create inventory item variants for each card variant (quantity 0)
    for (const variant of cardVariants) {
      await InventoryItemVariant.create({
        inventoryItemId: item.id,
        variantId: variant.id,
        quantity: 0,
      })
    }
  }

  @beforeDelete()
  static async deleteVariants(item: InventoryItem) {
    await InventoryItemVariant.query().where('inventory_item_id', item.id).delete()
  }

  async totalQuantity(): Promise<number> {
    const variants = await this.related('variants').query()
    return variants.reduce((sum, variant) => sum + variant.quantity, 0)
  }

  async totalValue(): Promise<number> {
    const variants = await this.related('variants').query().preload('variant')
    let total = 0
    for (const invVariant of variants) {
      if (invVariant.variant) {
        total += invVariant.quantity * invVariant.variant.price
      }
    }
    return total
  }

  async hasVariant(variantId: number): Promise<boolean> {
    const variant = await this.related('variants').query().where('variant_id', variantId).first()
    return variant !== null
  }
}
