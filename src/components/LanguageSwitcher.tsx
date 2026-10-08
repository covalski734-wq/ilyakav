import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { LANGUAGES, LANGUAGE_LABELS } from '../i18n'
import type { Language } from '../i18n'

const Row = styled.div<{ $variant: 'bare' | 'filled' }>`
  display: flex;
  align-items: center;
  gap: ${({ $variant }) => ($variant === 'bare' ? '1px' : '6px')};
  flex: none;

  /* with the nav hidden and the head CTA gone, the switcher takes the right edge */
  @media (max-width: 760px) {
    margin-left: ${({ $variant }) => ($variant === 'bare' ? 'auto' : '0')};
  }
`

const LangButton = styled.button<{ $active: boolean; $variant: 'bare' | 'filled' }>`
  background: ${({ theme, $variant }) => ($variant === 'bare' ? 'none' : theme.colors.surface2)};
  border: 0;
  padding: ${({ $variant }) => ($variant === 'bare' ? '8px 9px' : '9px 13px')};
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.text};
  opacity: ${({ $active, $variant }) => ($variant === 'bare' && !$active ? 0.7 : 1)};
  transition:
    background 0.25s ease,
    opacity 0.25s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`

type Props = {
  variant?: 'bare' | 'filled'
  onSelect?: () => void
}

export function LanguageSwitcher({ variant = 'bare', onSelect }: Props) {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage as Language

  const select = (lang: Language) => {
    void i18n.changeLanguage(lang)
    onSelect?.()
  }

  return (
    <Row $variant={variant} data-lang>
      {LANGUAGES.map((lang) => (
        <LangButton
          key={lang}
          type="button"
          $variant={variant}
          $active={current === lang}
          aria-pressed={current === lang}
          onClick={() => select(lang)}
        >
          {LANGUAGE_LABELS[lang]}
        </LangButton>
      ))}
    </Row>
  )
}
