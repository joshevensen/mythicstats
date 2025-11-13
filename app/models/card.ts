import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Set from './set.js'
import CardVariant from './card_variant.js'
import InventoryItem from './inventory_item.js'

export default class Card extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare setId: number

  @column()
  declare justTcgCardId: string

  @column()
  declare name: string

  @column()
  declare number: string | null

  @column()
  declare rarity: string | null

  @column()
  declare details: Record<string, any> | null

  @column()
  declare tcgplayerId: string | null

  @column()
  declare mtgjsonId: string | null

  @column()
  declare scryfallId: string | null

  @column()
  declare lastUpdatedAt: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Set)
  declare set: BelongsTo<typeof Set>

  @hasMany(() => CardVariant)
  declare variants: HasMany<typeof CardVariant>

  @hasMany(() => InventoryItem)
  declare inventoryItems: HasMany<typeof InventoryItem>

  static async findByJustTcgId(justTcgId: string) {
    return await this.findBy('just_tcg_card_id', justTcgId)
  }

  static async findOrCreateByJustTcgId(
    data: {
      justTcgCardId: string
      name: string
      number?: string | null
      rarity?: string | null
      details?: Record<string, any> | null
      tcgplayerId?: string | null
      mtgjsonId?: string | null
      scryfallId?: string | null
    },
    setId: number
  ) {
    let card = await this.findBy('just_tcg_card_id', data.justTcgCardId)
    if (!card) {
      card = await this.create({ ...data, setId })
    } else {
      card.merge({ ...data, setId })
      await card.save()
    }
    return card
  }

  syncFromJustTCG(data: {
    id: string
    name: string
    number?: string
    rarity?: string
    details?: Record<string, any>
    tcgplayer_id?: string
    mtgjson_id?: string
    scryfall_id?: string
    last_updated?: number
  }) {
    this.justTcgCardId = data.id
    this.name = data.name
    this.number = data.number ?? null
    this.rarity = data.rarity ?? null
    this.details = data.details ?? null
    this.tcgplayerId = data.tcgplayer_id ?? null
    this.mtgjsonId = data.mtgjson_id ?? null
    this.scryfallId = data.scryfall_id ?? null
    this.lastUpdatedAt = data.last_updated ?? null
  }

  async variantsForCondition(condition: string, printing?: string) {
    const query = this.related('variants').query().where('condition', condition)
    if (printing) {
      query.where('printing', printing)
    }
    return await query
  }

  async latestPrice(condition?: string, printing?: string) {
    const query = this.related('variants').query().orderBy('last_updated', 'desc')
    if (condition) {
      query.where('condition', condition)
    }
    if (printing) {
      query.where('printing', printing)
    }
    return await query.first()
  }
}
