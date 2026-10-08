import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Container, Eyebrow, PrimaryButton, Section, SectionTitle } from '../components/ui/primitives'
import { CaseCards } from '../components/CaseCards'
import { caseImage, WEB_CASES, type WebCaseId } from '../config/cases'
import { ROUTES } from '../config/site'

const Hero = styled(Section)`
  margin-top: calc(-92px - env(safe-area-inset-top));
  padding-top: calc(clamp(150px, 15vw, 215px) + env(safe-area-inset-top));
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};
  ${Eyebrow} { color: ${({ theme }) => theme.colors.onDeepDim}; }
  @media (max-width: 760px), (max-height: 600px) and (max-width: 1020px) {
    margin-top: calc(-78px - env(safe-area-inset-top));
  }
`
const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, .85fr);
  align-items: end;
  gap: clamp(28px, 5vw, 80px);
  margin: 32px 0 50px;
  h1 { font-size: clamp(48px, 7.4vw, 108px); font-weight: 650; letter-spacing: -.065em; line-height: .98; overflow-wrap: anywhere; }
  p { font-size: clamp(18px, 1.65vw, 23px); color: ${({ theme }) => theme.colors.onDeepDim}; }
  @media (max-width: 850px) { grid-template-columns: 1fr; }
`
const Actions = styled.div`
  display: flex;
  gap: 18px 26px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 28px;
  > a { text-underline-offset: 5px; }
`
const Facts = styled.dl`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin: 0;
  border-top: 1px solid rgba(247,249,252,.2);
  padding-top: 26px;
  dt { color: ${({ theme }) => theme.colors.onDeepDim}; font-family: ${({ theme }) => theme.fonts.mono}; font-size: 12px; margin-bottom: 8px; }
  dd { margin: 0; font-size: 17px; line-height: 1.4; }
  @media (max-width: 760px) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 18px; }
`
const LeadSection = styled(Section)`
  padding-top: clamp(26px, 4vw, 56px);
  padding-bottom: 0;
`
const Figure = styled.figure`
  margin: 0;
  min-width: 0;
  a { display: block; border-radius: ${({ theme }) => theme.radii.lg}; }
  img { display: block; width: 100%; height: auto; border-radius: ${({ theme }) => theme.radii.lg}; border: 1px solid ${({ theme }) => theme.colors.line}; }
  figcaption { font-size: 14px; line-height: 1.55; color: ${({ theme }) => theme.colors.textDim}; margin-top: 14px; max-width: 80ch; }
`
const Copy = styled.div`
  min-width: 0;
  h2 { margin-bottom: 24px; }
  > p { max-width: 65ch; font-size: clamp(17px, 1.5vw, 20px); color: ${({ theme }) => theme.colors.textDim}; line-height: 1.75; }
`
const Split = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(28px, 6vw, 90px);
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`
const Note = styled.p`
  padding: 22px 26px;
  margin-top: 30px;
  border-left: 3px solid ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: 0 ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0;
  color: ${({ theme }) => theme.colors.textDim};
  line-height: 1.7;
`
const Journey = styled.ol`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  padding: 0;
  margin: 32px 0 0;
  list-style: none;
  li { border-top: 1px solid ${({ theme }) => theme.colors.line}; padding-top: 20px; font-size: 18px; overflow-wrap: anywhere; }
  span { display: block; font-family: ${({ theme }) => theme.fonts.mono}; font-size: 12px; color: ${({ theme }) => theme.colors.accent}; margin-bottom: 12px; }
  @media (max-width: 700px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 360px) { grid-template-columns: 1fr; }
`
const Solutions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(20px, 3vw, 46px);
  margin-top: 36px;
  article { padding-top: 22px; border-top: 1px solid ${({ theme }) => theme.colors.line}; }
  h3 { font-size: clamp(23px, 2.1vw, 30px); line-height: 1.15; letter-spacing: -.025em; margin: 14px 0 18px; }
  p { color: ${({ theme }) => theme.colors.textDim}; line-height: 1.75; }
  @media (max-width: 950px) { grid-template-columns: 1fr; }
`
const Tinted = styled(Section)`background: ${({ theme }) => theme.colors.surface2};`
const Gallery = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(22px, 3vw, 42px);
  align-items: start;
  margin-top: 40px;
  > :last-child { margin-top: 70px; }
  @media (max-width: 800px) { grid-template-columns: 1fr; > :last-child { margin-top: 0; } }
`
const MobileGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: clamp(32px, 6vw, 100px);
  align-items: center;
  @media (max-width: 950px) { grid-template-columns: 1fr; }
