import { useEffect, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { NAV_LINKS, ROUTES } from '../config/site'
import { LANGUAGE_LABELS } from '../i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

const dropIn = keyframes`
  from { transform: translateY(-130%); opacity: 0; }
  60%  { transform: translateY(6%); opacity: 1; }
  to   { transform: translateY(0); opacity: 1; }
`

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  padding: max(12px, env(safe-area-inset-top)) clamp(12px, 3vw, 34px) 12px;

  @media (max-width: 760px), (max-height: 600px) and (max-width: 1020px) {
    padding: max(9px, env(safe-area-inset-top)) 10px 9px;
  }
`

/**
 * At the very top the header belongs to the hero. After the first small scroll
 * it becomes a solid floating pill, so content never has to pass below a
 * transparent navigation bar for the length of the whole hero.
 */
const Pill = styled.div<{ $floating: boolean }>`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 10px 10px 10px 22px;
  display: flex;
  align-items: center;
  gap: clamp(10px, 2vw, 26px);
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid transparent;
  transition:
    background 0.4s ease,
    border-color 0.4s ease,
    box-shadow 0.45s ease;

  ${({ $floating, theme }) =>
    $floating
      ? css`
          background: ${theme.colors.surface};
          border-color: ${theme.colors.line};
          box-shadow: ${theme.shadows.m};
          animation: ${dropIn} 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.3);
        `
      : css`
          background: transparent;
          box-shadow: none;

          /* doubled selector so these win over the nav's own dimmed link colour */
          && a,
          && button {
            color: #f7f9fc;
          }

          && a:hover,
          && button:hover {
            color: #fff;
            background: rgba(247, 249, 252, 0.13);
          }

          /* the accent pill keeps its own colours */
          && [data-head-cta],
          && [data-head-cta]:hover {
            color: #fff;
            background: ${theme.colors.accent};
          }

          && [data-head-cta]:hover {
            background: ${theme.colors.accentInk};
          }

          [data-theme-dot] {
            background: linear-gradient(90deg, #f7f9fc 50%, transparent 50%);
            box-shadow: inset 0 0 0 2px #f7f9fc;
          }

          [data-burger-bar] {
            background: #f7f9fc;
          }
        `}

  @media (max-width: 760px), (max-height: 600px) and (max-width: 1020px) {
    padding: 7px 7px 7px 14px;
    gap: 5px;
    border-radius: 18px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`

const Logo = styled.a`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.04em;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  flex: none;

  span {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Nav = styled.nav`
  display: flex;
  gap: 2px;
  margin: 0 auto;
  align-items: center;

  a {
    white-space: nowrap;
    font-size: 15px;
    text-decoration: none;
    color: ${({ theme }) => theme.colors.textDim};
    padding: 9px 15px;
    border-radius: ${({ theme }) => theme.radii.pill};
    transition:
      background 0.25s ease,
      color 0.25s ease;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface2};
  }

  @media (max-width: 1020px) {
    display: none;
  }
`

const HeadCta = styled.a`
  flex: none;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 12px 22px;
  transition:
    background 0.3s ease,
    transform 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentInk};
    transform: translateY(-1px);
  }

  @media (max-width: 760px), (max-height: 600px) and (max-width: 1020px) {
    display: none;
  }
`

const Burger = styled.button`
  display: none;
  flex: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  padding: 0;
  background: none;
  border: 0;
  border-radius: 50%;
  cursor: pointer;

  @media (max-width: 1020px) {
    display: flex;
  }
`

const DesktopControls = styled.div`
  display: contents;

  @media (max-width: 760px), (max-height: 600px) and (max-width: 1020px) {
    display: none;
  }
`

const MobileLanguage = styled.button`
  display: none;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  min-width: 44px;
  height: 42px;
  padding: 0 9px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  span {
    font-size: 10px;
    opacity: 0.65;
  }

  @media (max-width: 760px), (max-height: 600px) and (max-width: 1020px) {
    display: flex;
  }
`

const BurgerBar = styled.span<{ $open: boolean; $index: 0 | 1 | 2 }>`
  display: block;
  width: 17px;
  height: 2px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.text};
  transition:
    transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1),
    opacity 0.25s ease;
  opacity: ${({ $open, $index }) => ($open && $index === 1 ? 0 : 1)};
  transform: ${({ $open, $index }) => {
    if (!$open || $index === 1) return 'none'
    return $index === 0 ? 'translateY(7px) rotate(45deg)' : 'translateY(-7px) rotate(-45deg)'
  }};
`

type Props = {
  menuOpen: boolean
  onToggleMenu: () => void
}

export function Header({ menuOpen, onToggleMenu }: Props) {
  const { t, i18n } = useTranslation()
  const [floating, setFloating] = useState(() =>
    typeof window === 'undefined' ? false : Math.max(0, window.scrollY) >= 24,
  )
  const languageCode = (i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2)
  const currentLanguage =
    LANGUAGE_LABELS[languageCode as keyof typeof LANGUAGE_LABELS] ?? languageCode.toUpperCase()

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const scrollTop = Math.max(window.scrollY, document.documentElement.scrollTop)

      // A little hysteresis prevents the pill from flickering around the
      // threshold on touch devices with elastic scrolling.
      setFloating((current) => (current ? scrollTop > 4 : scrollTop >= 24))
    }

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [])

  return (
    <Bar>
      <Pill $floating={floating || menuOpen}>
        <Logo href="/#top">
          ilyakav<span>.</span>
        </Logo>

        <Nav>
          {NAV_LINKS.map((link) => (
            <a key={link.key} href={link.href}>
              {t(`nav.${link.key}` as const)}
            </a>
          ))}
        </Nav>

        <DesktopControls>
          <LanguageSwitcher />
          <ThemeToggle />
        </DesktopControls>

        <MobileLanguage
          type="button"
          onClick={onToggleMenu}
          aria-label={`${t('actions.menuAria')}: ${currentLanguage}`}
          aria-expanded={menuOpen}
        >
          {currentLanguage}
          <span aria-hidden="true">⌄</span>
        </MobileLanguage>

        <Burger
          type="button"
          onClick={onToggleMenu}
          aria-label={t('actions.menuAria')}
          aria-expanded={menuOpen}
        >
          {([0, 1, 2] as const).map((index) => (
            <BurgerBar key={index} $open={menuOpen} $index={index} data-burger-bar />
          ))}
        </Burger>

        <HeadCta href={ROUTES.contact} data-head-cta>
          {t('actions.startProject')}
        </HeadCta>
      </Pill>
    </Bar>
  )
}
