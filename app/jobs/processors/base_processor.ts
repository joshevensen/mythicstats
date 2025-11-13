import { DateTime } from 'luxon'
import type { Job } from 'bullmq'
import User from '#models/user'
import JustTCGService from '#services/just_tcg_service'
import { RateLimitError } from '#services/errors'
import logger from '@adonisjs/core/services/logger'

export abstract class BaseProcessor {
  protected user: User
  protected justTcgService: JustTCGService

  constructor(user: User) {
    this.user = user
    this.justTcgService = new JustTCGService(user)
  }

  protected async checkAndHandleRateLimit(job: Job, requiredRequests: number = 1): Promise<boolean> {
    await this.user.refresh()
    const canMake = this.user.canMakeApiRequest(requiredRequests)
    if (!canMake) {
      const resetTime = this.calculateResetTime()
      const delayMs = resetTime.diffNow('milliseconds').milliseconds
      if (delayMs > 0) {
        await job.moveToDelayed(delayMs)
        logger.info('Job rescheduled due to rate limit', {
          jobId: job.id,
          jobName: job.name,
          resetTime: resetTime.toISO(),
          dailyRemaining: this.user.apiDailyRequestsRemaining,
          monthlyRemaining: this.user.apiRequestsRemaining,
        })
        return false
      }
    }
    return true
  }

  protected calculateResetTime(): DateTime {
    return this.justTcgService.calculateResetTime()
  }

  async process(job: Job): Promise<void> {
    try {
      const canProceed = await this.checkAndHandleRateLimit(job)
      if (!canProceed) {
        return
      }
      await this.handle(job)
    } catch (error) {
      if (error instanceof RateLimitError) {
        const resetTime = error.resetTime || this.calculateResetTime()
        const delayMs = resetTime.diffNow('milliseconds').milliseconds
        await job.moveToDelayed(delayMs)
        return
      }
      throw error
    }
  }

  protected abstract handle(job: Job): Promise<void>
}


