import { createI18n } from 'vue-i18n'
import en from './locales/en'
import no from './locales/no'

// Get the saved locale from localStorage or default to 'en'
const savedLocale = localStorage.getItem('userLocale') || 'en'

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
})

export default i18n
