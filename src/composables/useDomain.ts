import { computed, readonly, ref } from 'vue'
import {
  TLD_CONFIGS,
  SUBDOMAIN_CONFIGS,
  DEFAULT_DOMAIN_CONFIG,
  AVAILABLE_TRANSLATION_LOCALES,
  LOCALE_TO_OWNED_TLD,
  type DomainConfig,
  type SupportedLocale,
} from '@/config/domains'

/**
 * Extract the base domain from a hostname
 * Examples:
 *   staging.socialchef.no → socialchef.no
 *   baofrontend.socialchef.ai → socialchef.ai
 *   socialchef.uk → socialchef.uk
 *   localhost → localhost
 */
function extractBaseDomain(hostname: string): string {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost'
  }

  const parts = hostname.split('.')
  if (parts.length >= 2) {
    // Get last two parts: socialchef.no, socialchef.ai, etc.
    return parts.slice(-2).join('.')
  }

  return hostname
}

/**
 * Extract the first subdomain from a hostname
 * Examples:
 *   de.socialchef.ai → de
 *   staging.socialchef.ai → staging
 *   socialchef.ai → null
 */
function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.')
  // Need at least 3 parts for a subdomain: sub.domain.tld
  if (parts.length >= 3) {
    return parts[0]
  }
  return null
}

/**
 * Get config from a domain/hostname (without checking query params)
 */
function getConfigFromDomain(domain: string): DomainConfig {
  const baseDomain = extractBaseDomain(domain)

  // Check language subdomains on .ai FIRST (e.g., de.socialchef.ai)
  // This must be checked before TLD configs because socialchef.ai is also in TLD_CONFIGS
  if (baseDomain === 'socialchef.ai') {
    const subdomain = extractSubdomain(domain)
    if (subdomain && SUBDOMAIN_CONFIGS[subdomain]) {
      return SUBDOMAIN_CONFIGS[subdomain]
    }
  }

  // Then check owned TLDs (socialchef.no, socialchef.se, etc.)
  if (TLD_CONFIGS[baseDomain]) {
    return TLD_CONFIGS[baseDomain]
  }

  // Fallback to default
  return DEFAULT_DOMAIN_CONFIG
}

/**
 * Get the domain config for a given hostname
 * Checks ?domain= param first for testing, then actual hostname
 */
function getDomainConfig(hostname: string): DomainConfig {
  // Check for query param override (for local testing)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const domainOverride = params.get('domain')
    if (domainOverride) {
      return getConfigFromDomain(domainOverride)
    }
  }

  return getConfigFromDomain(hostname)
}

// Singleton state (initialized once at app start)
const currentHostname = ref<string>('')
const currentDomain = ref<string>('')
const domainConfig = ref<DomainConfig>(DEFAULT_DOMAIN_CONFIG)
const isInitialized = ref(false)

/**
 * Composable for domain detection and configuration
 *
 * Usage:
 * ```ts
 * const { initialize, domainConfig } = useDomain()
 *
 * onMounted(() => {
 *   initialize()
 *   console.log(domainConfig.value.locale) // 'no' for socialchef.no
 * })
 * ```
 */
export function useDomain() {
  /**
   * Initialize domain detection
   * Should be called once at app startup (e.g., in App.vue onMounted)
   */
  function initialize() {
    if (isInitialized.value || typeof window === 'undefined') return

    currentHostname.value = window.location.hostname
    currentDomain.value = extractBaseDomain(currentHostname.value)
    domainConfig.value = getDomainConfig(currentHostname.value)
    isInitialized.value = true
  }

  // Computed helpers
  const isKnownDomain = computed(() => currentDomain.value in TLD_CONFIGS)

  const isLocalhost = computed(
    () =>
      currentHostname.value === 'localhost' ||
      currentHostname.value === '127.0.0.1'
  )

  const isLanguageSubdomain = computed(() => {
    if (currentDomain.value !== 'socialchef.ai') return false
    const subdomain = extractSubdomain(currentHostname.value)
    return subdomain !== null && subdomain in SUBDOMAIN_CONFIGS
  })

  /**
   * Get all locales that have translations available
   * Used by LanguageSelector to show available language options
   */
  const availableLocales = computed((): SupportedLocale[] => {
    return AVAILABLE_TRANSLATION_LOCALES
  })

  /**
   * Check if the current subdomain should redirect to an owned TLD
   * e.g., no.socialchef.ai → socialchef.no
   *
   * Returns the target domain to redirect to, or null if no redirect needed
   */
  function getSubdomainRedirect(): string | null {
    if (typeof window === 'undefined') return null

    const hostname = window.location.hostname
    const baseDomain = extractBaseDomain(hostname)

    // Only check subdomains on socialchef.ai
    if (baseDomain !== 'socialchef.ai') return null

    const subdomain = extractSubdomain(hostname)
    if (!subdomain) return null

    // Check if this subdomain matches a locale that has an owned TLD
    if (LOCALE_TO_OWNED_TLD[subdomain]) {
      return LOCALE_TO_OWNED_TLD[subdomain]
    }

    return null
  }

  /**
   * Perform redirect to owned TLD if needed
   * Call this on app initialization to redirect language subdomains
   * Returns true if a redirect was initiated
   */
  function redirectToOwnedTldIfNeeded(): boolean {
    const targetDomain = getSubdomainRedirect()
    if (targetDomain) {
      const newUrl = new URL(window.location.href)
      newUrl.hostname = targetDomain
      window.location.href = newUrl.toString()
      return true
    }
    return false
  }

  return {
    // State (readonly to prevent external mutations)
    currentHostname: readonly(currentHostname),
    currentDomain: readonly(currentDomain),
    domainConfig: readonly(domainConfig),
    isInitialized: readonly(isInitialized),

    // Computed
    isKnownDomain,
    isLocalhost,
    isLanguageSubdomain,
    availableLocales,

    // Methods
    initialize,
    redirectToOwnedTldIfNeeded,
  }
}
