import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class UserSeeder extends BaseSeeder {
  public async run() {
    await User.updateOrCreate(
      { email: 'josh@mythicfoxgames.com' },
      {
        fullName: 'Josh Evensen',
        password: 'wNr8nz9Ap6',
        apiPlan: 'dev',
        apiMonthlyLimit: 100000,
        apiDailyLimit: 5000,
        apiRateLimit: 60,
        apiRequestsRemaining: 100000,
        apiDailyRequestsRemaining: 5000,
        apiRequestsUsed: 0,
        apiDailyRequestsUsed: 0,
      }
    )
  }
}
