import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import 'material-symbols/outlined.css'

// Scroll to top on page refresh (before browser restores scroll position)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}
window.scrollTo(0, 0)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')

// Defer Sentry + PostHog to after first paint (~80-130KB out of critical path)
const ric = window.requestIdleCallback || ((cb: IdleRequestCallback) => setTimeout(cb, 2000))
ric(() => {
  import('./config/sentry').then(({ initSentry }) => initSentry(app, router))
  import('./config/posthog').then(({ initPostHog }) => initPostHog(router))
}, { timeout: 3000 })
