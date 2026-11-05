import { useCallback, useEffect, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Header } from './components/Header'
import { MobileMenu } from './components/MobileMenu'
import { Footer } from './sections/Footer'
import { restoreLanguage } from './i18n'
import { pageMeta, updateMeta } from './seo'
import { CookieConsent } from './components/CookieConsent'
import { ImageLightbox } from './components/ImageLightbox'
import { SITE } from './config/site'
import { trackEvent, trackPage } from './lib/consent'

const SkipLink = styled.a`
  position: fixed; top: 8px; left: 16px; z-index: 1000;
  padding: 14px 20px; background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text}; border: 2px solid currentColor;
  transform: translateY(-160%);
  &:focus { transform: none; }
`
export function App({ pathname, Page }: { pathname: string; Page: ComponentType }) {
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = useCallback(() => setMenuOpen(open => !open), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useEffect(() => { restoreLanguage() }, [])
  useEffect(() => { trackPage(pathname) }, [pathname])
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
      if (!link) return
      if (link.pathname === '/contact' && link.origin === location.origin) trackEvent('cta_click', 'contact')
      else if (link.href === SITE.telegram.url) trackEvent('cta_click', 'telegram')
      else if (link.href === SITE.whatsapp.url) trackEvent('cta_click', 'whatsapp')
      else if (link.protocol === 'mailto:') trackEvent('cta_click', 'email')
    }
    document.addEventListener('click', click, true)
    return () => document.removeEventListener('click', click, true)
  }, [])
  useEffect(() => { updateMeta(pageMeta(t, pathname)) }, [i18n.resolvedLanguage, pathname, t])
  return <>
    <SkipLink href="#main-content">{t('actions.skipToContent')}</SkipLink>
    <Header pathname={pathname} menuOpen={menuOpen} onToggleMenu={toggleMenu} />
    <MobileMenu pathname={pathname} open={menuOpen} onClose={closeMenu} />
    <main id="main-content" tabIndex={-1}><Page /></main>
    <Footer pathname={pathname} />
    <CookieConsent />
    <ImageLightbox />
  </>
}
