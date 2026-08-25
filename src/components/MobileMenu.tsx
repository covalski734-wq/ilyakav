import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { NAV_LINKS, SITE } from '../config/site'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

const Panel = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 26px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding:
    calc(clamp(90px, 20vw, 130px) + env(safe-area-inset-top))
    clamp(20px, 6vw, 36px)
    calc(clamp(28px, 8vw, 44px) + env(safe-area-inset-bottom));
  background: ${({ theme }) => theme.colors.bg};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  /* visibility keeps the closed panel's links out of the tab order */
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transform: ${({ $open }) => ($open ? 'none' : 'translateY(-12px)')};
  transition:
    opacity 0.35s ease,
    transform 0.4s cubic-bezier(0.2, 0.8, 0.3, 1),
    visibility 0.35s;

  @media (max-height: 620px) {
    justify-content: flex-start;
    gap: 18px;
    padding-top: calc(82px + env(safe-area-inset-top));
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 86% 14%, ${({ theme }) => theme.colors.accentSoft}, transparent 34%);
    opacity: 0.72;
  }
`

const Links = styled.nav`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;

  a {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(34px, 11vw, 52px);
    font-weight: 650;
    line-height: 1;
    letter-spacing: -0.045em;
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
  }

  a:last-child {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Contacts = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;

  a {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textDim};
    text-decoration: none;
  }
`

const Controls = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 18px;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
`

type Props = {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: Props) {
  const { t } = useTranslation()
  useLockBodyScroll(open)

  return (
    <Panel $open={open} onClick={onClose}>
      <Links>
        {NAV_LINKS.map((link) => (
          <a key={link.key} href={link.href}>
            {t(`nav.${link.key}` as const)}
          </a>
        ))}
      </Links>

      <Contacts>
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        <a href={SITE.telegram.url}>Telegram {SITE.telegram.handle}</a>
        <a href={SITE.phone.href}>{SITE.phone.display}</a>
      </Contacts>

      <Controls>
        <LanguageSwitcher variant="filled" onSelect={onClose} />
        <ThemeToggle />
      </Controls>
    </Panel>
  )
}
