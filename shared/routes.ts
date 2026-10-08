export const PUBLIC_PATHS = [
  '/', '/about', '/contact', '/privacy', '/cookies', '/case/marianaleus',
  '/case/skyline-stretch-ceilings', '/case/maryna-cleaning', '/case/tile-expert-solutions',
  '/services/business-websites', '/services/landing-pages', '/services/website-redesign',
  '/services/web-applications', '/services/desktop-applications', '/services/telegram-bots',
  '/services/crm-automation', '/services/booking-and-payments',
] as const
export const SITE_ORIGIN = 'https://ilyakav.com'
export const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/'
export const isPublicPath = (path: string) => (PUBLIC_PATHS as readonly string[]).includes(path)
