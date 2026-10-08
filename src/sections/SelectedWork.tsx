import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Container, Eyebrow, Section, SectionTitle } from '../components/ui/primitives'
import { CaseCards } from '../components/CaseCards'

const Wrapper = styled(Section)`
  padding-block: clamp(48px, 5vw, 76px);
`

const Head = styled.div`
  display: grid;
  gap: 22px;
  margin-bottom: clamp(30px, 4vw, 56px);
  h2 { max-width: 20ch; }
  > p:last-child { max-width: 62ch; color: ${({ theme }) => theme.colors.textDim}; font-size: 18px; }
`

const Secondary = styled.aside`
  margin-top: 32px; padding-top: 24px; border-top: 1px solid ${({ theme }) => theme.colors.line};
  p { max-width: 72ch; color: ${({ theme }) => theme.colors.textDim}; }
  a { display: inline-flex; align-items: center; min-height: 44px; margin-top: 8px; font-weight: 600; }
`
export function SelectedWork() {
  const { t } = useTranslation()
  return <Wrapper id="work" aria-labelledby="selected-work-title">
    <Container>
      <Head id="selected-work">
        <Eyebrow>{t('selectedWork.title')}</Eyebrow>
        <SectionTitle id="selected-work-title">{t('webCases.portfolio')}</SectionTitle>
        <p>{t('webCases.portfolioLead')}</p>
      </Head>
      <CaseCards /><Secondary aria-label={t('webCases.secondary')}><p>{t('webCases.secondaryLead')}</p><a href="/case/tile-expert-solutions">Tile Expert Solutions ↗</a></Secondary>
    </Container>
  </Wrapper>
}
