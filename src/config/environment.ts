/**
 * Centralized Environment Configuration
 *
 * Single source of truth for all environment variables.
 * Import from this module instead of using `import.meta.env` directly.
 */

// Type definitions
export type Environment = 'development' | 'staging' | 'production'

export interface EnvironmentConfig {
  env: Environment
  isProduction: boolean
  isDevelopment: boolean
  isStaging: boolean
  api: {
    baseUrl: string
  }
  debug: {
    enabled: boolean
  }
  sentry: {
    dsn: string | null
    environment: string
    enabled: boolean
  }
  posthog: {
    apiKey: string | null
    apiHost: string
    environment: string
    enabled: boolean
  }
}

/**
 * Helper to get env vars with validation
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] || defaultValue
  if (!value) {
    const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production'
    if (isProduction) {
      throw new Error(`[ENV] Missing required environment variable: ${key}`)
    }
    console.warn(`[ENV] Missing environment variable: ${key}`)
    return ''
  }
  return value
}

/**
 * Parse and validate environment
 */
function parseEnvironment(): Environment {
  const env = import.meta.env.VITE_ENVIRONMENT as string | undefined

  if (!env) {
    console.warn(
      '[ENV] VITE_ENVIRONMENT not set, defaulting to development. Set VITE_ENVIRONMENT in your .env file.'
    )
    return 'development'
  }

  const validEnvironments: Environment[] = ['development', 'staging', 'production']
  if (!validEnvironments.includes(env as Environment)) {
    throw new Error(
      `[ENV] Invalid VITE_ENVIRONMENT: "${env}". Must be one of: ${validEnvironments.join(', ')}`
    )
  }

  return env as Environment
}

// Parse and validate environment
const environment = parseEnvironment()

/**
 * Centralized environment configuration
 * Export as a single object for type-safe access
 */
export const env: EnvironmentConfig = {
  env: environment,
  isProduction: environment === 'production',
  isDevelopment: environment === 'development',
  isStaging: environment === 'staging',

  api: {
    baseUrl: getEnvVar('VITE_API_URL', 'http://localhost:3000'),
  },

  debug: {
    enabled: (import.meta.env.VITE_DEBUG || 'false') === 'true',
  },

  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN || null,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || environment,
    enabled: Boolean(import.meta.env.VITE_SENTRY_DSN),
  },

  posthog: {
    apiKey: import.meta.env.VITE_POSTHOG_API_KEY || null,
    apiHost: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    environment: import.meta.env.VITE_POSTHOG_ENVIRONMENT || environment,
    enabled: Boolean(import.meta.env.VITE_POSTHOG_API_KEY),
  },
}

// Log configuration in non-production environments
if (!env.isProduction) {
  console.log(`🌍 Frontend Environment: ${env.env.toUpperCase()}`)
  console.log(`🔗 API URL: ${env.api.baseUrl}`)
  console.log(`🐛 Debug: ${env.debug.enabled ? 'enabled' : 'disabled'}`)
  console.log(`📊 Sentry: ${env.sentry.enabled ? 'enabled' : 'disabled'}`)
  console.log(`📈 PostHog: ${env.posthog.enabled ? 'enabled' : 'disabled'}`)
  console.log(`---`)
}

// Backward compatibility exports
export const API_URL = env.api.baseUrl
export const DEBUG = env.debug.enabled
