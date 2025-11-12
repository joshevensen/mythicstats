import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.bigInteger('card_id').unsigned().references('id').inTable('cards').onDelete('CASCADE')
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['user_id', 'card_id'])
      table.index('user_id')
      table.index('card_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
