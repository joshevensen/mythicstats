import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'games'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.string('just_tcg_game_id').notNullable().unique()
      table.string('name').notNullable()
      table.string('slug').nullable().unique()
      table.integer('cards_count').nullable()
      table.integer('sets_count').nullable()
      table.bigInteger('last_updated_at').nullable() // Unix timestamp
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}