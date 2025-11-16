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
})

export default i18n
