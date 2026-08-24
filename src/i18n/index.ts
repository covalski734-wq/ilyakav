import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ru from './locales/ru.json'
import uk from './locales/uk.json'
import en from './locales/en.json'

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
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      uk: { translation: uk },
      en: { translation: en },
    },
    fallbackLng: 'ru',
    supportedLngs: LANGUAGES as unknown as string[],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

const syncDocumentLang = (lng: string) => {
  document.documentElement.lang = lng
}

syncDocumentLang(i18n.resolvedLanguage ?? 'ru')
i18n.on('languageChanged', syncDocumentLang)

export default i18n
