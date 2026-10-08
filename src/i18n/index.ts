import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ru from './locales/ru.json'
import uk from './locales/uk.json'
import en from './locales/en.json'
import ruCases from './locales/cases.ru.json'
import ukCases from './locales/cases.uk.json'
import enCases from './locales/cases.en.json'
import ruOffering from './locales/offering.ru.json'
import ukOffering from './locales/offering.uk.json'
import enOffering from './locales/offering.en.json'

export const LANGUAGES = ['ru', 'uk', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

/** Short labels used by the language switcher in the header and footer. */
export const LANGUAGE_LABELS: Record<Language, string> = {
  ru: 'RU',
  uk: 'UA',
  en: 'EN',
}

export const STORAGE_KEY = 'ilyakav-lang'

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: { ...ru, webCases: ruCases, offering: ruOffering } },
      uk: { translation: { ...uk, webCases: ukCases, offering: ukOffering } },
      en: { translation: { ...en, webCases: enCases, offering: enOffering } },
    },
    lng: 'ru',
    fallbackLng: 'ru',
    supportedLngs: LANGUAGES as unknown as string[],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
  })

const syncDocumentLang = (lng: string) => {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lng
  try { localStorage.setItem(STORAGE_KEY, lng) } catch { /* Storage may be disabled. */ }
}

i18n.on('languageChanged', syncDocumentLang)

export function restoreLanguage() {
  let preferred: string | null = null
  try { preferred = localStorage.getItem(STORAGE_KEY) } catch { /* Use browser preference. */ }
  const detected = preferred ?? navigator.languages.find(language => LANGUAGES.includes(language.slice(0, 2) as Language)) ?? 'ru'
  const language = detected.slice(0, 2)
  void i18n.changeLanguage(LANGUAGES.includes(language as Language) ? language : 'ru')
}

export default i18n
