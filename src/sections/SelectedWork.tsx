import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { FEATURE_FLAGS } from '../config/site'
import { Container, Section, SectionTitle } from '../components/ui/primitives'
import { grayscaleMedia } from '../theme/GlobalStyle'
import { useReveal } from '../hooks/useReveal'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: clamp(16px, 2.4vw, 28px);
`

const Title = styled(SectionTitle)`
  margin-bottom: clamp(26px, 4vw, 48px);
  line-height: 1.02;
`

const Item = styled.article`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 14px;
  box-shadow: ${({ theme }) => theme.shadows.s};
  transition:
    transform 0.45s cubic-bezier(0.2, 0.8, 0.3, 1),
    box-shadow 0.45s ease;

  &:hover {
    transform: translateY(-6px);
    box-shadow: ${({ theme }) => theme.shadows.m};
  }
`

/** Alternating gradient stands in until a real screenshot is dropped in. */
const Shot = styled.div<{ $flip: boolean }>`
  ${grayscaleMedia};
  aspect-ratio: 16 / 11;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme, $flip }) =>
    $flip
      ? `linear-gradient(150deg, ${theme.colors.accentSoft}, ${theme.colors.surface2})`
      : `linear-gradient(150deg, ${theme.colors.surface2}, ${theme.colors.accentSoft})`};
  display: flex;
  align-items: flex-end;
  padding: 16px;

  span {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textDim};
  }
`

const Body = styled.div`
  padding: 20px 12px 12px;
`

const ItemTitle = styled.h3`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 600;
  font-size: 28px;
  line-height: 1.12;
  letter-spacing: -0.025em;
  margin-bottom: 6px;
`

const Meta = styled.p`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textDim};
`

const ConceptsGrid = styled(Grid)`
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  margin-top: clamp(16px, 2.4vw, 28px);
`

const ConceptCard = styled.div`
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface2};
  padding: clamp(22px, 3vw, 34px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  min-height: 200px;
`

const ConceptPlaceholder = styled(ConceptCard)`
  justify-content: flex-end;
`

const ConceptTitle = styled.p`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 600;
  font-size: 26px;
`

const ConceptNote = styled.p`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textDim};
  max-width: 38ch;
`

const WORK_ITEMS = ['ceilings', 'cleaning', 'renovation', 'onePagers'] as const

export function SelectedWork() {
  const { t } = useTranslation()
  const titleRef = useReveal<HTMLHeadingElement>({ y: 22 })
  const gridRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.1 })
  const conceptsRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.1 })

  return (
    <Section>
      <Container>
        <Title ref={titleRef}>{t('selectedWork.title')}</Title>

        <Grid ref={gridRef}>
          {WORK_ITEMS.map((key, index) => (
            <Item key={key}>
              <Shot $flip={index % 2 === 1}>
                <span>{t(`selectedWork.items.${key}.shot` as const)}</span>
              </Shot>
              <Body>
                <ItemTitle>{t(`selectedWork.items.${key}.title` as const)}</ItemTitle>
                <Meta>{t(`selectedWork.items.${key}.meta` as const)}</Meta>
              </Body>
            </Item>
          ))}
        </Grid>

        {FEATURE_FLAGS.showConcepts && (
          <ConceptsGrid ref={conceptsRef}>
            <ConceptCard>
              <ConceptTitle>{t('selectedWork.conceptsTitle')}</ConceptTitle>
              <ConceptNote>{t('selectedWork.conceptsNote')}</ConceptNote>
            </ConceptCard>
            <ConceptPlaceholder>
              <ConceptNote>{t('selectedWork.conceptsSoon')}</ConceptNote>
            </ConceptPlaceholder>
          </ConceptsGrid>
        )}
      </Container>
    </Section>
  )
}