`
const Phones = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: clamp(14px, 2vw, 28px);
  max-width: 640px;
  width: 100%;
  margin: auto;
  > :last-child { margin-top: 64px; }
  @media (max-width: 460px) { grid-template-columns: 1fr; max-width: 310px; > :last-child { margin-top: 20px; } }
`
const Result = styled.div`
  padding: clamp(28px, 5vw, 70px);
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
`
const Heading = styled(SectionTitle)`margin-bottom: 36px;`
const Cta = styled(Tinted)`
  h2 { max-width: 20ch; }
  p { max-width: 60ch; color: ${({ theme }) => theme.colors.textDim}; font-size: 18px; margin-top: 24px; }
`

export function WebCasePage({ id }: { id: WebCaseId }) {
  const { t } = useTranslation()
  const project = t(`webCases.projects.${id}`, { returnObjects: true })
  const website = WEB_CASES[id]
  const screenshot = (name: keyof typeof project.captions, eager = false) => {
    const mobile = name === 'mobile' || name === 'contact'
    return <Figure>
      <a href={caseImage(id, name)} data-lightbox aria-haspopup="dialog" aria-label={`${t('webCases.imageLink')}: ${project.captions[name]}`}>
        <img src={caseImage(id, name)} alt={`${project.title}. ${project.captions[name]}`} width={mobile ? 390 : 1440} height={mobile ? name === 'contact' ? 1100 : 844 : 960} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      </a>
      <figcaption>{project.captions[name]}</figcaption>
    </Figure>
  }
  const solutions = (start: number, end: number) => <Solutions>
    {project.solutions.slice(start, end).map((solution, index) => <article key={solution.title}>
      <Eyebrow aria-hidden="true">0{start + index + 1}</Eyebrow>
      <h3>{solution.title}</h3><p>{solution.body}</p>
    </article>)}
  </Solutions>

  return <>
    <Hero>
      <Container>
        <Eyebrow>{t('webCases.eyebrow')}</Eyebrow>
        <HeroGrid>
          <h1>{project.title}</h1>
          <div><p>{project.summary}</p><Actions>
            <PrimaryButton href={website.url} target="_blank" rel="noopener noreferrer" aria-label={t('webCases.visitAria', { name: project.title })}>{t('webCases.visit')}</PrimaryButton>
            <a href="/#work">{t('webCases.back')}</a>
          </Actions></div>
        </HeroGrid>
        <Facts>{(['industry', 'location', 'scope', 'technology'] as const).map(key => <div key={key}><dt>{t(`webCases.${key}`)}</dt><dd>{project[key]}</dd></div>)}</Facts>
      </Container>
    </Hero>
    <LeadSection><Container>{screenshot('desktop', true)}<Note>{t('webCases.captureNote')}</Note></Container></LeadSection>
    <Section><Container>
      <Split>
        <Copy><SectionTitle>{t('webCases.context')}</SectionTitle><p>{project.context}</p></Copy>
        <Copy><SectionTitle>{t('webCases.task')}</SectionTitle><p>{project.task}</p></Copy>
      </Split>
      {project.note && <Note>{project.note}</Note>}
    </Container></Section>
    <Tinted><Container>
      <SectionTitle>{t('webCases.journey')}</SectionTitle>
      <Journey>{project.journey.map((step, index) => <li key={step}><span aria-hidden="true">0{index + 1} →</span>{step}</li>)}</Journey>
    </Container></Tinted>
    <Section><Container>
      <SectionTitle>{t('webCases.solutions')}</SectionTitle>
      {solutions(0, 3)}
    </Container></Section>
    <Tinted><Container>
      <Copy><SectionTitle>{t('webCases.gallery')}</SectionTitle><p>{project.galleryBody}</p></Copy>
      <Gallery>{screenshot('services')}{screenshot('projects')}</Gallery>
    </Container></Tinted>
    <Section><Container>{solutions(3, 6)}</Container></Section>
    <Tinted><Container><MobileGrid>
      <Copy><SectionTitle>{t('webCases.mobile')}</SectionTitle><p>{project.mobileBody}</p></Copy>
      <Phones>{screenshot('mobile')}{screenshot('contact')}</Phones>
    </MobileGrid></Container></Tinted>
    <Section><Container><Result>
      <Copy><SectionTitle>{t('webCases.outcome')}</SectionTitle><p>{project.outcome}</p></Copy>
      <Note>{project.resultNote}</Note>
    </Result></Container></Section>
    <Section><Container>
      <Heading>{t('webCases.related')}</Heading>
      <CaseCards exclude={id} />
      <Actions><a href={ROUTES.caseMarianaleus}>marianaleus.com ↗</a><a href="/#work">{t('webCases.back')}</a></Actions>
    </Container></Section>
    <Cta><Container>
      <SectionTitle>{t('webCases.ctaTitle')}</SectionTitle>
      <p>{t('webCases.ctaBody')}</p>
      <Actions><PrimaryButton href={ROUTES.contact}>{t('webCases.cta')}</PrimaryButton></Actions>
    </Container></Cta>
  </>
}
