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

// Helper to track custom events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties)
}
