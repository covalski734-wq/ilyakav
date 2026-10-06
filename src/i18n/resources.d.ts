import 'i18next'
import type ru from './locales/ru.json'
import type ruCases from './locales/cases.ru.json'
import type ruOffering from './locales/offering.ru.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof ru & { webCases: typeof ruCases; offering: typeof ruOffering }
    }
  }
}
