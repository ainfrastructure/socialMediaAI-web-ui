/**
 * Domain Configuration
 *
 * Maps domains to their locale, currency, and region settings.
 * Supports both owned TLDs (socialchef.no, .se, etc.) and
 * language subdomains on .ai (de.socialchef.ai)
 */

// All locales that could be configured (translations added incrementally)
export type SupportedLocale =
  | 'en'
  | 'no'
  | 'sv'
  | 'da'
  | 'fi'
  | 'fr'
  | 'nl'
  | 'de'
  | 'ch'
  | 'pt'
  | 'pl'
  | 'cs'

// All currencies used across domains
export type SupportedCurrency =
  | 'USD'
  | 'NOK'
  | 'SEK'
  | 'GBP'
  | 'DKK'
  | 'EUR'
  | 'CHF'
  | 'PLN'
  | 'CZK'

export interface DomainConfig {
  locale: SupportedLocale
  currency: SupportedCurrency
  region: string // ISO 3166-1 alpha-2
  htmlLang: string // For <html lang=""> attribute
  flag: string // Emoji flag
}

/**
 * Owned TLD domains
 * These take priority over subdomain configs
 */
export const TLD_CONFIGS: Record<string, DomainConfig> = {
  // Default/International
  'socialchef.ai': {
    locale: 'en',
    currency: 'USD',
    region: 'US',
    htmlLang: 'en',
    flag: '🇺🇸',
  },

  // Nordic
  'socialchef.no': {
    locale: 'no',
    currency: 'NOK',
    region: 'NO',
    htmlLang: 'nb',
    flag: '🇳🇴',
  },
  'socialchef.se': {
    locale: 'sv',
    currency: 'SEK',
    region: 'SE',
    htmlLang: 'sv',
    flag: '🇸🇪',
  },
  'socialchef.dk': {
    locale: 'da',
    currency: 'DKK',
    region: 'DK',
    htmlLang: 'da',
    flag: '🇩🇰',
  },
  'socialchef.fi': {
    locale: 'fi',
    currency: 'EUR',
    region: 'FI',
    htmlLang: 'fi',
    flag: '🇫🇮',
  },

  // Western Europe
  'socialchef.uk': {
    locale: 'en',
    currency: 'GBP',
    region: 'GB',
    htmlLang: 'en-GB',
    flag: '🇬🇧',
  },
  'socialchef.fr': {
    locale: 'fr',
    currency: 'EUR',
    region: 'FR',
    htmlLang: 'fr',
    flag: '🇫🇷',
  },
  'socialchef.be': {
    locale: 'nl',
    currency: 'EUR',
    region: 'BE',
    htmlLang: 'nl-BE',
    flag: '🇧🇪',
  },
  'socialchef.ch': {
    locale: 'ch',
    currency: 'CHF',
    region: 'CH',
    htmlLang: 'de-CH',
    flag: '🇨🇭',
  },
  'socialchef.at': {
    locale: 'de',
    currency: 'EUR',
    region: 'AT',
    htmlLang: 'de-AT',
    flag: '🇦🇹',
  },

  // Southern/Eastern Europe
  'socialchef.pt': {
    locale: 'pt',
    currency: 'EUR',
    region: 'PT',
    htmlLang: 'pt',
    flag: '🇵🇹',
  },
  'socialchef.pl': {
    locale: 'pl',
    currency: 'PLN',
    region: 'PL',
    htmlLang: 'pl',
    flag: '🇵🇱',
  },
  'socialchef.cz': {
    locale: 'cs',
    currency: 'CZK',
    region: 'CZ',
    htmlLang: 'cs',
    flag: '🇨🇿',
  },
}

/**
 * Language subdomain configs for languages without owned TLD
 * Used on .ai domain: de.socialchef.ai → German
 *
 * NOTE: Only add locales here that DON'T have an owned TLD.
 * Locales with owned TLDs (no, sv, da, etc.) should NOT be here -
 * users accessing those subdomains will be redirected to the owned TLD.
 */
export const SUBDOMAIN_CONFIGS: Record<string, DomainConfig> = {
  de: {
    locale: 'de',
    currency: 'EUR',
    region: 'DE',
    htmlLang: 'de',
    flag: '🇩🇪',
  },
  // Add more as needed: es, it, etc.
}

/**
 * Map of locale codes to their preferred owned TLD domain
 * Used to redirect language subdomains to owned TLDs
 * e.g., no.socialchef.ai → socialchef.no
 */
export const LOCALE_TO_OWNED_TLD: Record<string, string> = {
  no: 'socialchef.no',
  sv: 'socialchef.se',
  da: 'socialchef.dk',
  fi: 'socialchef.fi',
  fr: 'socialchef.fr',
  nl: 'socialchef.be',
  pt: 'socialchef.pt',
  pl: 'socialchef.pl',
  cs: 'socialchef.cz',
  // Note: 'de' is NOT here because we don't own socialchef.de
  // German users go to de.socialchef.ai
}

/**
 * Default config used for:
 * - socialchef.ai (main international domain)
 * - Unknown domains
 * - localhost
 */
export const DEFAULT_DOMAIN_CONFIG = TLD_CONFIGS['socialchef.ai']

/**
 * List of locales that have translation files available
 * All locales now have translation files (placeholders for non-EN/NO)
 */
export const AVAILABLE_TRANSLATION_LOCALES: SupportedLocale[] = [
  'en',
  'no',
  'sv',
  'da',
  'fi',
  'fr',
  'nl',
  'de',
  'ch',
  'pt',
  'pl',
  'cs',
]

/**
 * Available domains for the language selector
 * Each entry is a domain that can be selected
 */
export type SelectableDomain = {
  domain: string
  locale: SupportedLocale
  name: string // Display name in native language
  flag: string
}

export const SELECTABLE_DOMAINS: SelectableDomain[] = [
  // English
  { domain: 'socialchef.ai', locale: 'en', name: 'English', flag: '🇺🇸' },
  { domain: 'socialchef.uk', locale: 'en', name: 'English (UK)', flag: '🇬🇧' },
  // Nordic
  { domain: 'socialchef.no', locale: 'no', name: 'Norsk', flag: '🇳🇴' },
  { domain: 'socialchef.se', locale: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { domain: 'socialchef.dk', locale: 'da', name: 'Dansk', flag: '🇩🇰' },
  { domain: 'socialchef.fi', locale: 'fi', name: 'Suomi', flag: '🇫🇮' },
  // German-speaking
  { domain: 'de.socialchef.ai', locale: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { domain: 'socialchef.at', locale: 'de', name: 'Deutsch (AT)', flag: '🇦🇹' },
  { domain: 'socialchef.ch', locale: 'ch', name: 'Deutsch (CH)', flag: '🇨🇭' },
  // Western Europe
  { domain: 'socialchef.fr', locale: 'fr', name: 'Français', flag: '🇫🇷' },
  { domain: 'socialchef.be', locale: 'nl', name: 'Nederlands', flag: '🇧🇪' },
  // Southern/Eastern Europe
  { domain: 'socialchef.pt', locale: 'pt', name: 'Português', flag: '🇵🇹' },
  { domain: 'socialchef.pl', locale: 'pl', name: 'Polski', flag: '🇵🇱' },
  { domain: 'socialchef.cz', locale: 'cs', name: 'Čeština', flag: '🇨🇿' },
]

/**
 * Check if a locale has translations available
 */
export function hasTranslations(locale: SupportedLocale): boolean {
  return AVAILABLE_TRANSLATION_LOCALES.includes(locale)
}
