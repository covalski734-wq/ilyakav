import { useEffect, useRef } from 'react'
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
    /* Snaps visible on the opening frame so the panel is focusable right away,
       and is held back until the fade finishes when closing. A single
       visibility 0.35s left it hidden on frame one and focus() silently
       failed. */
    visibility 0s ${({ $open }) => ($open ? '0s' : '0.35s')};

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
    min-height: 44px;
    display: flex;
    align-items: center;
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
    min-height: 44px;
    display: flex;
    align-items: center;
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

const FOCUSABLE = 'a[href], button:not([disabled])'

type Props = {
  pathname: string
  open: boolean
  onClose: () => void
}

export function MobileMenu({ pathname, open, onClose }: Props) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  useLockBodyScroll(open)

  // Escape closes, Tab cycles inside the panel, and focus lands on the first
  // link so the menu is reachable without a pointer.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    panel.toggleAttribute('inert', !open)
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const closeButton = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')

    // one frame later, otherwise the browser re-focuses the burger it just
    // finished clicking and focus never reaches the panel
    const frame = requestAnimationFrame(() => {
      panel.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true })
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      // The visible header close button is part of the keyboard loop too.
      if (closeButton?.getClientRects().length) items.push(closeButton)
      if (!items.length) return

      const current = items.indexOf(document.activeElement as HTMLElement)
      const next = current < 0
        ? (event.shiftKey ? items.length - 1 : 0)
        : (current + (event.shiftKey ? -1 : 1) + items.length) % items.length

      event.preventDefault()
      items[next].focus()
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true })
    }
  }, [open, onClose])

  // Everything behind the panel is taken out of the tab order and the
  // accessibility tree while it is open.
  useEffect(() => {
    if (!open) return

    const behind = Array.from(
      document.querySelectorAll<HTMLElement>('main:not([inert]), footer:not([inert]), [data-bottom-bar]:not([inert])'),
    )
    behind.forEach((node) => node.setAttribute('inert', ''))

    return () => behind.forEach((node) => node.removeAttribute('inert'))
  }, [open])

  useEffect(() => {
    if (!open) return
    const desktop = window.matchMedia('(min-width: 1181px)')
    const closeOnDesktop = () => {
      if (desktop.matches) onClose()
    }
    closeOnDesktop()
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [open, onClose])

  return (
    <Panel
      ref={panelRef}
      id="mobile-menu"
      $open={open}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-label={t('actions.menuAria')}
    >
      <Links>
        {NAV_LINKS.map((link) => (
          <a key={link.key} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>
            {t(`nav.${link.key}` as const)}
          </a>
        ))}
      </Links>

      <Contacts>
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        <a href={SITE.telegram.url}>Telegram {SITE.telegram.handle}</a>
      </Contacts>

      {/* these controls stay put: only navigation and the backdrop close the menu */}
      <Controls onClick={(event) => event.stopPropagation()}>
        <LanguageSwitcher variant="filled" onSelect={onClose} />
        <ThemeToggle />
      </Controls>
    </Panel>
  )
}
