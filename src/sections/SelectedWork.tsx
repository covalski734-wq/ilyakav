import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Container, Eyebrow, Section, SectionTitle } from '../components/ui/primitives'
import { CaseCards } from '../components/CaseCards'

const Head = styled.div`
  display: grid;
  gap: 22px;
  margin-bottom: clamp(30px, 4vw, 56px);
  h2 { max-width: 20ch; }
  > p:last-child { max-width: 62ch; color: ${({ theme }) => theme.colors.textDim}; font-size: 18px; }
`

export function SelectedWork() {
  const { t } = useTranslation()
  return <Section id="selected-work" aria-labelledby="selected-work-title">
    <Container>
      <Head>
        <Eyebrow>{t('selectedWork.title')}</Eyebrow>
        <SectionTitle id="selected-work-title">{t('webCases.portfolio')}</SectionTitle>
        <p>{t('webCases.portfolioLead')}</p>
      </Head>
      <CaseCards />
    </Container>
  </Section>
}
