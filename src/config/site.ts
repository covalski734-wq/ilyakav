/**
 * Single source of truth for contacts and cross-page links.
 */
export const SITE = {
  email: 'covalski734@gmail.com',
  telegram: { handle: '@ilyakav', url: 'https://t.me/ilyakav' },
  phone: { display: '+48 572 197 330', href: 'tel:+48572197330' },
  flagship: 'marianaleus.com',
  advertisingPartner: { name: 'Mariana Leus', url: 'https://marianaleus.com/' },
} as const

export const ROUTES = {
  contact: '/contact',
  caseMarianaleus: '/case/marianaleus',
  about: '/about',
  privacy: '/privacy',
} as const

export const SECTION_IDS = {
  top: 'top',
  work: 'work',
  range: 'range',
  services: 'services',
  about: 'about',
} as const

/** Nav entries, in the order they appear in the header, menu and footer. */
export const NAV_LINKS = [
  { key: 'work', href: `/#${SECTION_IDS.work}` },
  { key: 'range', href: `/#${SECTION_IDS.range}` },
  { key: 'services', href: `/#${SECTION_IDS.services}` },
  { key: 'about', href: ROUTES.about },
  { key: 'contact', href: ROUTES.contact },
] as const

/**
 * Hero background loop. Drop a file at this path in `public/` and it plays
 * full-bleed; otherwise the animated gradient fallback stays on screen.
 */
export const HERO_VIDEO = {
  src: '/media/hero.mp4',
  poster: '',
  focus: '72% center',
} as const

export const FEATURE_FLAGS = {
  showSelectedWork: false,
  showConcepts: false,
  showTestimonials: false,
  /** Playful asides — the badge on the portrait and the closing line of the range grid. */
  personality: true,
} as const
