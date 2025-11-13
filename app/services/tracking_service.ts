import User from '#models/user'
import TrackedGame from '#models/tracked_game'
import TrackedSet from '#models/tracked_set'
import JustTCGService from './just_tcg_service.js'
import Game from '#models/game'
import Set from '#models/set'

/**
 * TrackingService
 *
 * Orchestrates discovery and sync flows for tracked games and sets.
 * Keeps business logic thin by delegating API work and persistence to JustTCGService.
 */
export default class TrackingService {
  /**
   * Track a game for a user (idempotent).
   */
  async trackGame(userId: number, gameId: number) {
    await Game.findOrFail(gameId)
    const existing = await TrackedGame.query()
      .where('user_id', userId)
      .where('game_id', gameId)
      .first()
    if (existing) return existing
    return await TrackedGame.create({ userId, gameId, isActive: true })
  }

  /**
   * Untrack a game for a user (no-op if not tracked).
   */
  async untrackGame(userId: number, gameId: number): Promise<boolean> {
    const existing = await TrackedGame.query()
      .where('user_id', userId)
      .where('game_id', gameId)
      .first()
    if (!existing) return false
    await existing.delete()
    return true
  }

  /**
   * Toggle active status of a tracked game.
   */
  async toggleGameTracking(userId: number, gameId: number) {
    const tracked = await TrackedGame.query()
      .where('user_id', userId)
      .where('game_id', gameId)
      .first()
    if (!tracked) return await TrackedGame.create({ userId, gameId, isActive: true })
    tracked.isActive = !tracked.isActive
    await tracked.save()
    return tracked
  }

  /**
   * Track a set for a user (idempotent).
   */
  async trackSet(userId: number, setId: number) {
    await Set.findOrFail(setId)
    const existing = await TrackedSet.query()
      .where('user_id', userId)
      .where('set_id', setId)
      .first()
    if (existing) return existing
    return await TrackedSet.create({ userId, setId, isActive: true })
  }

  /**
   * Untrack a set for a user (no-op if not tracked).
   */
  async untrackSet(userId: number, setId: number): Promise<boolean> {
    const existing = await TrackedSet.query()
      .where('user_id', userId)
      .where('set_id', setId)
      .first()
    if (!existing) return false
    await existing.delete()
    return true
  }

  /**
   * Toggle active status of a tracked set.
   */
  async toggleSetTracking(userId: number, setId: number) {
    const tracked = await TrackedSet.query().where('user_id', userId).where('set_id', setId).first()
    if (!tracked) return await TrackedSet.create({ userId, setId, isActive: true })
    tracked.isActive = !tracked.isActive
    await tracked.save()
    return tracked
  }
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
