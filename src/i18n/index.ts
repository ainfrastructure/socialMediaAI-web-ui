import { createI18n } from 'vue-i18n'
import en from './locales/en'
import no from './locales/no'

// Get the saved locale from localStorage or default to 'en'
// Safe check for localStorage availability (SSR/build-time safe)
const savedLocale = typeof window !== 'undefined'
  ? (localStorage.getItem('userLocale') || 'en')
  : 'en'

export type MessageSchema = typeof en

const i18n = createI18n<[MessageSchema], 'en' | 'no'>({
  legacy: false, // Use Composition API mode
  locale: savedLocale,
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
