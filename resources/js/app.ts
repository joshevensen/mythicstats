import { createApp, h, type DefineComponent, type Plugin } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import Aura from '@primevue/themes/aura'

import './bootstrap'
import '../css/app.css'

createInertiaApp({
  progress: {
    color: '#2563eb',
  },
  resolve: (name: string) => {
    const pages = import.meta.glob<DefineComponent>('./pages/**/*.vue', { eager: true })
    return pages[`./pages/${name}.vue`]
  },
  setup({
    el,
    App,
    props,
    plugin,
  }: {
    el: Record<string, unknown>
    App: DefineComponent
    props: Record<string, unknown>
    plugin: Plugin
  }) {
    const vueApp = createApp({ render: () => h(App, props) })
    vueApp.use(plugin)
    vueApp.use(PrimeVue, {
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
          cssLayer: {
            name: 'primevue',
          },
        },
      },
    })
    vueApp.use(ToastService)
    vueApp.use(ConfirmationService)
    vueApp.directive('tooltip', Tooltip)
    vueApp.mount(el)
  },
})
