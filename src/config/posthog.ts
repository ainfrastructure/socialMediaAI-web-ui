import posthog from 'posthog-js'
import type { Router } from 'vue-router'

export function initPostHog(router: Router) {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
  const environment = import.meta.env.VITE_POSTHOG_ENVIRONMENT || import.meta.env.MODE

  // Only initialize PostHog if API key is provided
  if (!apiKey) {
    console.warn('PostHog API key not configured - analytics disabled')
    return
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    person_profiles: 'identified_only', // Only create profiles for logged-in users

    // Capture pageviews and other events
    capture_pageview: false, // We'll manually capture pageviews on route changes
    capture_pageleave: true,

    // Session recording (optional - can be expensive)
    session_recording: environment === 'production' ? {
      recordCrossOriginIframes: false,
      maskAllInputs: true, // Mask sensitive form inputs
      maskTextSelector: '.sensitive, [data-private]',
    } : undefined,

    // Autocapture (tracks clicks, form submissions, etc.)
    autocapture: {
      dom_event_allowlist: ['click'], // Only track clicks
      element_allowlist: ['button', 'a'], // Only track buttons and links
      css_selector_allowlist: ['.analytics-track'], // Track elements with this class
    },

    // Performance
    disable_persistence: false,
    persistence: 'localStorage',

    // Privacy
    respect_dnt: true,
    opt_out_capturing_by_default: false,

    // Development
    loaded: (posthog) => {
      if (environment === 'development') {
        posthog.debug()
      }
    },
  })

  // Track page views on route changes
  router.afterEach((to) => {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      path: to.path,
      name: to.name,
    })
  })

  console.log('✅ PostHog analytics initialized')
}

// Helper to identify a user (call after login)
export function identifyUser(userId: string, properties?: Record<string, any>) {
  posthog.identify(userId, properties)
}

// Helper to reset user (call on logout)
export function resetUser() {
  posthog.reset()
}

// Helper to track custom events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties)
}

// Helper to track feature flags
export function getFeatureFlag(flagKey: string): boolean | string {
  return posthog.getFeatureFlag(flagKey) || false
}

// Helper to check if a feature flag is enabled
export function isFeatureEnabled(flagKey: string): boolean {
  return posthog.isFeatureEnabled(flagKey) || false
}

// Helper to set user properties (without identifying)
export function setUserProperties(properties: Record<string, any>) {
  posthog.setPersonProperties(properties)
}

// Helper to track conversions/revenue
export function trackRevenue(amount: number, currency: string = 'USD', properties?: Record<string, any>) {
  posthog.capture('purchase', {
    revenue: amount,
    currency,
    ...properties,
  })
}

// Export the posthog instance for advanced usage
export { posthog }
