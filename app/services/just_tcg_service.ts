import { JustTCG } from 'justtcg-js'
import User from '#models/user'
import Game from '#models/game'
import Set from '#models/set'
import Card from '#models/card'
import CardVariant from '#models/card_variant'
import TrackedGame from '#models/tracked_game'
import TrackedSet from '#models/tracked_set'
import { DateTime } from 'luxon'
import type { JustTCGApiResponse } from 'justtcg-js'
import logger from '@adonisjs/core/services/logger'
import { RateLimitError, ApiError, NetworkError } from './errors.js'

export default class JustTCGService {
  private client: JustTCG
  private user: User

  constructor(user: User) {
    this.user = user
    // SDK automatically uses JUSTTCG_API_KEY env var
    this.client = new JustTCG()
  }

  /**
   * Log errors for debugging
   */
  private logError(error: Error, context: Record<string, any> = {}): void {
    logger.error('JustTCGService error', {
      error: error.message,
      name: error.name,
      stack: error.stack,
      ...context,
    })
  }

  /**
   * Validate API response structure
   */
  private validateResponse<T>(response: JustTCGApiResponse<T>): void {
    if (!response) {
      throw new ApiError('Invalid response: response is null or undefined')
    }

    if (!response.data && !response.error) {
      throw new ApiError('Invalid response: missing data and error fields')
    }

    // Validate data structure if needed
    if (response.data && !Array.isArray(response.data) && typeof response.data !== 'object') {
      throw new ApiError('Invalid response: data is not in expected format')
    }
  }

  /**
   * Handle API errors from response
   */
  private async handleApiError(response: JustTCGApiResponse<any>): Promise<void> {
    if (response.error) {
      // Rate limit error (429)
      const errorCode = (response.error as any)?.code || response.code
      if (errorCode === 429 || errorCode === '429') {
        const resetTime = this.calculateResetTime()

        throw new RateLimitError(
          'Rate limit exceeded. Please try again later.',
          resetTime,
          response.usage
        )
      }

      // Other API errors
      throw new ApiError(
        (response.error as any)?.message || response.error || 'API error occurred',
        typeof errorCode === 'number' ? errorCode : undefined,
        response
      )
    }
  }

  /**
   * Handle SDK call with error handling
   */
  private async handleSdkCall<T>(
    apiCall: () => Promise<JustTCGApiResponse<T>>
  ): Promise<JustTCGApiResponse<T>> {
    try {
      const response = await apiCall()

      // Check for API-level errors in response
      if (response.error) {
        await this.handleApiError(response)
      }

      // Update rate limit info (even on error, if usage available)
      if (response.usage) {
        await this.updateRateLimitInfo(response)
      }

      return response
    } catch (error) {
      // Handle network errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (
          errorMessage.includes('network') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('connection')
        ) {
          throw new NetworkError('Network error occurred', error)
        }
      }

