import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // API Rate Limit Information
      table.string('api_plan').nullable()
      table.integer('api_monthly_limit').nullable()
      table.integer('api_daily_limit').nullable()
      table.integer('api_rate_limit').nullable() // requests per minute
      table.integer('api_requests_used').defaultTo(0)
      table.integer('api_daily_requests_used').defaultTo(0)
      table.integer('api_requests_remaining').defaultTo(0)
      table.integer('api_daily_requests_remaining').defaultTo(0)
      table.timestamp('api_limit_info_updated_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('api_plan')
      table.dropColumn('api_monthly_limit')
      table.dropColumn('api_daily_limit')
      table.dropColumn('api_rate_limit')
      table.dropColumn('api_requests_used')
      table.dropColumn('api_daily_requests_used')
      table.dropColumn('api_requests_remaining')
      table.dropColumn('api_daily_requests_remaining')
      table.dropColumn('api_limit_info_updated_at')
    })
  }
}