import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const Button = styled.button`
  display: none;
  @media (max-width: 900px) {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    position: fixed;
    right: 18px;
    bottom: max(18px, env(safe-area-inset-bottom));
    z-index: 90;
    min-height: 48px;
    padding: 12px 18px;
    border: 1px solid ${({ theme }) => theme.colors.line};
    border-radius: ${({ theme }) => theme.radii.pill};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    box-shadow: ${({ theme }) => theme.shadows.m};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
`

export function BackToTop() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 400)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  if (!visible) return null
  return <Button type="button" onClick={() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })
    const heading = document.querySelector<HTMLElement>('main h1')
    heading?.setAttribute('tabindex', '-1')
    heading?.focus({ preventScroll: true })
  }}>{t('actions.backToTop')}</Button>
}
