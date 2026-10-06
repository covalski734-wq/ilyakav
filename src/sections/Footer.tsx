import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { NAV_LINKS, ROUTES, SECTION_IDS, SITE } from '../config/site'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useTheme } from '../theme/ThemeContext'
import { breathe } from '../theme/GlobalStyle'
import { useReveal } from '../hooks/useReveal'

const Wrapper = styled.footer`
  padding: clamp(36px, 5vw, 64px) ${({ theme }) => theme.layout.pagePadding} clamp(30px, 4vw, 48px);

  /* clears the fixed mobile action bar */
  @media (max-width: 760px) {
    padding-bottom: 92px;
  }
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
`

const Top = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: clamp(20px, 4vw, 60px);
  align-items: end;
`

const DirectLabel = styled.p`
  margin-bottom: 12px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.accent};
`

const MailLink = styled.a`
  display: block;
  max-width: 100%;
  overflow-wrap: anywhere;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 650;
  font-size: clamp(26px, 3.6vw, 54px);
  line-height: 1.02;
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Availability = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  justify-self: start;

  p {
    font-size: 15px;
    color: ${({ theme }) => theme.colors.textDim};
  }
`

const Pulse = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.status};
  animation: ${breathe} 2.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: clamp(18px, 3vw, 44px);
  margin-top: clamp(30px, 5vw, 64px);
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: clamp(22px, 3vw, 36px);
  box-shadow: ${({ theme }) => theme.shadows.s};
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;

  a {
    font-size: 15px;
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const ColumnLabel = styled.p`
  margin-bottom: 4px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textDim};
`

const Muted = styled.p`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textDim};
`

const InterfaceColumn = styled(Column)`
  align-items: flex-start;
  gap: 10px;
`

const ThemeButton = styled.button`
  background: ${({ theme }) => theme.colors.surface2};
  border: 0;
  padding: 11px 16px;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-weight: 600;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
`

const TopLink = styled.a`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textDim};
  text-decoration: none;
`

const Legal = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  align-items: baseline;
  margin-top: clamp(20px, 3vw, 32px);

  p,
  a {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textDim};
  }

  a {
    text-decoration: none;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const SITE_LINKS = NAV_LINKS.filter((link) => link.key !== 'contact')

export function Footer() {
  const { t } = useTranslation()
  const { toggleTheme } = useTheme()
  const topRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12 })
  const columnsRef = useReveal<HTMLDivElement>({
    children: true,
    stagger: 0.08,
  })

  return (
    <Wrapper>
      <Inner>
        <Top ref={topRef}>
          <div>
            <DirectLabel>{t('footer.writeDirect')}</DirectLabel>
            <MailLink href={`mailto:${SITE.email}`}>{SITE.email}</MailLink>
          </div>
          <Availability>
            <Pulse />
            <p>{t('footer.replyNote')}</p>
          </Availability>
        </Top>

        <Columns ref={columnsRef}>
          <Column>
            <ColumnLabel>{t('footer.colSite')}</ColumnLabel>
            {SITE_LINKS.map((link) => (
              <a key={link.key} href={link.href}>
                {t(`nav.${link.key}` as const)}
              </a>
            ))}
          </Column>

          <Column>
            <ColumnLabel>{t('footer.colProjects')}</ColumnLabel>
            <a href={ROUTES.caseMarianaleus}>{SITE.flagship}</a>
            <a href={ROUTES.contact}>{t('actions.startProject')}</a>
          </Column>

          <Column>
            <ColumnLabel>{t('footer.colDirect')}</ColumnLabel>
            <a href={SITE.telegram.url}>Telegram {SITE.telegram.handle}</a>
            <Muted>{t('footer.location')}</Muted>
          </Column>

          <InterfaceColumn>
            <ColumnLabel>{t('footer.colInterface')}</ColumnLabel>
            <LanguageSwitcher variant="filled" />
            <ThemeButton type="button" onClick={toggleTheme}>
              {t('actions.switchTheme')}
            </ThemeButton>
            <TopLink href={`#${SECTION_IDS.top}`}>{t('actions.backToTop')}</TopLink>
          </InterfaceColumn>
        </Columns>

        <Legal>
          <p>{t('footer.copyright')}</p>
          <a href={ROUTES.privacy}>{t('footer.privacy')}</a>
          <p>{t('footer.madeBy')}</p>
        </Legal>
      </Inner>
    </Wrapper>
  )
}
