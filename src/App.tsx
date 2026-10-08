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
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]')
      if (!link) return
      if (link.pathname === '/contact' && link.origin === location.origin) trackEvent('cta_click', 'contact')
      else if (link.href.startsWith('https://t.me/ilyakav')) trackEvent('cta_click', 'telegram')
      else if (link.protocol === 'mailto:') trackEvent('cta_click', 'email')
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
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
