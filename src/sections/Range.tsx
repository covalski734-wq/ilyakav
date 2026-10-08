import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Container, Section, SectionTitle } from '../components/ui/primitives'
import { servicePath } from '../config/services'

const Wrapper = styled(Section)`
  padding-block: clamp(48px, 6vw, 88px);
`

const Lead = styled.p`
  max-width: 65ch; margin: 22px 0 30px; font-size: 18px; color: ${({ theme }) => theme.colors.textDim};
`
const Grid = styled.div`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`
const Item = styled.article`
  padding-top: 22px; border-top: 1px solid ${({ theme }) => theme.colors.line};
  h3 { font-size: 25px; line-height: 1.2; letter-spacing: -.025em; }
  p { margin: 14px 0; color: ${({ theme }) => theme.colors.textDim}; }
  a { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; font-weight: 600; text-underline-offset: 5px; }
`
const goalServices = ['site', 'redesign', 'app'] as const
export function Range() {
  const { t } = useTranslation()
  const goals = t('offering.goals', { returnObjects: true })
  return <Wrapper id="range"><Container>
    <SectionTitle>{t('range.title')}</SectionTitle><Lead>{t('range.lead')}</Lead>
    <Grid>{goals.map((goal, index) => <Item key={goal.title}><h3>{goal.title}</h3><p>{goal.body}</p><a href={servicePath(goalServices[index])}>{goal.action}<span aria-hidden="true">↗</span></a></Item>)}</Grid>
  </Container></Wrapper>
}
