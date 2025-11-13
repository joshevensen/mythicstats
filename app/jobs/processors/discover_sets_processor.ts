import type { Job } from 'bullmq'
import User from '#models/user'
import TrackedGame from '#models/tracked_game'
import { BaseProcessor } from './base_processor.js'

export class DiscoverSetsProcessor extends BaseProcessor {
  constructor(user: User) {
    super(user)
  }

  protected async handle(job: Job): Promise<void> {
    const trackedGames = await TrackedGame.query()
      .where('user_id', this.user.id)
      .where('is_active', true)
      .preload('game')

    for (let i = 0; i < trackedGames.length; i++) {
      const trackedGame = trackedGames[i]
      if (!trackedGame.needsDiscovery()) {
        continue
      }
      const canProceed = await this.checkAndHandleRateLimit(job, 1)
      if (!canProceed) {
        return
      }
      await this.justTcgService.getSets(trackedGame.gameId, trackedGame)
      await job.updateProgress({ processed: i + 1, total: trackedGames.length })
    }
  }
}
