import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { ROUTES, SECTION_IDS } from '../config/site'
import { Container, Section } from '../components/ui/primitives'
import { useReveal } from '../hooks/useReveal'

const Panel = styled.div`
  display: grid;
  grid-template-columns: .85fr 1.15fr;
  gap: clamp(28px, 6vw, 88px);
  padding: clamp(28px, 5vw, 72px);
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.line};
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`
const Intro = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  h2 { font-size: clamp(32px, 4vw, 56px); font-weight: 600; line-height: 1.08; letter-spacing: -.04em; max-width: 13ch; }
  strong { display: block; font-size: 19px; font-weight: 600; }
  p { color: ${({ theme }) => theme.colors.textDim}; margin-top: 5px; font-size: 14px; }
`
const Copy = styled.div`
  p { font-size: clamp(16px, 1.45vw, 19px); line-height: 1.7; color: ${({ theme }) => theme.colors.textDim}; }
  p + p { margin-top: 18px; }
  a { display: inline-flex; align-items: center; gap: 18px; margin-top: 26px; min-height: 44px; font-weight: 600; color: ${({ theme }) => theme.colors.text}; text-decoration: underline; text-underline-offset: 6px; }
  a:hover { color: ${({ theme }) => theme.colors.accent}; }
`

export function About() {
  const { t } = useTranslation()
  const panelRef = useReveal<HTMLDivElement>({ y: 24 })
  return <Section id={SECTION_IDS.about}>
    <Container>
      <Panel ref={panelRef}>
        <Intro>
          <h2>{t('about.title')}</h2>
          <div><strong>Ilya Kavaleuski</strong><p>{t('about.role')}</p></div>
        </Intro>
        <Copy>
          <p>{t('about.p1')}</p><p>{t('about.p2')}</p>
          <a href={ROUTES.about}>{t('about.more')}<span aria-hidden="true">↗</span></a>
        </Copy>
      </Panel>
    </Container>
  </Section>
}
