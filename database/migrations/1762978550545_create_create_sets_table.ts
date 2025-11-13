import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('game_id').unsigned().references('id').inTable('games').onDelete('CASCADE')
      table.string('just_tcg_set_id').notNullable().unique()
      table.string('name').notNullable()
      table.string('slug').nullable()
      table.date('release_date').nullable()
      table.integer('cards_count').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index('game_id')
      table.index('release_date')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
