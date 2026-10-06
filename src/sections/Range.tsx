import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Container, Section, SectionTitle } from '../components/ui/primitives'
import { servicePath } from '../config/services'

const Lead = styled.p`
  max-width: 65ch; margin: 22px 0 30px; font-size: 18px; color: ${({ theme }) => theme.colors.textDim};
`
const Grid = styled.div`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`
const Item = styled.a`
  display: block; padding-top: 22px; border-top: 1px solid ${({ theme }) => theme.colors.line}; text-decoration: none;
  h3 { font-size: 25px; line-height: 1.2; letter-spacing: -.025em; }
  p { margin: 14px 0; color: ${({ theme }) => theme.colors.textDim}; }
  span { font-size: 13px; display: inline-block; padding: 8px 0; text-decoration: underline; text-underline-offset: 5px; }
  &:hover h3 { color: ${({ theme }) => theme.colors.accent}; }
`
const SOLUTIONS = ['site','booking','app'] as const
export function Range() {
  const { t } = useTranslation()
  const goals = t('offering.goals', { returnObjects: true })
  return <Section id="range"><Container>
    <SectionTitle>{t('range.title')}</SectionTitle><Lead>{t('range.lead')}</Lead>
    <Grid>{goals.map((goal,index) => <Item href={servicePath(SOLUTIONS[index])} key={goal.title}><h3>{goal.title}</h3><p>{goal.body}</p><span>{t('offering.learn')} ↗</span></Item>)}</Grid>
  </Container></Section>
}
