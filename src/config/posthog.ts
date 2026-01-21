import posthog from 'posthog-js'
import type { Router } from 'vue-router'
import { warnLog, infoLog } from '@/utils/debug'
import { env } from './environment'

export function initPostHog(router: Router) {
  // Only initialize PostHog if API key is provided
  if (!env.posthog.enabled) {
    warnLog('PostHog API key not configured - analytics disabled')
    return
  }

  posthog.init(env.posthog.apiKey!, {
    api_host: env.posthog.apiHost,
    person_profiles: 'identified_only', // Only create profiles for logged-in users

    // Capture pageviews and other events
    capture_pageview: false, // We'll manually capture pageviews on route changes
    capture_pageleave: true,

    // Session recording (optional - can be expensive)
    session_recording: env.isProduction ? {
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
      if (env.isDevelopment) {
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

  infoLog('✅ PostHog analytics initialized')
}

// Helper to track custom events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties)
}
