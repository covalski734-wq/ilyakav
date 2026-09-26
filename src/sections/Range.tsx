import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { FEATURE_FLAGS, SECTION_IDS } from '../config/site'
import { AutoGrid, Card, Container, Section } from '../components/ui/primitives'
import { useReveal } from '../hooks/useReveal'

const Head = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: clamp(22px, 4vw, 72px);
  align-items: end;
  margin-bottom: clamp(28px, 4vw, 52px);
`

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 650;
  font-size: clamp(32px, 4.8vw, 72px);
  line-height: 1;
  letter-spacing: -0.045em;
  max-width: 18ch;
`

const Lead = styled.p`
  font-size: 17px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textDim};
  max-width: 46ch;
`

const Step = styled(Card)<{ $accent?: boolean }>`
  background: ${({ theme, $accent }) => ($accent ? theme.colors.accent : theme.colors.surface)};
  color: ${({ $accent }) => ($accent ? '#fff' : 'inherit')};
  transition:
    transform 0.4s cubic-bezier(0.2, 0.8, 0.3, 1),
    box-shadow 0.4s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.m};
  }
`

const StepIndex = styled.p<{ $accent?: boolean }>`
  margin-bottom: 30px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  color: ${({ theme, $accent }) => ($accent ? 'rgba(255,255,255,.8)' : theme.colors.accent)};
`

const StepLabel = styled.p`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 600;
  font-size: 26px;
`

const Note = styled.p`
  margin-top: clamp(18px, 2.4vw, 28px);
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textDim};
`

const RANGE_ITEMS = ['landing', 'business', 'custom', 'app', 'platform', 'desktop'] as const

export function Range() {
  const { t } = useTranslation()
  const headRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12 })
  const gridRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.06 })
  const noteRef = useReveal<HTMLParagraphElement>({ y: 16 })

  return (
    <Section id={SECTION_IDS.range}>
      <Container>
        <Head ref={headRef}>
          <Title>{t('range.title')}</Title>
          <Lead>{t('range.lead')}</Lead>
        </Head>

        <AutoGrid ref={gridRef} $min="260px" $cols={3}>
          {RANGE_ITEMS.map((key, index) => {
            const accent = index === RANGE_ITEMS.length - 1
            return (
              <Step key={key} $accent={accent}>
                <StepIndex $accent={accent}>{String(index + 1).padStart(2, '0')}</StepIndex>
                <StepLabel>{t(`range.items.${key}` as const)}</StepLabel>
              </Step>
            )
          })}
        </AutoGrid>

        {FEATURE_FLAGS.personality && <Note ref={noteRef}>{t('range.note')}</Note>}
      </Container>
    </Section>
  )
}
