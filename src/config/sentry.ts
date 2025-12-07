import * as Sentry from '@sentry/vue'
import type { App } from 'vue'
import type { Router } from 'vue-router'

export function initSentry(app: App, router: Router) {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE

  // Only initialize Sentry if DSN is provided
  if (!dsn) {
    console.warn('Sentry DSN not configured - error tracking disabled')
    return
  }

  Sentry.init({
    app,
    dsn,
    environment,

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance Monitoring sample rate (10% of transactions)
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Session Replay sample rate
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Ignore common non-critical errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'cancelled', // User cancelled requests
    ],

    // Add context to errors
    beforeSend(event, hint) {
      // Filter out localhost/development noise if needed
      if (environment === 'development' && event.request?.url?.includes('localhost')) {
        return null
      }
      return event
    },
  })
}

// Helper to manually capture errors
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  })
}
