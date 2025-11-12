import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_item_variants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('inventory_item_id').unsigned().references('id').inTable('inventory_items').onDelete('CASCADE')
      table.bigInteger('variant_id').unsigned().references('id').inTable('card_variants').onDelete('CASCADE')
      table.integer('quantity').defaultTo(0)
      table.text('notes').nullable()
      table.timestamp('last_price_update_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['inventory_item_id', 'variant_id'])
      table.index('variant_id')
      table.index('last_price_update_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
