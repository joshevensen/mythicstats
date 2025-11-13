import { DateTime } from 'luxon'

export class RateLimitError extends Error {
  constructor(
    message: string,
    public resetTime?: DateTime,
    public usage?: any
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}
