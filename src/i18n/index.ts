import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import de from './locales/de.json'

export type Locale = 'en' | 'de'
const LOCALE_KEY = 'simplib:locale'

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved === 'en' || saved === 'de') return saved
  } catch {
    // storage unavailable: fall back to browser language
  }
  return navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { en, de },
})

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    // ignore
  }
}

document.documentElement.lang = i18n.global.locale.value
