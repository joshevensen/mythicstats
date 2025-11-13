/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Auth routes (public)
router
  .group(() => {
    router.get('/login', '#controllers/auth_controller.showLogin')
    router.post('/login', '#controllers/auth_controller.login')
    router.post('/logout', '#controllers/auth_controller.logout')
  })
  .use(middleware.guest())

// Protected routes
router
  .group(() => {
    // Dashboard
    router.get('/', '#controllers/dashboard_controller.index')

    // Games
    router.get('/games', '#controllers/games_controller.index')
    router.get('/games/:gameId', '#controllers/games_controller.show')
    router.post('/games/:gameId/track', '#controllers/games_controller.track')
    router.delete('/games/:gameId/track', '#controllers/games_controller.untrack')
    router.patch('/games/:gameId/track', '#controllers/games_controller.toggleActive')
    router.post('/games/:gameId/discover-sets', '#controllers/games_controller.discoverSets')

    // Sets
    router.get('/sets/:setId', '#controllers/sets_controller.show')
    router.post('/sets/:setId/track', '#controllers/sets_controller.track')
    router.delete('/sets/:setId/track', '#controllers/sets_controller.untrack')
    router.patch('/sets/:setId/track', '#controllers/sets_controller.toggleActive')
    router.post('/sets/:setId/sync', '#controllers/sets_controller.sync')

    // Cards
    router.get('/sets/:setId/cards', '#controllers/cards_controller.index')
    router.get('/cards/:cardId', '#controllers/cards_controller.show')
    router.patch('/cards/:cardId', '#controllers/cards_controller.update')
    router.patch('/cards/variants/:variantId', '#controllers/cards_controller.updateVariant')

    // Inventory
    router.get('/inventory', '#controllers/inventory_controller.index')
    router.get('/inventory/:inventoryItemId', '#controllers/inventory_controller.show')
    router.post('/inventory', '#controllers/inventory_controller.store')
    router.delete('/inventory/:inventoryItemId', '#controllers/inventory_controller.destroy')
    router.patch(
      '/inventory/variants/:inventoryItemVariantId/quantity',
      '#controllers/inventory_controller.updateQuantity'
    )
    router.post(
      '/inventory/:inventoryItemId/resync',
      '#controllers/inventory_controller.resyncVariants'
    )
    router.post('/inventory/update-prices', '#controllers/inventory_controller.updatePrices')

    // Game Events
    router.get('/games/:gameId/events', '#controllers/game_events_controller.index')
    router.get('/games/:gameId/events/create', '#controllers/game_events_controller.create')
    router.post('/events', '#controllers/game_events_controller.store')
    router.get('/games/:gameId/events/:eventId', '#controllers/game_events_controller.edit')
    router.patch('/events/:eventId', '#controllers/game_events_controller.update')
    router.delete('/events/:eventId', '#controllers/game_events_controller.destroy')
  })
  .use(middleware.auth())
