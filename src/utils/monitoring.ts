/**
 * Monitoring Utilities
 *
 * Helper functions to integrate Sentry and PostHog with your application.
 * Import and use these functions throughout your app to track users and events.
 */

import { setUserContext as setSentryUser, clearUserContext as clearSentryUser } from '@/config/sentry'
import { identifyUser, resetUser, trackEvent, trackRevenue } from '@/config/posthog'

export interface User {
  id: string
  email?: string
  name?: string
  subscription?: {
    plan: string
    status: string
  }
}

/**
 * Call this when a user logs in
 * Sets user context in both Sentry and PostHog
 */
export function setMonitoringUser(user: User) {
  // Set user in Sentry for error tracking
  setSentryUser({
    id: user.id,
    email: user.email,
    username: user.name,
  })

  // Identify user in PostHog for analytics
  identifyUser(user.id, {
    email: user.email,
    name: user.name,
    plan: user.subscription?.plan,
    subscription_status: user.subscription?.status,
  })

  // Track login event
  trackEvent('user_logged_in', {
    plan: user.subscription?.plan,
    subscription_status: user.subscription?.status,
  })
}

/**
 * Call this when a user logs out
 * Clears user context from both Sentry and PostHog
 */
export function clearMonitoringUser() {
  // Track logout event before clearing
  trackEvent('user_logged_out')

  // Clear user from Sentry
  clearSentryUser()

  // Reset PostHog
  resetUser()
}

/**
 * Track a custom event in PostHog
 * Use this for important user actions
 */
export { trackEvent }

/**
 * Track revenue/conversions in PostHog
 * Call this when a user makes a purchase or upgrades
 */
export function trackPurchase(amount: number, currency: string, metadata?: Record<string, any>) {
  trackRevenue(amount, currency, metadata)

  trackEvent('purchase_completed', {
    amount,
    currency,
    ...metadata,
  })
}

/**
 * Track feature usage
 * Call this when users interact with key features
 */
export function trackFeatureUsage(feature: string, metadata?: Record<string, any>) {
  trackEvent('feature_used', {
    feature,
    ...metadata,
  })
}

/**
 * Track API errors
 * Call this in your API error handlers
 */
export function trackApiError(endpoint: string, statusCode: number, error: string) {
  trackEvent('api_error', {
    endpoint,
    status_code: statusCode,
    error_message: error,
  })
}

/**
 * Update user properties without re-identifying
 * Use this when user data changes (e.g., subscription upgrade)
 */
export function updateUserProperties(properties: Record<string, any>) {
  // Update Sentry user context
  setSentryUser({
    id: properties.id || 'unknown',
    email: properties.email,
    username: properties.name,
  })

  // Update PostHog user properties
  identifyUser(properties.id, properties)
}
