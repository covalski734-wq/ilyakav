import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { NAV_LINKS, SITE } from '../config/site'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

const Panel = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 26px;
  padding: clamp(90px, 20vw, 130px) clamp(20px, 6vw, 36px) clamp(28px, 8vw, 44px);
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

  /* keeps the contact block clear of the fixed action bar */
  @media (max-width: 760px) {
    padding-bottom: calc(clamp(28px, 8vw, 44px) + 78px);
  }
`

const Links = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;

  a {
    font-family: ${({ theme }) => theme.fonts.serif};
    font-size: clamp(34px, 11vw, 50px);
    line-height: 1.05;
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
  }

  a:last-child {
    font-style: italic;
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Contacts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  a {
    font-size: 16px;
    color: ${({ theme }) => theme.colors.textDim};
    text-decoration: none;
  }
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
    </Panel>
  )
}
