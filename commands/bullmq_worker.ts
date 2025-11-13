import { BaseCommand } from '@adonisjs/core/ace'

export default class BullmqWorker extends BaseCommand {
  static commandName = 'bullmq:worker'
  static description = 'Start BullMQ worker to process jobs'
  static options = {
    startApp: true,
  }

  async run() {
    await import('#start/worker')
    this.logger.info('BullMQ worker started. Press Ctrl+C to stop.')
    // keep process alive
    await new Promise(() => {})
  }
}


