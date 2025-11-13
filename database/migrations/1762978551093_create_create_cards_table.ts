import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cards'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('set_id').unsigned().references('id').inTable('sets').onDelete('CASCADE')
      table.string('just_tcg_card_id').notNullable().unique()
      table.string('name').notNullable()
      table.string('number').nullable()
      table.string('rarity').nullable()
      table.jsonb('details').nullable()
      table.string('tcgplayer_id').nullable()
      table.string('mtgjson_id').nullable()
      table.string('scryfall_id').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index('set_id')
      table.index('name')
      table.index('number')
      table.index('tcgplayer_id')
      table.index('mtgjson_id')
      table.index('scryfall_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
