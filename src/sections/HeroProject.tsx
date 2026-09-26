import styled, { keyframes } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../config/site'

const arrive = keyframes`
  from { opacity: 0; transform: translateY(22px); }
  to { opacity: 1; transform: translateY(0); }
`
const Project = styled.a`
  display: block;
  position: relative;
  min-width: 0;
  margin: 0;
  text-decoration: none;
  animation: ${arrive} .8s ease both;
  &:focus-visible { outline: 3px solid ${({ theme }) => theme.colors.accent}; outline-offset: 10px; }
  @media (max-width: 760px) { margin: 12px 0 0; }
  @media (prefers-reduced-motion: reduce) { animation: none; transform: none; }
`
const Image = styled.div`
  overflow: hidden;
  aspect-ratio: 1.44;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.m};
  img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; transition: transform .6s ease; }
  ${Project}:hover & img { transform: scale(1.025); }
  @media (max-width: 760px) { border-radius: 18px; box-shadow: ${({ theme }) => theme.shadows.s}; }
  @media (prefers-reduced-motion: reduce) { img { transition: none; } }
`
const Caption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 22px;
  strong { display: block; color: ${({ theme }) => theme.colors.text}; font-size: 19px; font-weight: 550; }
  p { color: ${({ theme }) => theme.colors.textDim}; font-size: 14px; line-height: 1.5; margin-top: 5px; }
  > span { display: grid; place-items: center; width: 46px; height: 46px; flex: none; border: 1px solid ${({ theme }) => theme.colors.line}; border-radius: 50%; font-size: 22px; color: ${({ theme }) => theme.colors.accent}; }
  ${Project}:hover & > span { background: ${({ theme }) => theme.colors.accent}; color: #fff; }
  @media (max-width: 760px) { margin-top: 25px; strong { font-size: 17px; } p { font-size: 13px; } }
  @media (prefers-reduced-motion: reduce) { transform: none; }
`

export function HeroProject() {
  const { t } = useTranslation()
  return <Project href={ROUTES.caseMarianaleus} aria-label={t('hero.projectLink')}>
    <Image><img src="/media/marianaleus-desktop.jpg" width="1440" height="1000" alt={t('hero.projectAlt')} fetchPriority="high" /></Image>
    <Caption>
      <div><strong>Mariana Leus</strong><p>{t('hero.projectNote')}</p></div>
      <span aria-hidden="true">↗</span>
    </Caption>
  </Project>
}
