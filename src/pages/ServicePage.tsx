import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Container, Eyebrow, PrimaryButton, Section, SectionTitle } from '../components/ui/primitives'
import { SERVICE_IDS, SERVICE_PAGES, servicePath, type ServiceId } from '../config/services'
import { Ownership } from '../sections/Ownership'
import { ROUTES } from '../config/site'

const Hero = styled(Section)`
  margin-top: calc(-92px - env(safe-area-inset-top));
  padding-top: calc(clamp(145px, 14vw, 200px) + env(safe-area-inset-top));
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};
  ${Eyebrow} { color: ${({ theme }) => theme.colors.onDeepDim}; }
  h1 { margin-top: 26px; font-size: clamp(38px, 6.5vw, 88px); line-height: 1.04; font-weight: 650; letter-spacing: -.05em; max-width: 22ch; overflow-wrap: anywhere; }
  p[data-lead] { margin-top: 26px; max-width: 58ch; font-size: clamp(18px, 1.7vw, 23px); color: ${({ theme }) => theme.colors.onDeepDim}; }
  @media (max-width: 760px), (max-height: 600px) and (max-width: 1020px) { margin-top: calc(-78px - env(safe-area-inset-top)); }
`
const Actions = styled.div`
  display: flex; flex-wrap: wrap; gap: 20px 26px; align-items: center; margin-top: 30px;
  a { text-underline-offset: 5px; }
`
const Grid = styled.div`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(28px, 5vw, 70px); align-items: center;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`
const Copy = styled.div`
  h2 { margin-bottom: 22px; }
  p { font-size: clamp(17px, 1.5vw, 20px); color: ${({ theme }) => theme.colors.textDim}; line-height: 1.7; max-width: 65ch; }
  h3 { font-size: 23px; margin: 30px 0 12px; line-height: 1.2; }
`
const Image = styled.img`
  display: block; width: 100%; height: auto; border-radius: ${({ theme }) => theme.radii.xl};
`
const Tint = styled(Section)`background: ${({ theme }) => theme.colors.surface2};`
const List = styled.ol`
  list-style: none; padding: 0; margin: 30px 0 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 40px;
  li { display: flex; gap: 18px; border-top: 1px solid ${({ theme }) => theme.colors.line}; padding-top: 20px; font-size: 18px; }
  span { color: ${({ theme }) => theme.colors.accent}; font-family: ${({ theme }) => theme.fonts.mono}; font-size: 12px; padding-top: 5px; }
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`
const Related = styled.nav`
  display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px;
  a { padding: 12px 18px; border: 1px solid ${({ theme }) => theme.colors.line}; border-radius: ${({ theme }) => theme.radii.md}; text-decoration: none; }
  a:hover { border-color: ${({ theme }) => theme.colors.accent}; }
`
const Terms = styled.p`
  margin-top: 20px; font-family: ${({ theme }) => theme.fonts.mono}; font-size: 13px; color: ${({ theme }) => theme.colors.onDeepDim};
  span { display: block; margin-top: 5px; }
`

export function ServicePage({ id }: { id: ServiceId }) {
  const { t } = useTranslation()
  const page = t(`offering.pages.${id}`, { returnObjects: true })
  const core = id === 'site' || id === 'landing' || id === 'redesign' || id === 'app' || id === 'desktop'
  return <>
    <Hero id="top"><Container>
      <Eyebrow>{t('offering.eyebrow')}</Eyebrow><h1>{page.title}</h1><p data-lead>{page.lead}</p>
      <Actions><PrimaryButton href={`${ROUTES.contact}?type=${SERVICE_PAGES[id].type}#project-form`}>{t('offering.discuss')}</PrimaryButton><a href="/#services">{t('offering.all')}</a></Actions>
      {core ? <Terms>{t(`services.items.${id}.price`)}<span>{t(`services.items.${id}.timing`)}</span><span>{t('offering.priceNote')}</span></Terms> : <Terms>{t('offering.individualEstimate')}</Terms>}
    </Container></Hero>
    <Section><Container><Grid>
      <Copy><SectionTitle>{t('offering.why')}</SectionTitle><p>{page.why}</p><h3>{t('offering.fit')}</h3><p>{page.fit}</p></Copy>
      <Image src={`/media/services/${id}-v1.webp`} srcSet={`/media/services/${id}-v1-600.webp 600w, /media/services/${id}-v1.webp 1200w`} sizes="(max-width: 800px) 100vw, 45vw" alt={t(`services.images.${id}`)} width={1200} height={800} decoding="async" />
    </Grid></Container></Section>
    <Tint><Container><SectionTitle>{t('offering.includes')}</SectionTitle><List>{page.includes.map((item,index) => <li key={item}><span aria-hidden="true">0{index + 1}</span>{item}</li>)}</List></Container></Tint>
    <Section><Container><Grid>
      <Copy><SectionTitle>{t('offering.example')}</SectionTitle><p>{page.example}</p>
      {id === 'redesign' && <Related><a href="/case/maryna-cleaning">Maryna Cleaning ↗</a></Related>}
      {id === 'site' && <Related><a href="/case/skyline-stretch-ceilings">Skyline Stretch Ceilings ↗</a><a href="/case/marianaleus">Mariana Leus ↗</a></Related>}</Copy>
      <Copy><SectionTitle>{t('offering.honest')}</SectionTitle><p>{page.limit}</p></Copy>
    </Grid></Container></Section>
    {['site','landing','redesign'].includes(id) && <Ownership />}
    <Tint><Container><Copy><SectionTitle>{t('offering.next')}</SectionTitle><p>{t('offering.nextBody')}</p></Copy><Actions><PrimaryButton href={`${ROUTES.contact}?type=${SERVICE_PAGES[id].type}#project-form`}>{t('offering.discuss')}</PrimaryButton></Actions></Container></Tint>
    <Section><Container><SectionTitle>{t('offering.related')}</SectionTitle><Related aria-label={t('offering.related')}>{SERVICE_IDS.filter(key => key !== id).map(key => <a key={key} href={servicePath(key)}>{t(`offering.pages.${key}.title`)} ↗</a>)}</Related></Container></Section>
  </>
}
