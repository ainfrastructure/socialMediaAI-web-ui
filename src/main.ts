import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { initSentry } from './config/sentry'
import { initPostHog } from './config/posthog'
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

// Initialize Sentry for error tracking and performance monitoring
initSentry(app, router)

// Initialize PostHog for analytics and user tracking
initPostHog(router)

app.mount('#app')
