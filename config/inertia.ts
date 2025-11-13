import { defineConfig } from '@adonisjs/inertia'
import type { HttpContext } from '@adonisjs/core/http'

export default defineConfig({
  /**
   * The Edge view to use as the root for all Inertia responses.
   */
  rootView: 'inertia',

  /**
   * Shared data available to every Inertia response.
   */
  sharedData: {
    auth: (ctx: HttpContext) =>
      ctx.inertia.always(() => {
        const user = ctx.auth.user
        if (!user) return null
        return {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        }
      }),
    flash: (ctx: HttpContext) =>
      ctx.inertia.always(() => {
        const flashBag = ctx.session?.flashMessages?.all?.() ?? {}
        return {
          success: flashBag.success?.[0] ?? null,
          error: flashBag.error?.[0] ?? null,
          warning: flashBag.warning?.[0] ?? null,
        }
      }),
  },

  /**
   * Server-side rendering configuration.
   */
  ssr: {
    enabled: false,
  },
})
