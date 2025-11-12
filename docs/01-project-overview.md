# Project Overview

## Purpose
Internal tool for personal use to track TCG card inventory, pricing, and game events using JustTCG API data.

## Core Functionality

### 1. User Management
- Single user system (personal use only)
- User table with rate limiting tracking

### 2. Game & Card Data
- Track which games from JustTCG are of interest
- Store games, sets, and cards data from JustTCG API
- Only fetch data for games that are being tracked

### 3. Inventory Management
- Store personal card inventory
- Track which cards are owned
- Prioritize price updates for owned cards

### 4. Game Events
- Create and manage game events (releases, championships, tournaments, etc.)
- Events can trigger price update notifications/alerts
- Events affect card pricing patterns

### 5. Price Tracking
- Store historical pricing data
- Update prices more frequently for inventory items
- Track price changes over time

### 6. API Rate Limiting
- Track daily and monthly JustTCG API limits
- Prevent API calls when limits are reached
- Automatically reset when limits expire
- Store rate limit status on user record

### 7. Job System
- Use BullMQ for job queue management
- Hourly jobs for:
  - Initial card data fetching for tracked games
  - Inventory price updates
  - Rate limit checking and resetting

## Technology Stack
- **Framework**: AdonisJS 6
- **Database**: PostgreSQL
- **ORM**: Lucid
- **Job Queue**: BullMQ
- **External API**: JustTCG
- **JustTCG SDK**: [justtcg-js](https://justtcg.com/docs/sdk) - Official TypeScript SDK for JustTCG API

## Key Constraints
- JustTCG has daily and monthly request limits
- Must respect rate limits to avoid API spam
- Only fetch data for games of interest
- Prioritize inventory price updates

