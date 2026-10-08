import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { AutoGrid, Container, SectionTitle } from '../components/ui/primitives'
import { useReveal } from '../hooks/useReveal'

const Wrapper = styled.section`
  padding: clamp(48px, 5vw, 76px) ${({ theme }) => theme.layout.pagePadding};
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};
  border-radius: ${({ theme }) => theme.radii.xl};
`

const Title = styled(SectionTitle)`
  margin-bottom: clamp(26px, 4vw, 48px);
`

const Step = styled.div`
  background: ${({ theme }) => theme.colors.deep2};
  border: 1px solid rgba(247, 249, 252, 0.08);
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 26px 24px;
`

const StepIndex = styled.p`
  margin-bottom: 26px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  color: #aaa5ff;
`

const StepTitle = styled.h3`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 600;
  font-size: 24px;
  margin-bottom: 8px;
`

const StepDesc = styled.p`
  font-size: 15px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.onDeepDim};
`

/**
 * Five steps have no divisor that auto-fit can find on its own, so the ladder is
 * explicit: one row on desktop, a deliberate 3 + 2 on tablets, a list on phones.
 */
const Steps = styled(AutoGrid)`
  @media (min-width: 760px) and (max-width: 1199px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`

const STEPS = ['discover', 'structure', 'design', 'build', 'launch'] as const

export function Process() {
  const { t } = useTranslation()
  const titleRef = useReveal<HTMLHeadingElement>({ y: 22 })
  const gridRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.09 })

  return (
    <Wrapper>
      <Container>
        <Title ref={titleRef}>{t('process.title')}</Title>

        <Steps ref={gridRef} $min="240px" $cols={5}>
          {STEPS.map((key, index) => (
            <Step key={key}>
              <StepIndex>{String(index + 1).padStart(2, '0')}</StepIndex>
              <StepTitle>{t(`process.steps.${key}.title` as const)}</StepTitle>
              <StepDesc>{t(`process.steps.${key}.desc` as const)}</StepDesc>
            </Step>
          ))}
        </Steps>
      </Container>
    </Wrapper>
  )
}
