import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FEATURE_FLAGS } from './config/site'
import { Header } from './components/Header'
import { MobileMenu } from './components/MobileMenu'
import { BottomBar } from './components/BottomBar'
import { Hero } from './sections/Hero'
import { LaptopScene } from './sections/LaptopScene'
import { FlagshipCase } from './sections/FlagshipCase'
import { SelectedWork } from './sections/SelectedWork'
import { MorphScene } from './sections/MorphScene'
import { Range } from './sections/Range'
import { Services } from './sections/Services'
import { Team } from './sections/Team'
import { Process } from './sections/Process'
import { Ownership } from './sections/Ownership'
import { Faq } from './sections/Faq'
import { Testimonials } from './sections/Testimonials'
import { FinalCta } from './sections/FinalCta'
import { Footer } from './sections/Footer'
import { ContactPage } from './pages/ContactPage'
import { MarianaleusCasePage } from './pages/MarianaleusCasePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AboutPage } from './pages/AboutPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { WebCasePage } from './pages/WebCasePage'
import { WEB_CASES, WEB_CASE_IDS, type WebCaseId } from './config/cases'
import { ServicePage } from './pages/ServicePage'
import { SERVICE_IDS, servicePath } from './config/services'

type RouteName = 'home' | 'contact' | 'caseMariana' | 'about' | 'privacy' | 'notFound' | WebCaseId

const normalizePathname = (pathname: string) => pathname.replace(/\/+$/, '') || '/'

const getRoute = (pathname: string): RouteName => {
  const webCase = WEB_CASE_IDS.find(id => WEB_CASES[id].path === normalizePathname(pathname))
  if (webCase) return webCase
  switch (normalizePathname(pathname)) {
    case '/':
      return 'home'
    case '/contact':
      return 'contact'
    case '/case/marianaleus':
      return 'caseMariana'
    case '/about':
      return 'about'
    case '/privacy':
      return 'privacy'
    default:
      return 'notFound'
  }
}

const META_KEYS = {
  home: { title: 'meta.homeTitle', description: 'meta.homeDescription' },
  contact: {
    title: 'meta.contactTitle',
    description: 'meta.contactDescription',
  },
  caseMariana: { title: 'meta.caseTitle', description: 'meta.caseDescription' },
  skyline: { title: 'webCases.projects.skyline.title', description: 'webCases.projects.skyline.summary' },
  maryna: { title: 'webCases.projects.maryna.title', description: 'webCases.projects.maryna.summary' },
  tile: { title: 'webCases.projects.tile.title', description: 'webCases.projects.tile.summary' },
  about: { title: 'meta.aboutTitle', description: 'meta.aboutDescription' },
  privacy: {
    title: 'meta.privacyTitle',
    description: 'meta.privacyDescription',
  },
  notFound: {
    title: 'meta.notFoundTitle',
    description: 'meta.notFoundDescription',
  },
} as const

function HomePage() {
  return (
    <>
      <Hero />
      <LaptopScene />
      <FlagshipCase />
      {FEATURE_FLAGS.showSelectedWork && <SelectedWork />}
      <MorphScene />
      <Range />
      <Services />
      <Ownership />
      <Process />
      <Team />
      <Faq />
      {FEATURE_FLAGS.showTestimonials && <Testimonials />}
      <FinalCta />
    </>
  )
}

export function App() {
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const route = getRoute(window.location.pathname)
  const service = SERVICE_IDS.find(id => servicePath(id) === normalizePathname(window.location.pathname))

  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    const meta = META_KEYS[route]
    document.title = service ? `${t(`offering.pages.${service}.title`)} | ilyakav` : WEB_CASE_IDS.includes(route as WebCaseId) ? `${t(meta.title)} | ilyakav` : t(meta.title)

    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!description) {
      description = document.createElement('meta')
      description.name = 'description'
      document.head.append(description)
    }
    description.content = service ? t(`offering.pages.${service}.lead`) : t(meta.description)
  }, [i18n.resolvedLanguage, route, service, t])

  const page = {
    home: <HomePage />,
    contact: <ContactPage />,
    caseMariana: <MarianaleusCasePage />,
    skyline: <WebCasePage id="skyline" />,
    maryna: <WebCasePage id="maryna" />,
    tile: <WebCasePage id="tile" />,
    about: <AboutPage />,
    privacy: <PrivacyPage />,
    notFound: <NotFoundPage />,
  }[route]

  return (
    <>
      <Header menuOpen={menuOpen} onToggleMenu={toggleMenu} />
      <MobileMenu open={menuOpen} onClose={closeMenu} />

      <main>{service ? <ServicePage id={service} /> : page}</main>

      {route === 'home' && <BottomBar />}
      <Footer />
    </>
  )
}