      // Handle SDK errors
      throw new ApiError(
        `SDK Error: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error
      )
    }
  }

  /**
   * Retry network errors with exponential backoff
   */
  private async retryWithBackoff<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall()
      } catch (error) {
        lastError = error as Error

        // Don't retry rate limit errors
        if (error instanceof RateLimitError) {
          throw error
        }

        // Don't retry non-network errors
        if (!(error instanceof NetworkError)) {
          throw error
        }

        // Last attempt, don't wait
        if (attempt === maxRetries - 1) {
          break
        }

        // Calculate delay (exponential backoff)
        const delay = initialDelay * Math.pow(2, attempt)

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  /**
   * Check if API can be accessed
   */
  async checkRateLimit(count: number = 1): Promise<{ canMake: boolean; reason?: string }> {
    // Check monthly limit
    if ((this.user.apiRequestsRemaining ?? 0) < count) {
      return {
        canMake: false,
        reason: `Monthly limit exceeded. ${this.user.apiRequestsRemaining ?? 0} remaining, need ${count}`,
      }
    }

    // Check daily limit
    if ((this.user.apiDailyRequestsRemaining ?? 0) < count) {
      return {
        canMake: false,
        reason: `Daily limit exceeded. ${this.user.apiDailyRequestsRemaining ?? 0} remaining, need ${count}`,
      }
    }

    return { canMake: true }
  }

  /**
   * Update rate limit info from SDK response
   */
  async updateRateLimitInfo(response: JustTCGApiResponse<any>): Promise<void> {
    if (!response.usage) {
      return // No usage info in response
    }

    const usage = response.usage

    // Update user with rate limit info
    this.user.updateRateLimitInfo({
      plan: usage.apiPlan,
      monthlyLimit: usage.apiRequestLimit,
      dailyLimit: usage.apiDailyLimit,
      rateLimit: usage.apiRateLimit,
      requestsUsed: usage.apiRequestsUsed,
      dailyRequestsUsed: usage.apiDailyRequestsUsed,
      requestsRemaining: usage.apiRequestsRemaining,
      dailyRequestsRemaining: usage.apiDailyRequestsRemaining,
    })

    await this.user.save()
  }

  /**
   * Calculate when rate limits reset
   */
  calculateResetTime(): DateTime {
    // Daily reset: midnight UTC
    const now = DateTime.now().setZone('UTC')
    const dailyReset = now.startOf('day').plus({ days: 1 })

    // Monthly reset: depends on plan
    // For now, assume first of next month
    const monthlyReset = now.startOf('month').plus({ months: 1 })

    // Return the earlier reset time
    return dailyReset < monthlyReset ? dailyReset : monthlyReset
  }

  /**
   * Get current rate limit status (for UI display)
   */
  getRateLimitStatus() {
    return {
      plan: this.user.apiPlan,
      monthly: {
        limit: this.user.apiMonthlyLimit,
        used: this.user.apiRequestsUsed,
        remaining: this.user.apiRequestsRemaining,
        percentage: this.user.apiMonthlyLimit
          ? ((this.user.apiRequestsUsed ?? 0) / this.user.apiMonthlyLimit) * 100
          : 0,
      },
      daily: {
        limit: this.user.apiDailyLimit,
        used: this.user.apiDailyRequestsUsed,
        remaining: this.user.apiDailyRequestsRemaining,
        percentage: this.user.apiDailyLimit
          ? ((this.user.apiDailyRequestsUsed ?? 0) / this.user.apiDailyLimit) * 100
          : 0,
      },
      canMakeRequest: this.user.canMakeApiRequest(),
      resetTime: this.calculateResetTime(),
    }
  }

  /**
   * Helper: Map variant data from API to database fields
   */
  private mapVariantData(variantData: any, cardId: number) {
    return {
      cardId,
      justTcgVariantId: variantData.id,
      tcgplayerSkuId: variantData.tcgplayerSkuId ?? null,
      condition: variantData.condition,
      printing: variantData.printing ?? null,
      language: variantData.language ?? null,
      price: variantData.price,
      currency: 'USD', // Default, API doesn't always provide
      lastUpdated: variantData.lastUpdated ?? null,
      // 24hr & 7d Statistics
      priceChange24hr: variantData.priceChange24hr ?? null,
      priceChange7d: variantData.priceChange7d ?? null,
      avgPrice7d: variantData.avgPrice ?? null, // API uses avgPrice for 7d
      minPrice7d: variantData.minPrice7d ?? null,
      maxPrice7d: variantData.maxPrice7d ?? null,
      stddevPopPrice7d: variantData.stddevPopPrice7d ?? null,
      covPrice7d: variantData.covPrice7d ?? null,
      iqrPrice7d: variantData.iqrPrice7d ?? null,
      trendSlope7d: variantData.trendSlope7d ?? null,
      priceChangesCount7d: variantData.priceChangesCount7d ?? null,
      priceHistory7d: variantData.priceHistory ?? null, // API uses priceHistory for 7d
      // 30d Statistics
      priceChange30d: variantData.priceChange30d ?? null,
      avgPrice30d: variantData.avgPrice30d ?? null,
      minPrice30d: variantData.minPrice30d ?? null,
      maxPrice30d: variantData.maxPrice30d ?? null,
      stddevPopPrice30d: variantData.stddevPopPrice30d ?? null,
      covPrice30d: variantData.covPrice30d ?? null,
      iqrPrice30d: variantData.iqrPrice30d ?? null,
      trendSlope30d: variantData.trendSlope30d ?? null,
      priceChangesCount30d: variantData.priceChangesCount30d ?? null,
      priceRelativeTo30dRange: variantData.priceRelativeTo30dRange ?? null,
      priceHistory30d: variantData.priceHistory30d ?? null,
      // 90d Statistics
      priceChange90d: variantData.priceChange90d ?? null,
      avgPrice90d: variantData.avgPrice90d ?? null,
      minPrice90d: variantData.minPrice90d ?? null,
      maxPrice90d: variantData.maxPrice90d ?? null,
      stddevPopPrice90d: variantData.stddevPopPrice90d ?? null,
      covPrice90d: variantData.covPrice90d ?? null,
      iqrPrice90d: variantData.iqrPrice90d ?? null,
      trendSlope90d: variantData.trendSlope90d ?? null,
      priceChangesCount90d: variantData.priceChangesCount90d ?? null,
      priceRelativeTo90dRange: variantData.priceRelativeTo90dRange ?? null,
      // 1 Year Statistics
      minPrice1y: variantData.minPrice1y ?? null,
      maxPrice1y: variantData.maxPrice1y ?? null,
      // All Time Statistics
      minPriceAllTime: variantData.minPriceAllTime ?? null,
      minPriceAllTimeDate: variantData.minPriceAllTimeDate
        ? DateTime.fromISO(variantData.minPriceAllTimeDate)
        : null,
      maxPriceAllTime: variantData.maxPriceAllTime ?? null,
      maxPriceAllTimeDate: variantData.maxPriceAllTimeDate
        ? DateTime.fromISO(variantData.maxPriceAllTimeDate)
        : null,
    }
  }

  /**
   * Fetch all available games and persist to database
   */
  async getGames(): Promise<JustTCGApiResponse<any[]>> {
    try {
      // Check rate limit
      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.canMake) {
        throw new RateLimitError(rateLimitCheck.reason || 'Rate limit exceeded')
      }

      // Make API call with retry
      const response = await this.retryWithBackoff(async () => {
        return await this.handleSdkCall(() => this.client.v1.games.list())
      })

      // Validate response
      this.validateResponse(response)

      // Upsert games to database
      for (const gameData of response.data) {
        await Game.updateOrCreate(
          { justTcgGameId: gameData.id },
          {
            justTcgGameId: gameData.id,
            name: gameData.name,
            slug: (gameData as any).slug ?? null,
            cardsCount: gameData.cards_count ?? null,
            setsCount: gameData.sets_count ?? null,
            lastUpdatedAt: (gameData as any).last_updated ?? null,
          }
        )
      }

      return response
    } catch (error) {
      this.logError(error as Error, { method: 'getGames', userId: this.user.id })
      throw error
    }
  }

  /**
   * Fetch all sets for a specific game and persist to database
   */
  async getSets(gameId: number, trackedGame?: TrackedGame): Promise<JustTCGApiResponse<any[]>> {
    try {
      // Check rate limit
      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.canMake) {
        throw new RateLimitError(rateLimitCheck.reason || 'Rate limit exceeded')
      }

      // Get game to find JustTCG ID
      const game = await Game.findOrFail(gameId)

      // Make API call with retry
      const response = await this.retryWithBackoff(async () => {
        return await this.handleSdkCall(() =>
          this.client.v1.sets.list({ game: game.justTcgGameId })
        )
      })

      // Validate response
      this.validateResponse(response)

      // Upsert sets to database
      for (const setData of response.data) {
        const existingSet = await Set.findBy('just_tcg_set_id', setData.id)
        const incomingLastUpdated =
          (setData as any).last_updated ?? (setData as any).lastUpdated ?? null

        // Skip update if our record is newer or equal
        if (
          existingSet &&
          existingSet.lastUpdatedAt !== null &&
          incomingLastUpdated !== null &&
          existingSet.lastUpdatedAt >= incomingLastUpdated
        ) {
          continue
        }

        await Set.updateOrCreate(
          { justTcgSetId: setData.id },
          {
            gameId: game.id,
            justTcgSetId: setData.id,
            name: setData.name,
            slug: (setData as any).slug ?? null,
            releaseDate: setData.release_date ? DateTime.fromISO(setData.release_date) : null,
            cardsCount: (setData as any).cards_count ?? (setData as any).count ?? null,
            lastUpdatedAt: incomingLastUpdated,
          }
        )
      }

      // Update tracked game timestamp if provided
      if (trackedGame) {
        await trackedGame.markDiscoveryComplete()
      }

      return response
    } catch (error) {
      this.logError(error as Error, { method: 'getSets', userId: this.user.id, gameId })
      throw error
    }
  }

  /**
   * Fetch cards for a specific set with pagination and persist to database
   */
  async getCardsBySet(setId: number, trackedSet?: TrackedSet): Promise<JustTCGApiResponse<any[]>> {
    try {
      // Get set to find JustTCG ID
      const set = await Set.findOrFail(setId)

      // Determine batch size based on plan
      const batchSize = this.user.apiPlan === 'Free Tier' ? 20 : 100

      let offset = 0
      let allCards: any[] = []
      let hasMore = true
      let lastResponse: JustTCGApiResponse<any[]> | null = null

      while (hasMore) {
        // Check rate limit before each page
        const rateLimitCheck = await this.checkRateLimit()
        if (!rateLimitCheck.canMake) {
          throw new RateLimitError(rateLimitCheck.reason || 'Rate limit exceeded')
        }

        // Make API call with retry
        const response = await this.retryWithBackoff(async () => {
          return await this.handleSdkCall(() =>
            this.client.v1.cards.get({
              set: set.justTcgSetId,
              limit: batchSize,
              offset: offset,
            })
          )
        })

        // Validate response
        this.validateResponse(response)
        lastResponse = response

        // Process cards and variants
        for (const cardData of response.data) {
          const existingCard = await Card.findBy('just_tcg_card_id', cardData.id)
          const incomingLastUpdated =
            (cardData as any).last_updated ?? (cardData as any).lastUpdated ?? null

          // If existing and newer or equal, skip updating the card record
          const shouldSkipCardUpdate =
            existingCard &&
            existingCard.lastUpdatedAt !== null &&
            incomingLastUpdated !== null &&
            existingCard.lastUpdatedAt >= incomingLastUpdated

          // Upsert card
          const card = shouldSkipCardUpdate
            ? existingCard!
            : await Card.updateOrCreate(
                { justTcgCardId: cardData.id },
                {
                  setId: set.id,
                  justTcgCardId: cardData.id,
                  name: cardData.name,
                  number: (cardData as any).number ?? null,
                  rarity: (cardData as any).rarity ?? null,
                  details: (cardData as any).details
                    ? typeof (cardData as any).details === 'string'
                      ? JSON.parse((cardData as any).details)
                      : (cardData as any).details
                    : null,
                  tcgplayerId:
                    (cardData as any).tcgplayerId ?? (cardData as any).tcgplayer_id ?? null,
                  mtgjsonId: (cardData as any).mtgjsonId ?? (cardData as any).mtgjson_id ?? null,
                  scryfallId: (cardData as any).scryfallId ?? (cardData as any).scryfall_id ?? null,
                  lastUpdatedAt: incomingLastUpdated,
                }
              )

          // Upsert variants
          if (cardData.variants && cardData.variants.length > 0) {
            for (const variantData of cardData.variants) {
              await CardVariant.updateOrCreate(
                { justTcgVariantId: variantData.id },
                this.mapVariantData(variantData, card.id)
              )
            }
          }

          allCards.push(card)
        }

        // Check if more pages
        hasMore = response.data.length === batchSize
        offset += batchSize
      }

      // Update tracked set timestamp if provided
      if (trackedSet) {
        await trackedSet.markSynced()
      }

      // Return final response (combine all pages)
      return {
        data: allCards,
        usage: lastResponse?.usage,
        pagination: lastResponse?.pagination,
      } as JustTCGApiResponse<any[]>
    } catch (error) {
      this.logError(error as Error, { method: 'getCardsBySet', userId: this.user.id, setId })
      throw error
    }
  }

  /**
   * Fetch cards for a specific game with pagination and persist to database
   */
  async getCardsByGame(gameId: number): Promise<JustTCGApiResponse<any[]>> {
    try {
      // Get game to find JustTCG ID
      const game = await Game.findOrFail(gameId)

      // Determine batch size based on plan
      const batchSize = this.user.apiPlan === 'Free Tier' ? 20 : 100

      let offset = 0
      let allCards: any[] = []
      let hasMore = true
      let lastResponse: JustTCGApiResponse<any[]> | null = null

      while (hasMore) {
        // Check rate limit before each page
        const rateLimitCheck = await this.checkRateLimit()
        if (!rateLimitCheck.canMake) {
          throw new RateLimitError(rateLimitCheck.reason || 'Rate limit exceeded')
        }

        // Make API call with retry
        const response = await this.retryWithBackoff(async () => {
          return await this.handleSdkCall(() =>
            this.client.v1.cards.get({
              game: game.justTcgGameId,
              limit: batchSize,
              offset: offset,
            })
          )
        })

        // Validate response
        this.validateResponse(response)
        lastResponse = response

        // Process cards and variants (same logic as getCardsBySet)
        for (const cardData of response.data) {
          const existingCard = await Card.findBy('just_tcg_card_id', cardData.id)
          const incomingLastUpdated =
            (cardData as any).last_updated ?? (cardData as any).lastUpdated ?? null

          const shouldSkipCardUpdate =
            existingCard &&
            existingCard.lastUpdatedAt !== null &&
            incomingLastUpdated !== null &&
            existingCard.lastUpdatedAt >= incomingLastUpdated

          // Find set by JustTCG ID
          const set = await Set.findBy('justTcgSetId', cardData.set)
          if (!set) {
            // Skip cards with unknown sets
            continue
          }

          // Upsert card
          const card = shouldSkipCardUpdate
            ? existingCard!
            : await Card.updateOrCreate(
                { justTcgCardId: cardData.id },
                {
                  setId: set.id,
                  justTcgCardId: cardData.id,
                  name: cardData.name,
                  number: (cardData as any).number ?? null,
                  rarity: (cardData as any).rarity ?? null,
                  details: (cardData as any).details
                    ? typeof (cardData as any).details === 'string'
                      ? JSON.parse((cardData as any).details)
                      : (cardData as any).details
                    : null,
                  tcgplayerId:
                    (cardData as any).tcgplayerId ?? (cardData as any).tcgplayer_id ?? null,
                  mtgjsonId: (cardData as any).mtgjsonId ?? (cardData as any).mtgjson_id ?? null,
                  scryfallId: (cardData as any).scryfallId ?? (cardData as any).scryfall_id ?? null,
                  lastUpdatedAt: incomingLastUpdated,
                }
              )

          // Upsert variants
          if (cardData.variants && cardData.variants.length > 0) {
            for (const variantData of cardData.variants) {
              await CardVariant.updateOrCreate(
                { justTcgVariantId: variantData.id },
                this.mapVariantData(variantData, card.id)
              )
            }
          }

          allCards.push(card)
        }

        // Check if more pages
        hasMore = response.data.length === batchSize
        offset += batchSize
      }

      // Return final response
      return {
        data: allCards,
        usage: lastResponse?.usage,
        pagination: lastResponse?.pagination,
      } as JustTCGApiResponse<any[]>
    } catch (error) {
      this.logError(error as Error, { method: 'getCardsByGame', userId: this.user.id, gameId })
      throw error
    }
  }

  /**
   * Batch fetch multiple cards by JustTCG IDs and persist to database
   */
  async getCardsBatch(justTcgIds: string[]): Promise<JustTCGApiResponse<any[]>> {
    try {
      // Determine batch size
      const batchSize = this.user.apiPlan === 'Free Tier' ? 20 : 100

      let allCards: any[] = []
      let lastResponse: JustTCGApiResponse<any[]> | null = null

      // Process in batches
      for (let i = 0; i < justTcgIds.length; i += batchSize) {
        const batch = justTcgIds.slice(i, i + batchSize)

        // Check rate limit before each batch
        const rateLimitCheck = await this.checkRateLimit()
        if (!rateLimitCheck.canMake) {
          throw new RateLimitError(rateLimitCheck.reason || 'Rate limit exceeded')
        }

        // Prepare batch lookup items
        const batchItems = batch.map((id) => ({ cardId: id }))

        // Make API call with retry
        const response = await this.retryWithBackoff(async () => {
          return await this.handleSdkCall(() => this.client.v1.cards.getByBatch(batchItems))
        })

        // Validate response
        this.validateResponse(response)
        lastResponse = response

        // Process cards and variants
        for (const cardData of response.data) {
          const existingCard = await Card.findBy('just_tcg_card_id', cardData.id)
          const incomingLastUpdated =
            (cardData as any).last_updated ?? (cardData as any).lastUpdated ?? null

          const shouldSkipCardUpdate =
            existingCard &&
            existingCard.lastUpdatedAt !== null &&
            incomingLastUpdated !== null &&
            existingCard.lastUpdatedAt >= incomingLastUpdated

          // Find set by JustTCG ID
          const set = await Set.findBy('justTcgSetId', cardData.set)
          if (!set) {
            // Skip cards with unknown sets
            continue
          }

          // Upsert card
          const card = shouldSkipCardUpdate
            ? existingCard!
            : await Card.updateOrCreate(
                { justTcgCardId: cardData.id },
                {
                  setId: set.id,
                  justTcgCardId: cardData.id,
                  name: cardData.name,
                  number: (cardData as any).number ?? null,
                  rarity: (cardData as any).rarity ?? null,
                  details: (cardData as any).details
                    ? typeof (cardData as any).details === 'string'
                      ? JSON.parse((cardData as any).details)
                      : (cardData as any).details
                    : null,
                  tcgplayerId:
                    (cardData as any).tcgplayerId ?? (cardData as any).tcgplayer_id ?? null,
                  mtgjsonId: (cardData as any).mtgjsonId ?? (cardData as any).mtgjson_id ?? null,
                  scryfallId: (cardData as any).scryfallId ?? (cardData as any).scryfall_id ?? null,
                  lastUpdatedAt: incomingLastUpdated,
                }
              )

          // Upsert variants
          if (cardData.variants && cardData.variants.length > 0) {
            for (const variantData of cardData.variants) {
              await CardVariant.updateOrCreate(
                { justTcgVariantId: variantData.id },
                this.mapVariantData(variantData, card.id)
              )
            }
          }

          allCards.push(card)
        }
      }

      return {
        data: allCards,
        usage: lastResponse?.usage,
        pagination: lastResponse?.pagination,
      } as JustTCGApiResponse<any[]>
    } catch (error) {
      this.logError(error as Error, {
        method: 'getCardsBatch',
        userId: this.user.id,
        cardCount: justTcgIds.length,
      })
      throw error
    }
  }

  /**
   * Fetch single card by JustTCG ID and persist to database (rare use only)
   */
  async getCard(justTcgId: string): Promise<JustTCGApiResponse<any>> {
    try {
      // Check rate limit
      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.canMake) {
        throw new RateLimitError(rateLimitCheck.reason || 'Rate limit exceeded')
      }

      // Make API call with retry
      const response = await this.retryWithBackoff(async () => {
        return await this.handleSdkCall(() => this.client.v1.cards.get({ cardId: justTcgId }))
      })

      // Validate response
      this.validateResponse(response)

      // Process card (should only be one)
      if (response.data && response.data.length > 0) {
        const cardData = response.data[0]

        const existingCard = await Card.findBy('just_tcg_card_id', cardData.id)
        const incomingLastUpdated =
          (cardData as any).last_updated ?? (cardData as any).lastUpdated ?? null

        const shouldSkipCardUpdate =
          existingCard &&
          existingCard.lastUpdatedAt !== null &&
          incomingLastUpdated !== null &&
          existingCard.lastUpdatedAt >= incomingLastUpdated

        // Find set by JustTCG ID
        const set = await Set.findBy('justTcgSetId', cardData.set)
        if (!set) {
          throw new Error(`Set not found for card: ${cardData.set}`)
        }

        // Upsert card
        const card = shouldSkipCardUpdate
          ? existingCard!
          : await Card.updateOrCreate(
              { justTcgCardId: cardData.id },
              {
                setId: set.id,
                justTcgCardId: cardData.id,
                name: cardData.name,
                number: (cardData as any).number ?? null,
                rarity: (cardData as any).rarity ?? null,
                details: (cardData as any).details
                  ? typeof (cardData as any).details === 'string'
                    ? JSON.parse((cardData as any).details)
                    : (cardData as any).details
                  : null,
                tcgplayerId:
                  (cardData as any).tcgplayerId ?? (cardData as any).tcgplayer_id ?? null,
                mtgjsonId: (cardData as any).mtgjsonId ?? (cardData as any).mtgjson_id ?? null,
                scryfallId: (cardData as any).scryfallId ?? (cardData as any).scryfall_id ?? null,
                lastUpdatedAt: incomingLastUpdated,
              }
            )

        // Upsert variants
        if (cardData.variants && cardData.variants.length > 0) {
          for (const variantData of cardData.variants) {
            await CardVariant.updateOrCreate(
              { justTcgVariantId: variantData.id },
              this.mapVariantData(variantData, card.id)
            )
          }
        }

        return {
          data: [card],
          usage: response.usage,
          pagination: response.pagination,
        } as JustTCGApiResponse<any[]>
      }

      return response
    } catch (error) {
      this.logError(error as Error, { method: 'getCard', userId: this.user.id, justTcgId })
      throw error
    }
  }
}
