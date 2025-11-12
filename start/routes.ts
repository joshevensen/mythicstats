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
router.group(() => {
  router.get('/login', '#controllers/auth_controller.showLogin')
  router.post('/login', '#controllers/auth_controller.login')
  router.post('/logout', '#controllers/auth_controller.logout')
}).use(middleware.guest())

// Protected routes
router.group(() => {
  router.on('/').render('pages/home')
}).use(middleware.auth())
