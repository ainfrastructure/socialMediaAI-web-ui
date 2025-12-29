import { createI18n } from 'vue-i18n'
import en from './locales/en'
import no from './locales/no'
import sv from './locales/sv'
import da from './locales/da'
import fi from './locales/fi'
import fr from './locales/fr'
import nl from './locales/nl'
import de from './locales/de'
import ch from './locales/ch'
import pt from './locales/pt'
import pl from './locales/pl'
import cs from './locales/cs'
import {
  TLD_CONFIGS,
  SUBDOMAIN_CONFIGS,
  DEFAULT_DOMAIN_CONFIG,
  type SupportedLocale,
} from '@/config/domains'

// Available translations
// Only en and no have full translations currently
// Other locales re-export en as placeholder until translated
const messages = {
  en,
  no,
  sv,
  da,
  fi,
  fr,
  nl,
  de,
  ch,
  pt,
  pl,
  cs,
}

type MessageSchema = typeof en
type AvailableLocale = keyof typeof messages

/**
 * Extract the base domain from a hostname
 */
function extractBaseDomain(hostname: string): string {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost'
  }
  const parts = hostname.split('.')
  if (parts.length >= 2) {
    return parts.slice(-2).join('.')
  }
  return hostname
}

/**
 * Extract the first subdomain from a hostname
 */
function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    return parts[0]
  }
  return null
}

/**
 * Get locale from a domain/hostname
 */
function getLocaleFromDomain(domain: string): SupportedLocale {
  const baseDomain = extractBaseDomain(domain)

  // Check language subdomains on .ai FIRST (e.g., de.socialchef.ai)
  // This must be checked before TLD configs because socialchef.ai is also in TLD_CONFIGS
  if (baseDomain === 'socialchef.ai') {
    const subdomain = extractSubdomain(domain)
    if (subdomain && SUBDOMAIN_CONFIGS[subdomain]) {
      return SUBDOMAIN_CONFIGS[subdomain].locale
    }
  }

  // Then check owned TLDs (socialchef.no, socialchef.se, etc.)
  if (TLD_CONFIGS[baseDomain]) {
    return TLD_CONFIGS[baseDomain].locale
  }

  return DEFAULT_DOMAIN_CONFIG.locale
}

/**
 * Get the domain's default locale
 * Checks ?domain= param first for testing, then actual hostname
 */
function getDomainLocale(hostname: string): SupportedLocale {
  // Check for query param override (for local testing)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const domainOverride = params.get('domain')
    if (domainOverride) {
      return getLocaleFromDomain(domainOverride)
    }
  }

  return getLocaleFromDomain(hostname)
}

/**
 * Check if a locale has available translations
 */
function isValidAvailableLocale(locale: string): locale is AvailableLocale {
  return locale in messages
}

/**
 * Get the initial locale for i18n
 * Domain always determines language
 */
function getInitialLocale(): AvailableLocale {
  if (typeof window === 'undefined') return 'en'

  // Get domain locale (handles ?domain= param for testing)
  const hostname = window.location.hostname
  const domainLocale = getDomainLocale(hostname)

  // If domain locale has translations, use it
  if (isValidAvailableLocale(domainLocale)) {
    return domainLocale
  }

  // Fallback to English
  return 'en'
}

const initialLocale = getInitialLocale()

const i18n = createI18n<[MessageSchema], AvailableLocale>({
  legacy: false, // Use Composition API mode
  locale: initialLocale,
  fallbackLocale: 'en',
  messages,
  globalInjection: true,
  silentTranslationWarn: false,
  silentFallbackWarn: false,
  missingWarn: true,
  fallbackWarn: true,
  warnHtmlMessage: true,
  escapeParameter: false,
})

export default i18n

/**
 * Update the i18n locale and HTML lang attribute
 */
export function setI18nLocale(locale: SupportedLocale) {
  // Use the locale directly if available, otherwise fallback to 'en'
  const effectiveLocale = isValidAvailableLocale(locale) ? locale : 'en'
  // Cast to work around vue-i18n typing issue with Composition API mode
  ;(i18n.global.locale as unknown as { value: string }).value = effectiveLocale

  // Update HTML lang attribute
  const htmlLangMap: Record<string, string> = {
    en: 'en',
    no: 'nb', // Norwegian Bokmal
    sv: 'sv',
    da: 'da',
    fi: 'fi',
    fr: 'fr',
    nl: 'nl',
    de: 'de',
    ch: 'de-CH', // Swiss German
    pt: 'pt',
    pl: 'pl',
    cs: 'cs',
  }
  document.documentElement.lang = htmlLangMap[effectiveLocale] || effectiveLocale
}
