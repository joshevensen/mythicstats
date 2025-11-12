import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tracked_sets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.bigInteger('set_id').unsigned().references('id').inTable('sets').onDelete('CASCADE')
      table.boolean('is_active').defaultTo(true)
      table.timestamp('last_sync_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['user_id', 'set_id'])
      table.index('is_active')
      table.index('last_sync_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
