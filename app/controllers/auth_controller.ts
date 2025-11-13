import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { errors } from '@adonisjs/auth'
import app from '@adonisjs/core/services/app'

export default class AuthController {
  async showLogin({ inertia }: HttpContext) {
    return inertia.render('Auth/Login', {
      isDevelopment: !app.inProduction,
    })
  }

  async login({ request, auth, response, session, logger }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      // Use verifyCredentials which is timing-attack safe
      // This method finds the user and verifies the password in one call
      const user = await User.verifyCredentials(email, password)

      // Login user
      await auth.use('web').login(user)
      session.flash('success', 'Logged in successfully')
      return response.redirect('/')
    } catch (error) {
      // verifyCredentials throws E_INVALID_CREDENTIALS exception
      // which is automatically handled by the exception handler
      // but we can catch it here for custom handling
      if (error instanceof errors.E_INVALID_CREDENTIALS) {
        logger.error('Login failed: Invalid credentials', {
          email,
          error: error.message,
          stack: error.stack,
        })
        session.flash('error', 'Invalid credentials')
        return response.redirect().back()
      }

      // Log other errors
      logger.error('Login failed: Unexpected error', {
        email,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })

      // Re-throw other errors
      throw error
    }
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/login')
  }
}
