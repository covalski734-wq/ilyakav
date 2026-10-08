import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../config/site'
import { caseImage, WEB_CASES, type WebCaseId } from '../config/cases'

const Grid = styled.div<{ $related: boolean }>`
  display: grid;
  grid-template-columns: repeat(${({ $related }) => $related ? 2 : 3}, minmax(0, 1fr));
  gap: clamp(16px, 2.4vw, 28px);
  @media (max-width: 1000px) { grid-template-columns: 1fr; }
`
const Item = styled.a`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 12px;
  text-decoration: none;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.s};
  transition: transform .25s ease, border-color .25s ease;
  &:hover { transform: translateY(-4px); border-color: ${({ theme }) => theme.colors.accent}; }
  img { width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: cover; border-radius: ${({ theme }) => theme.radii.lg}; display: block; }
  @media (prefers-reduced-motion: reduce) { transition: none; &:hover { transform: none; } }
`
const Body = styled.div`
  padding: 24px 12px 12px;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  h3 { font-size: clamp(25px, 2.3vw, 34px); line-height: 1.08; letter-spacing: -.035em; }
  p { color: ${({ theme }) => theme.colors.textDim}; }
`
const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  span { font-size: 12px; line-height: 1.5; padding: 6px 10px; border-radius: ${({ theme }) => theme.radii.md}; background: ${({ theme }) => theme.colors.surface2}; }
`
const Read = styled.span`
  padding-top: 12px;
  margin-top: auto;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
`

export function CaseCards({ exclude }: { exclude?: WebCaseId }) {
  const { t } = useTranslation()
  return <Grid $related={!!exclude}>
    {(['mariana', 'skyline', 'maryna'] as const).filter(id => id !== exclude).map(id => {
      if (id === 'mariana') return <Item href={ROUTES.caseMarianaleus} key={id}>
        <img src="/media/marianaleus-desktop.jpg" alt={t('caseMariana.preview.desktopAlt')} width={1440} height={1000} loading="lazy" decoding="async" />
        <Body><h3>{t('caseMariana.hero.title')}</h3><Tags><span>{t('caseMariana.facts.scopeValue')}</span></Tags><p>{t('caseMariana.hero.lead')}</p><Read>{t('webCases.read')}<span aria-hidden="true">↗</span></Read></Body>
      </Item>
      const project = t(`webCases.projects.${id}`, { returnObjects: true })
      return <Item href={WEB_CASES[id].path} key={id}>
        <img src={caseImage(id, 'desktop')} alt={project.captions.desktop} width={1440} height={960} loading="lazy" decoding="async" />
        <Body>
          <h3>{project.title}</h3>
          <Tags><span>{project.scope}</span><span>{project.technology}</span></Tags>
          <p>{project.summary}</p>
          <Read>{t('webCases.read')}<span aria-hidden="true">↗</span></Read>
        </Body>
      </Item>
    })}
  </Grid>
}
