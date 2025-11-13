import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'game_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('game_id').unsigned().references('id').inTable('games').onDelete('CASCADE')
      table.string('event_type').notNullable() // 'release', 'championship', 'tournament', 'ban', 'other'
      table.string('title').notNullable()
      table.text('description').nullable()
      table.date('start_date').nullable()
      table.date('end_date').nullable()
      table.boolean('affects_pricing').defaultTo(false)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index('game_id')
      table.index('event_type')
      table.index('start_date')
      table.index('end_date')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
