import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('sets', (table) => {
      table.bigInteger('last_updated_at').nullable()
      table.index(['last_updated_at'])
    })

    this.schema.alterTable('cards', (table) => {
      table.bigInteger('last_updated_at').nullable()
      table.index(['last_updated_at'])
    })
  }

  async down() {
    this.schema.alterTable('sets', (table) => {
      table.dropIndex(['last_updated_at'])
      table.dropColumn('last_updated_at')
    })

    this.schema.alterTable('cards', (table) => {
      table.dropIndex(['last_updated_at'])
      table.dropColumn('last_updated_at')
    })
  }
}


