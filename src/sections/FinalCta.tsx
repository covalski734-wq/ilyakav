import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { ROUTES, SITE } from '../config/site'
import { drift } from '../theme/GlobalStyle'
import { useReveal } from '../hooks/useReveal'

const Wrapper = styled.section`
  padding: 0 ${({ theme }) => theme.layout.pagePadding} clamp(28px, 4vw, 52px);
`

const Panel = styled.div`
  position: relative;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: clamp(44px, 7vw, 110px) clamp(24px, 5vw, 72px);
  overflow: hidden;
`

const Bloom = styled.div`
  position: absolute;
  width: min(620px, 70%);
  aspect-ratio: 1 / 1;
  right: -8%;
  top: -30%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.24), transparent 68%);
  pointer-events: none;
  /* the same slow drift as the hero glow, so the closing panel is not dead flat */
  animation: ${drift} 34s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.serif};
  font-weight: 400;
  font-size: clamp(36px, 6.4vw, 104px);
  line-height: 0.98;
  letter-spacing: -0.02em;
  max-width: 16ch;
`

const Lead = styled.p`
  margin: clamp(20px, 3vw, 36px) 0 clamp(24px, 4vw, 42px);
  font-size: clamp(16px, 1.4vw, 20px);
  line-height: 1.55;
  max-width: 44ch;
  color: rgba(255, 255, 255, 0.88);
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`

const SolidLink = styled.a`
  background: #fff;
  color: ${({ theme }) => theme.colors.accentInk};
  text-decoration: none;
  font-weight: 600;
  font-size: 17px;
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 19px 32px;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
`

const SoftLink = styled.a`
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 17px;
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 19px 26px;
  background: rgba(255, 255, 255, 0.16);
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.26);
  }
`

export function FinalCta() {
  const { t } = useTranslation()
  const panelRef = useReveal<HTMLDivElement>({ y: 40, duration: 0.9 })
  const copyRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.13, delay: 0.15 })

  return (
    <Wrapper>
      <Panel ref={panelRef}>
        <Bloom />
        <div ref={copyRef} style={{ position: 'relative' }}>
          <Title>{t('finalCta.title')}</Title>
          <Lead>{t('finalCta.lead')}</Lead>
          <Actions>
            <SolidLink href={ROUTES.contact}>{t('actions.startProject')}</SolidLink>
            <SoftLink href={`mailto:${SITE.email}`}>{SITE.email}</SoftLink>
          </Actions>
        </div>
      </Panel>
    </Wrapper>
  )
}
