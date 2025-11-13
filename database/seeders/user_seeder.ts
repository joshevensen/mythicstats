import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class UserSeeder extends BaseSeeder {
  public async run() {
    await User.updateOrCreate(
      { email: 'josh@mythicfoxgames.com' },
      {
        fullName: 'Josh Evensen',
        password: 'wNr8nz9Ap6',
      }
    )
  }
}
