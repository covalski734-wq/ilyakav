import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Container, Section, SectionTitle } from '../components/ui/primitives'

const Intro = styled.div`
  max-width: 850px;
  margin-bottom: 30px;
  p { margin-top: 22px; font-size: 18px; color: ${({ theme }) => theme.colors.textDim}; }
`
const Choices = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`
const Choice = styled.article`
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  padding: clamp(24px, 3.5vw, 44px);
  h3 { font-size: clamp(25px, 3vw, 38px); line-height: 1.1; letter-spacing: -.035em; }
  p { margin-top: 16px; color: ${({ theme }) => theme.colors.textDim}; }
  ul { margin: 24px 0; padding-left: 20px; }
  li { padding-left: 4px; margin: 12px 0; }
  li::marker { color: ${({ theme }) => theme.colors.accent}; }
  p:last-child { border-top: 1px solid ${({ theme }) => theme.colors.line}; padding-top: 20px; color: ${({ theme }) => theme.colors.text}; }
`
const Note = styled.p`
  max-width: 95ch;
  margin-top: 22px;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 14px;
`
export function Ownership() {
  const { t } = useTranslation()
  return <Section id="ownership"><Container>
    <Intro><SectionTitle>{t('offering.ownership.title')}</SectionTitle><p>{t('offering.ownership.lead')}</p></Intro>
    <Choices>{(['full','managed'] as const).map(key => {
      const choice = t(`offering.ownership.${key}`, { returnObjects: true })
      return <Choice key={key}><h3>{choice.title}</h3><p>{choice.for}</p><ul>{choice.items.map(item => <li key={item}>{item}</li>)}</ul><p>{choice.benefit}</p></Choice>
    })}</Choices>
    <Note>{t('offering.ownership.value')}</Note>
    <Note>{t('offering.ownership.note')}</Note>
  </Container></Section>
}
