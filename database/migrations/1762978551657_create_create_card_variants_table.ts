import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'card_variants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('card_id').unsigned().references('id').inTable('cards').onDelete('CASCADE')
      table.string('just_tcg_variant_id').notNullable().unique()
      table.string('tcgplayer_sku_id').nullable()
      table.string('condition').notNullable()
      table.string('printing').nullable()
      table.string('language').nullable()
      table.decimal('price', 10, 2).notNullable()
      table.string('currency').defaultTo('USD')
      table.bigInteger('last_updated').nullable() // Unix timestamp

      // 24hr & 7d Statistics
      table.decimal('price_change_24hr', 10, 4).nullable()
      table.decimal('price_change_7d', 10, 4).nullable()
      table.decimal('avg_price_7d', 10, 2).nullable()
      table.decimal('min_price_7d', 10, 2).nullable()
      table.decimal('max_price_7d', 10, 2).nullable()
      table.decimal('stddev_pop_price_7d', 10, 4).nullable()
      table.decimal('cov_price_7d', 10, 4).nullable()
      table.decimal('iqr_price_7d', 10, 2).nullable()
      table.decimal('trend_slope_7d', 10, 6).nullable()
      table.integer('price_changes_count_7d').nullable()
      table.jsonb('price_history_7d').nullable()

      // 30d Statistics
      table.decimal('price_change_30d', 10, 4).nullable()
      table.decimal('avg_price_30d', 10, 2).nullable()
      table.decimal('min_price_30d', 10, 2).nullable()
      table.decimal('max_price_30d', 10, 2).nullable()
      table.decimal('stddev_pop_price_30d', 10, 4).nullable()
      table.decimal('cov_price_30d', 10, 4).nullable()
      table.decimal('iqr_price_30d', 10, 2).nullable()
      table.decimal('trend_slope_30d', 10, 6).nullable()
      table.integer('price_changes_count_30d').nullable()
      table.decimal('price_relative_to_30d_range', 5, 4).nullable()
      table.jsonb('price_history_30d').nullable()

      // 90d Statistics
      table.decimal('price_change_90d', 10, 4).nullable()
      table.decimal('avg_price_90d', 10, 2).nullable()
      table.decimal('min_price_90d', 10, 2).nullable()
      table.decimal('max_price_90d', 10, 2).nullable()
      table.decimal('stddev_pop_price_90d', 10, 4).nullable()
      table.decimal('cov_price_90d', 10, 4).nullable()
      table.decimal('iqr_price_90d', 10, 2).nullable()
      table.decimal('trend_slope_90d', 10, 6).nullable()
      table.integer('price_changes_count_90d').nullable()
      table.decimal('price_relative_to_90d_range', 5, 4).nullable()

      // 1 Year Statistics
      table.decimal('min_price_1y', 10, 2).nullable()
      table.decimal('max_price_1y', 10, 2).nullable()

      // All Time Statistics
      table.decimal('min_price_all_time', 10, 2).nullable()
      table.timestamp('min_price_all_time_date').nullable()
      table.decimal('max_price_all_time', 10, 2).nullable()
      table.timestamp('max_price_all_time_date').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index('card_id')
      table.index('tcgplayer_sku_id')
      table.index(['card_id', 'condition', 'printing'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
