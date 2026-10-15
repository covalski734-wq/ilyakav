import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Container, Eyebrow, PrimaryButton, Section, SectionTitle } from '../components/ui/primitives'
import { CaseCards } from '../components/CaseCards'
import { ROUTES } from '../config/site'

const Intro = styled(Section)`
  padding-top: clamp(56px, 7vw, 100px);
  h1 { font-size: clamp(48px, 8vw, 108px); line-height: 1; letter-spacing: -.055em; margin: 20px 0; }
  p { max-width: 65ch; color: ${({ theme }) => theme.colors.textDim}; font-size: 19px; }
`
const Actions = styled.div`
  display: flex; flex-wrap: wrap; gap: 20px; align-items: center; margin-top: 24px;
`
const Picture = styled.img`
  display: block; width: 100%; height: auto; border-radius: ${({ theme }) => theme.radii.xl}; border: 1px solid ${({ theme }) => theme.colors.line};
`
const Split = styled(Container)`
  display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px, 5vw, 64px); align-items: start;
  p { margin-top: 20px; color: ${({ theme }) => theme.colors.textDim}; font-size: 18px; }
  @media(max-width: 760px) { grid-template-columns: 1fr; }
`
const Phone = styled(Picture)`max-width: 390px; margin: 0 auto;`
const Note = styled.p`margin-top: 16px; color: ${({ theme }) => theme.colors.textDim}; font-size: 14px;`
export function SilentCleanCasePage() {
  const { t } = useTranslation()
  return <>
    <Intro id="top"><Container>
      <Eyebrow>{t('webCases.silent.scope')} · WordPress</Eyebrow><h1>Silent Clean</h1>
      <p>{t('webCases.silent.summary')}</p>
      <Actions><PrimaryButton href="https://silentclean.ca/" target="_blank" rel="noopener noreferrer" aria-label={t('webCases.visitAria', { name: 'Silent Clean' })}>{t('webCases.visit')}</PrimaryButton><a href="/#work">{t('webCases.back')}</a></Actions>
    </Container></Intro>
    <Section><Container><Picture src="/media/cases/silent/desktop.webp" alt={t('webCases.silent.desktopAlt')} width={1440} height={960} /><Note>{t('webCases.silent.captureNote')}</Note></Container></Section>
    <Section><Split><div><SectionTitle>{t('webCases.context')}</SectionTitle><p>{t('webCases.silent.context')}</p></div><div><SectionTitle>{t('webCases.scope')}</SectionTitle><p>{t('webCases.silent.work')}</p></div></Split></Section>
    <Section><Split><div><SectionTitle>{t('webCases.mobile')}</SectionTitle><Actions><PrimaryButton href={ROUTES.contact}>{t('webCases.cta')}</PrimaryButton></Actions></div><Phone src="/media/cases/silent/mobile.webp" alt={t('webCases.silent.mobileAlt')} width={390} height={844} loading="lazy" decoding="async" /></Split></Section>
    <Section><Container><SectionTitle>{t('webCases.related')}</SectionTitle><Actions /><CaseCards compact /></Container></Section>
  </>
}
