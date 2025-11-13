import type { Job } from 'bullmq'
import User from '#models/user'
import TrackedSet from '#models/tracked_set'
import { BaseProcessor } from './base_processor.js'

export class SyncTrackedSetsProcessor extends BaseProcessor {
  constructor(user: User) {
    super(user)
  }

  protected async handle(job: Job): Promise<void> {
    const trackedSets = await TrackedSet.query()
      .where('user_id', this.user.id)
      .where('is_active', true)
      .preload('set')

    for (let i = 0; i < trackedSets.length; i++) {
      const trackedSet = trackedSets[i]
      if (!trackedSet.needsSync()) {
        continue
      }
      const canProceed = await this.checkAndHandleRateLimit(job, 1)
      if (!canProceed) {
        return
      }
      await this.justTcgService.getCardsBySet(trackedSet.setId, trackedSet)
      await job.updateProgress({ processed: i + 1, total: trackedSets.length })
    }
  }
}


