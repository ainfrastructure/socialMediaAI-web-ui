import { createI18n } from 'vue-i18n'
import en from './locales/en'
import no from './locales/no'

// Detect browser language and map to supported locales
function detectBrowserLocale(): 'en' | 'no' {
  if (typeof window === 'undefined') return 'en'

  // Check if user has a saved preference first
  const savedLocale = localStorage.getItem('userLocale')
  if (savedLocale === 'en' || savedLocale === 'no') {
    return savedLocale
  }

  // Get browser language(s)
  const browserLang = navigator.language || (navigator as any).userLanguage || ''
  const browserLangs = navigator.languages || [browserLang]

  // Check if any browser language matches Norwegian
  for (const lang of browserLangs) {
    const langCode = lang.toLowerCase().split('-')[0]
    if (langCode === 'no' || langCode === 'nb' || langCode === 'nn') {
      return 'no'
    }
  }

  // Default to English
  return 'en'
}

const detectedLocale = detectBrowserLocale()

export type MessageSchema = typeof en

const i18n = createI18n<[MessageSchema], 'en' | 'no'>({
  legacy: false, // Use Composition API mode
  locale: detectedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    no,
  },
  // Global injection key
  globalInjection: true,
  // Strict mode - makes dev behave like production
  silentTranslationWarn: false, // Show warnings for missing translations
  silentFallbackWarn: false, // Show warnings when falling back to fallback locale
  missingWarn: true, // Warn about missing keys
  fallbackWarn: true, // Warn about fallback usage
  warnHtmlMessage: true, // Warn about HTML in messages (security)
  escapeParameter: false, // Don't escape parameters (allows HTML if needed)
})

export default i18n
