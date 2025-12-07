import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Locale = 'en' | 'no'

export const useLocaleStore = defineStore('locale', () => {
  // Get saved locale from localStorage or default to 'en'
  const savedLocale = localStorage.getItem('userLocale') as Locale | null
  const currentLocale = ref<Locale>(savedLocale || 'en')

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

  return {
    currentLocale,
    setLocale,
    toggleLocale,
    getLocaleName,
    getLocaleFlag,
  }
})
