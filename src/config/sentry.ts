import * as Sentry from '@sentry/vue'
import type { App } from 'vue'
import type { Router } from 'vue-router'
import { warnLog } from '@/utils/debug'
import { env } from './environment'

export function initSentry(app: App, router: Router) {
  // Only initialize Sentry if DSN is provided
  if (!env.sentry.enabled) {
    warnLog('Sentry DSN not configured - error tracking disabled')
    return
  }

  Sentry.init({
    app,
    dsn: env.sentry.dsn!,
    environment: env.sentry.environment,

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance Monitoring sample rate (10% of transactions)
    tracesSampleRate: env.isProduction ? 0.1 : 1.0,

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
    beforeSend(event, _hint) {
      // Filter out localhost/development noise if needed
      if (env.isDevelopment && event.request?.url?.includes('localhost')) {
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
