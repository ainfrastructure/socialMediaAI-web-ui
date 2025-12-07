/**
 * Monitoring Utilities
 *
 * Helper functions to integrate Sentry and PostHog with your application.
 */

import { trackEvent } from '@/config/posthog'

/**
 * Track a custom event in PostHog
 * Use this for important user actions
 */
export { trackEvent }
