import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { ROUTES, SECTION_IDS } from '../config/site'
import { AutoGrid, Container, InvertedButton } from '../components/ui/primitives'
import { useReveal } from '../hooks/useReveal'

const Wrapper = styled.section`
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};
  padding: clamp(48px, 7vw, 104px) ${({ theme }) => theme.layout.pagePadding} clamp(56px, 9vw, 124px);
  border-radius: 0 0 ${({ theme }) => theme.radii.xl} ${({ theme }) => theme.radii.xl};
  @media (max-width: 760px) { padding-top: 30px; }
`

const Head = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: clamp(20px, 3vw, 56px);
  align-items: end;
  margin-bottom: clamp(26px, 4vw, 48px);
`

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 650;
  font-size: clamp(34px, 5.4vw, 76px);
  line-height: 1;
  letter-spacing: -0.05em;

  span {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Lead = styled.p`
  font-size: 17px;
  color: ${({ theme }) => theme.colors.onDeepDim};
  max-width: 46ch;
`

const Fact = styled.div`
  background: ${({ theme }) => theme.colors.deep2};
  border: 1px solid rgba(247, 249, 252, 0.08);
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 22px 24px;
`

const FactLabel = styled.p`
  margin-bottom: 8px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.onDeepDim};
`

const FactValue = styled.p`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 600;
  font-size: 22px;
`

const YearFact = styled(Fact)`
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;

  ${FactLabel} {
    color: rgba(255, 255, 255, 0.75);
    margin-bottom: 0;
  }
`

const YearValue = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 600;
  font-size: 34px;
  line-height: 1;
`

const FACTS = ['industry', 'location', 'scope'] as const

export function FlagshipCase() {
  const { t } = useTranslation()
  const headRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12 })
  const factsRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.07 })
  const ctaRef = useReveal<HTMLAnchorElement>({ y: 18 })

  return (
    <Wrapper id={SECTION_IDS.work}>
      <Container>
        <Head ref={headRef}>
          <Title>
            marianaleus<span>.</span>com
          </Title>
          <Lead>{t('flagship.lead')}</Lead>
        </Head>

        <AutoGrid ref={factsRef} $min="340px" $cols={4} $gap="14px">
          {FACTS.map((fact) => (
            <Fact key={fact}>
              <FactLabel>{t(`flagship.${fact}Label` as const)}</FactLabel>
              <FactValue>{t(`flagship.${fact}Value` as const)}</FactValue>
            </Fact>
          ))}
          <YearFact>
            <FactLabel>{t('flagship.yearLabel')}</FactLabel>
            <YearValue>{t('flagship.yearValue')}</YearValue>
          </YearFact>
        </AutoGrid>

        <InvertedButton
          ref={ctaRef}
          href={ROUTES.caseMarianaleus}
          style={{ marginTop: 'clamp(24px, 3.5vw, 42px)' }}
        >
          {t('actions.viewProject')}
        </InvertedButton>
      </Container>
    </Wrapper>
  )
}
