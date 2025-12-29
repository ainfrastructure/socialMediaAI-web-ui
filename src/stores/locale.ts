import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  type SupportedLocale,
  type SupportedCurrency,
  type DomainConfig,
} from '@/config/domains'

export type Locale = SupportedLocale
export type Currency = SupportedCurrency

// Locale metadata for display
const LOCALE_METADATA: Record<
  SupportedLocale,
  { name: string; nativeName: string; flag: string }
> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  no: { name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  sv: { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  da: { name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  fi: { name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  ch: { name: 'Swiss German', nativeName: 'Schweizerdeutsch', flag: '🇨🇭' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  pl: { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  cs: { name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
}

// Currency metadata for display
const CURRENCY_METADATA: Record<SupportedCurrency, { name: string; symbol: string }> = {
  USD: { name: 'US Dollar', symbol: '$' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr' },
  SEK: { name: 'Swedish Krona', symbol: 'kr' },
  GBP: { name: 'British Pound', symbol: '£' },
  DKK: { name: 'Danish Krone', symbol: 'kr' },
  EUR: { name: 'Euro', symbol: '€' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF' },
  PLN: { name: 'Polish Złoty', symbol: 'zł' },
  CZK: { name: 'Czech Koruna', symbol: 'Kč' },
}

export const useLocaleStore = defineStore('locale', () => {
  // State
  const currentLocale = ref<Locale>('en')
  const currentCurrency = ref<Currency>('USD')

  // Check if devAccess mode is enabled (localhost or query string)
  const isDevAccess = computed(() => {
    if (typeof window === 'undefined') return false
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return true
    }
    const params = new URLSearchParams(window.location.search)
    return params.get('devAccess') === 'true'
  })

  /**
   * Initialize from domain config
   * Should be called once at app startup
   * Domain always determines language
   */
  function initFromDomain(domainConfig: DomainConfig) {
    currentLocale.value = domainConfig.locale
    currentCurrency.value = domainConfig.currency

    // Check for dev currency override
    const savedCurrency = localStorage.getItem('devCurrency') as Currency | null
    if (savedCurrency && isDevAccess.value) {
      currentCurrency.value = savedCurrency
    }
  }

  /**
   * Set the current locale (used before redirect to new domain)
   */
  function setLocale(locale: Locale) {
    currentLocale.value = locale
  }


  /**
   * Get the display name for a locale (in native language)
   */
  function getLocaleName(locale: Locale): string {
    return LOCALE_METADATA[locale]?.nativeName || locale
  }

  /**
   * Get the flag emoji for a locale
   */
  function getLocaleFlag(locale: Locale): string {
    return LOCALE_METADATA[locale]?.flag || '🌐'
  }

  /**
   * Set the current currency (dev access only)
   */
  function setCurrency(currency: Currency) {
    currentCurrency.value = currency
    localStorage.setItem('devCurrency', currency)
  }

  /**
   * Get the display name for a currency
   */
  function getCurrencyName(currency: Currency): string {
    return CURRENCY_METADATA[currency]?.name || currency
  }

  /**
   * Get the symbol for a currency
   */
  function getCurrencySymbol(currency: Currency): string {
    return CURRENCY_METADATA[currency]?.symbol || currency
  }

  /**
   * Available currencies for selection
   */
  const availableCurrencies: Currency[] = [
    'USD',
    'NOK',
    'SEK',
    'GBP',
    'DKK',
    'EUR',
    'CHF',
    'PLN',
    'CZK',
  ]

  return {
    // State
    currentLocale,
    currentCurrency,
    isDevAccess,

    // Methods
    initFromDomain,
    setLocale,
    getLocaleName,
    getLocaleFlag,
    setCurrency,
    getCurrencyName,
    getCurrencySymbol,
    availableCurrencies,
  }
})
