import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Locale = 'en' | 'no'
export type Currency = 'USD' | 'NOK'

export const useLocaleStore = defineStore('locale', () => {
  // Get saved locale from localStorage or default to 'en'
  const savedLocale = localStorage.getItem('userLocale') as Locale | null
  const currentLocale = ref<Locale>(savedLocale || 'en')

  // Currency for dev access pricing testing
  const savedCurrency = localStorage.getItem('devCurrency') as Currency | null
  const currentCurrency = ref<Currency>(savedCurrency || 'USD')

  // Check if devAccess mode is enabled (localhost or query string)
  const isDevAccess = computed(() => {
    if (typeof window === 'undefined') return false
    // Always enabled on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return true
    }
    // Or via query string
    const params = new URLSearchParams(window.location.search)
    return params.get('devAccess') === 'true'
  })

  /**
   * Set the current locale and persist to localStorage
   */
  function setLocale(locale: Locale) {
    currentLocale.value = locale
    localStorage.setItem('userLocale', locale)
  }

  /**
   * Toggle between English and Norwegian
   */
  function toggleLocale() {
    const newLocale: Locale = currentLocale.value === 'en' ? 'no' : 'en'
    setLocale(newLocale)
  }

  /**
   * Get the display name for a locale
   */
  function getLocaleName(locale: Locale): string {
    const names: Record<Locale, string> = {
      en: 'English',
      no: 'Norsk',
    }
    return names[locale]
  }

  /**
   * Get the flag emoji for a locale
   */
  function getLocaleFlag(locale: Locale): string {
    const flags: Record<Locale, string> = {
      en: '🇬🇧',
      no: '🇳🇴',
    }
    return flags[locale]
  }

  /**
   * Set the current currency and persist to localStorage (dev access only)
   */
  function setCurrency(currency: Currency) {
    currentCurrency.value = currency
    localStorage.setItem('devCurrency', currency)
  }

  /**
   * Get the display name for a currency
   */
  function getCurrencyName(currency: Currency): string {
    const names: Record<Currency, string> = {
      USD: 'US Dollar',
      NOK: 'Norwegian Krone',
    }
    return names[currency]
  }

  /**
   * Get the symbol for a currency
   */
  function getCurrencySymbol(currency: Currency): string {
    const symbols: Record<Currency, string> = {
      USD: '$',
      NOK: 'kr',
    }
    return symbols[currency]
  }

  /**
   * Available currencies for selection
   */
  const availableCurrencies: Currency[] = ['USD', 'NOK']

  return {
    currentLocale,
    setLocale,
    toggleLocale,
    getLocaleName,
    getLocaleFlag,
    // Currency (dev access)
    currentCurrency,
    isDevAccess,
    setCurrency,
    getCurrencyName,
    getCurrencySymbol,
    availableCurrencies,
  }
})
