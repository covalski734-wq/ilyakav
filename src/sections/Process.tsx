import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { AutoGrid, Container, SectionTitle } from '../components/ui/primitives'
import { useReveal } from '../hooks/useReveal'

const Wrapper = styled.section`
  padding: clamp(56px, 8vw, 116px) ${({ theme }) => theme.layout.pagePadding};
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
  color: ${({ theme }) => theme.colors.accent};
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

const STEPS = ['discover', 'structure', 'design', 'build', 'launch'] as const

export function Process() {
  const { t } = useTranslation()
  const titleRef = useReveal<HTMLHeadingElement>({ y: 22 })
  const gridRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.09 })

  return (
    <Wrapper>
      <Container>
        <Title ref={titleRef}>{t('process.title')}</Title>

        <AutoGrid ref={gridRef} $min="210px">
          {STEPS.map((key, index) => (
            <Step key={key}>
              <StepIndex>{String(index + 1).padStart(2, '0')}</StepIndex>
              <StepTitle>{t(`process.steps.${key}.title` as const)}</StepTitle>
              <StepDesc>{t(`process.steps.${key}.desc` as const)}</StepDesc>
            </Step>
          ))}
        </AutoGrid>
      </Container>
    </Wrapper>
  )
}
