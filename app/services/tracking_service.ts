import User from '#models/user'
import TrackedGame from '#models/tracked_game'
import TrackedSet from '#models/tracked_set'
import JustTCGService from './just_tcg_service.js'

/**
 * TrackingService
 *
 * Orchestrates discovery and sync flows for tracked games and sets.
 * Keeps business logic thin by delegating API work and persistence to JustTCGService.
 */
export default class TrackingService {
  /**
   * Discover sets for all active tracked games for a user.
   * Skips games that do not currently need discovery.
   */
  async discoverSetsForTrackedGames(userId: number): Promise<void> {
    const user = await User.findOrFail(userId)
    const justTcg = new JustTCGService(user)

    const trackedGames = await TrackedGame.query().where('user_id', userId).where('is_active', true)

    for (const trackedGame of trackedGames) {
      if (!trackedGame.needsDiscovery()) {
        continue
      }
      await justTcg.getSets(trackedGame.gameId, trackedGame)
    }
  }

  /**
   * Sync cards and variants for all active tracked sets for a user.
   * Skips sets that do not currently need sync.
   */
  async syncCardsForTrackedSets(userId: number): Promise<void> {
    const user = await User.findOrFail(userId)
    const justTcg = new JustTCGService(user)

    const trackedSets = await TrackedSet.query().where('user_id', userId).where('is_active', true)

    for (const trackedSet of trackedSets) {
      if (!trackedSet.needsSync()) {
        continue
      }
      await justTcg.getCardsBySet(trackedSet.setId, trackedSet)
    }
  }

  /**
   * Sync a single set by database setId.
   * When force = true, bypasses the needsSync check.
   */
  async syncSet(userId: number, setId: number, force: boolean = false): Promise<void> {
    const user = await User.findOrFail(userId)
    const justTcg = new JustTCGService(user)

    const trackedSet = await TrackedSet.query()
      .where('user_id', userId)
      .where('set_id', setId)
      .first()

    // If not tracked, still allow a one-off sync (without trackedSet timestamp updates)
    if (!trackedSet) {
      await justTcg.getCardsBySet(setId)
      return
    }

    if (!force && !trackedSet.needsSync()) {
      return
    }

    await justTcg.getCardsBySet(trackedSet.setId, trackedSet)
  }
}
