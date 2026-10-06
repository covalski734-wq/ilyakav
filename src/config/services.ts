export const SERVICE_PAGES = {
  site: { slug: 'business-websites', type: 'site' },
  landing: { slug: 'landing-pages', type: 'landing' },
  redesign: { slug: 'website-redesign', type: 'redesign' },
  app: { slug: 'web-applications', type: 'webApp' },
  desktop: { slug: 'desktop-applications', type: 'desktop' },
  bot: { slug: 'telegram-bots', type: 'bot' },
  automation: { slug: 'crm-automation', type: 'automation' },
  booking: { slug: 'booking-and-payments', type: 'booking' },
} as const
export type ServiceId = keyof typeof SERVICE_PAGES
export const SERVICE_IDS = Object.keys(SERVICE_PAGES) as ServiceId[]
export const servicePath = (id: ServiceId) => `/services/${SERVICE_PAGES[id].slug}`
