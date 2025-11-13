import { BaseCommand } from '@adonisjs/core/ace'
import { registerJobs } from '#start/jobs'

export default class JobsRegister extends BaseCommand {
  static commandName = 'jobs:register'
  static description = 'Register repeatable jobs in BullMQ'
  static options = {
    startApp: true,
  }

  async run() {
    await registerJobs()
    this.logger.info('Repeatable jobs registered')
  }
}
