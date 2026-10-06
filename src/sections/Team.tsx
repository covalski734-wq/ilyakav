import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Container, Section, SectionTitle } from '../components/ui/primitives'
import { ROUTES, SITE } from '../config/site'

const Wrapper = styled(Section)`
  padding-top: clamp(48px, 6vw, 88px);
  padding-bottom: clamp(36px, 4vw, 56px);
`
const Grid = styled.div`
  display: grid; grid-template-columns: 1.2fr 1fr; gap: clamp(28px, 6vw, 80px); align-items: start;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`
const Copy = styled.div`
  h2 { margin-bottom: 24px; }
  p { margin-top: 16px; font-size: 18px; color: ${({ theme }) => theme.colors.textDim}; line-height: 1.7; max-width: 60ch; }
  a { display: inline-block; margin-top: 22px; padding: 10px 0; text-underline-offset: 5px; }
`
const Partner = styled.aside`
  padding: clamp(24px, 4vw, 44px); border: 1px solid ${({ theme }) => theme.colors.line}; border-radius: ${({ theme }) => theme.radii.xl}; background: ${({ theme }) => theme.colors.surface};
  h3 { font-size: clamp(25px, 3vw, 36px); line-height: 1.15; letter-spacing: -.035em; }
  p { margin-top: 20px; color: ${({ theme }) => theme.colors.textDim}; }
  a { display: inline-block; margin-top: 18px; padding: 10px 0; text-underline-offset: 5px; }
`
export function Team() {
  const { t } = useTranslation()
  return <Wrapper id="about"><Container><Grid>
    <Copy><SectionTitle>{t('offering.team.title')}</SectionTitle><p>{t('offering.team.body')}</p><p>{t('offering.team.support')}</p><a href={ROUTES.about}>{t('about.more')} ↗</a></Copy>
    <Partner><h3>{t('offering.team.partnerTitle')}</h3><p>{t('offering.team.partnerBody')}</p><a href={SITE.advertisingPartner.url} target="_blank" rel="noopener noreferrer">{t('team.partner.link')} ↗</a></Partner>
  </Grid></Container></Wrapper>
}
