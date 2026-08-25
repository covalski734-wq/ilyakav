import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { Container, Eyebrow } from '../components/ui/primitives'
import { SITE } from '../config/site'
import { useReveal } from '../hooks/useReveal'

const PRIVACY_SECTIONS = [
  {
    id: 'scope',
    titleKey: 'privacyPage.sections.scope.title',
    bodyKeys: ['privacyPage.sections.scope.p1', 'privacyPage.sections.scope.p2'],
  },
  {
    id: 'information',
    titleKey: 'privacyPage.sections.information.title',
    bodyKeys: [
      'privacyPage.sections.information.p1',
      'privacyPage.sections.information.p2',
      'privacyPage.sections.information.p3',
    ],
  },
  {
    id: 'use',
    titleKey: 'privacyPage.sections.use.title',
    bodyKeys: ['privacyPage.sections.use.p1', 'privacyPage.sections.use.p2'],
  },
  {
    id: 'sharing',
    titleKey: 'privacyPage.sections.sharing.title',
    bodyKeys: ['privacyPage.sections.sharing.p1', 'privacyPage.sections.sharing.p2'],
  },
  {
    id: 'cookies',
    titleKey: 'privacyPage.sections.cookies.title',
    bodyKeys: ['privacyPage.sections.cookies.p1', 'privacyPage.sections.cookies.p2'],
  },
  {
    id: 'retention',
    titleKey: 'privacyPage.sections.retention.title',
    bodyKeys: ['privacyPage.sections.retention.p1', 'privacyPage.sections.retention.p2'],
  },
  {
    id: 'rights',
    titleKey: 'privacyPage.sections.rights.title',
    bodyKeys: ['privacyPage.sections.rights.p1', 'privacyPage.sections.rights.p2'],
  },
  {
    id: 'security',
    titleKey: 'privacyPage.sections.security.title',
    bodyKeys: ['privacyPage.sections.security.p1', 'privacyPage.sections.security.p2'],
  },
  {
    id: 'international',
    titleKey: 'privacyPage.sections.international.title',
    bodyKeys: ['privacyPage.sections.international.p1', 'privacyPage.sections.international.p2'],
  },
  {
    id: 'changes',
    titleKey: 'privacyPage.sections.changes.title',
    bodyKeys: ['privacyPage.sections.changes.p1', 'privacyPage.sections.changes.p2'],
  },
] as const

type PrivacySectionDefinition = (typeof PRIVACY_SECTIONS)[number]

const Intro = styled.section`
  position: relative;
  min-height: min(700px, 72svh);
  margin-top: calc(-92px - env(safe-area-inset-top));
  padding: calc(154px + env(safe-area-inset-top)) ${({ theme }) => theme.layout.pagePadding}
    clamp(62px, 9vw, 112px);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  isolation: isolate;
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};

  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    width: min(880px, 84vw);
    aspect-ratio: 1;
    top: -62%;
    right: -14%;
    border-radius: 50%;
    background: radial-gradient(circle, ${({ theme }) => theme.colors.accent} 0%, transparent 68%);
    opacity: 0.28;
    filter: blur(24px);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    opacity: 0.09;
    background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.14) 1px, transparent 1px);
    background-size: clamp(54px, 6vw, 92px) 100%;
    mask-image: linear-gradient(110deg, #000, transparent 78%);
    -webkit-mask-image: linear-gradient(110deg, #000, transparent 78%);
    pointer-events: none;
  }

  @media (max-width: 760px) {
    min-height: min(540px, 64svh);
    margin-top: calc(-78px - env(safe-area-inset-top));
    padding: calc(112px + env(safe-area-inset-top)) clamp(18px, 5vw, 24px) 46px;

    &::before {
      width: 130vw;
      top: -34%;
      right: -64%;
    }

    &::after {
      background-size: 48px 100%;
    }
  }

  @media (max-height: 600px) and (max-width: 1020px) {
    min-height: 100svh;
    margin-top: calc(-78px - env(safe-area-inset-top));
    padding: calc(92px + env(safe-area-inset-top)) clamp(18px, 4vw, 34px) 30px;

    &::before {
      width: 104vw;
      top: -92%;
      right: -34%;
    }
  }
`

const IntroInner = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const IntroEyebrow = styled(Eyebrow)`
  margin-bottom: clamp(20px, 3vw, 34px);
  color: ${({ theme }) => theme.colors.onDeepDim};
`

const IntroTitle = styled.h1`
  max-width: 11ch;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 700;
  font-size: clamp(52px, 8.6vw, 126px);
  line-height: 0.9;
  letter-spacing: -0.06em;

  @media (max-width: 760px) {
    max-width: 100%;
    font-size: clamp(32px, 9.4vw, 40px);
    line-height: 0.94;
    letter-spacing: -0.045em;
  }

  @media (max-height: 600px) and (max-width: 1020px) {
    max-width: 15ch;
    font-size: clamp(40px, 6.4vw, 56px);
    line-height: 0.92;
    letter-spacing: -0.05em;
  }
`

const IntroBottom = styled.div`
  width: 100%;
  margin-top: clamp(30px, 5vw, 58px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px 48px;
  align-items: end;

  @media (max-width: 700px) {
    grid-template-columns: minmax(0, 1fr);
  }

  @media (max-height: 600px) and (max-width: 1020px) {
    margin-top: 22px;
    gap: 16px 32px;
  }
`

const IntroLead = styled.p`
  max-width: 58ch;
  font-size: clamp(16px, 1.45vw, 20px);
  line-height: 1.58;
  color: ${({ theme }) => theme.colors.onDeepDim};
`

const Updated = styled.dl`
  padding: 11px 14px;
  border: 1px solid rgba(247, 249, 252, 0.13);
  border-radius: ${({ theme }) => theme.radii.md};
  display: grid;
  grid-template-columns: auto auto;
  gap: 6px 12px;
  color: ${({ theme }) => theme.colors.onDeepDim};

  dt,
  dd {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 11px;
    line-height: 1.4;
  }

  dd {
    color: ${({ theme }) => theme.colors.onDeep};
  }

  @media (max-width: 420px) {
    width: 100%;
    grid-template-columns: minmax(0, 1fr);
  }
`

const Content = styled.div`
  padding: clamp(52px, 8vw, 112px) ${({ theme }) => theme.layout.pagePadding}
    clamp(80px, 11vw, 150px);
`

const LegalLayout = styled(Container)`
  display: grid;
  grid-template-columns: minmax(220px, 286px) minmax(0, 820px);
  justify-content: space-between;
  gap: clamp(42px, 8vw, 130px);
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    justify-content: stretch;
    gap: 24px;
  }
`

const Sidebar = styled.aside`
  position: sticky;
  top: 116px;

  @media (max-width: 900px) {
    position: static;
  }
`

const Toc = styled.nav`
  padding: 22px;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.s};

  @media (max-width: 900px) {
    display: none;
  }
`

const MobileToc = styled.details`
  display: none;

  @media (max-width: 900px) {
    display: block;
    border: 1px solid ${({ theme }) => theme.colors.line};
    border-radius: ${({ theme }) => theme.radii.lg};
    background: ${({ theme }) => theme.colors.surface};
    box-shadow: ${({ theme }) => theme.shadows.s};
  }
`

const MobileTocSummary = styled.summary`
  min-height: 56px;
  padding: 15px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &::after {
    content: '+';
    flex: none;
    color: ${({ theme }) => theme.colors.accent};
    font-size: 18px;
    line-height: 1;
  }

  ${MobileToc}[open] &::after {
    content: '−';
  }
`

const MobileTocNav = styled.nav`
  padding: 2px 18px 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
`

const TocLabel = styled(Eyebrow)`
  margin-bottom: 15px;
`

const TocList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: privacy-toc;
  display: flex;
  flex-direction: column;
`

const TocLink = styled.a`
  counter-increment: privacy-toc;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 9px;
  padding: 9px 0;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 13px;
  line-height: 1.35;
  text-decoration: none;
  transition: color 0.2s ease;

  &::before {
    content: counter(privacy-toc, decimal-leading-zero);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 10px;
    color: ${({ theme }) => theme.colors.textDim};
    opacity: 0.72;
  }

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Article = styled.article`
  min-width: 0;
`

const ContactCard = styled.section`
  margin-bottom: clamp(44px, 7vw, 78px);
  padding: clamp(24px, 4vw, 42px);
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.s};
`

const ContactEyebrow = styled(Eyebrow)`
  margin-bottom: 14px;
  color: ${({ theme }) => theme.colors.accent};
`

const ContactTitle = styled.h2`
  max-width: 18ch;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(28px, 4vw, 48px);
  font-weight: 650;
  line-height: 1.02;
  letter-spacing: -0.045em;
`

const ContactBody = styled.p`
  max-width: 60ch;
  margin-top: 16px;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 16px;
  line-height: 1.65;
`

const ContactLink = styled.a`
  width: fit-content;
  max-width: 100%;
  margin-top: 24px;
  padding-bottom: 4px;
  border-bottom: 1px solid currentColor;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 13px;
  line-height: 1.4;
  text-decoration: none;
  overflow-wrap: anywhere;
  transition: color 0.2s ease;

  span:first-child {
    color: ${({ theme }) => theme.colors.textDim};
  }

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const SectionBlock = styled.section`
  scroll-margin-top: 124px;
  padding: clamp(38px, 6vw, 66px) 0;
  border-top: 1px solid ${({ theme }) => theme.colors.line};

  &:last-child {
    padding-bottom: 0;
  }
`

const SectionNumber = styled(Eyebrow)`
  margin-bottom: 14px;
  color: ${({ theme }) => theme.colors.accent};
`

const SectionTitle = styled.h2`
  max-width: 22ch;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(28px, 4vw, 48px);
  font-weight: 650;
  line-height: 1.04;
  letter-spacing: -0.04em;
`

const SectionCopy = styled.div`
  max-width: 68ch;
  margin-top: 20px;

  p {
    margin-top: 14px;
    color: ${({ theme }) => theme.colors.textDim};
    font-size: clamp(15px, 1.25vw, 17px);
    line-height: 1.72;
  }

  p:first-child {
    margin-top: 0;
    color: ${({ theme }) => theme.colors.text};
  }
`

function PrivacySection({ section, index }: { section: PrivacySectionDefinition; index: number }) {
  const { t } = useTranslation()
  const sectionRef = useReveal<HTMLElement>({
    children: true,
    stagger: 0.08,
    y: 24,
  })

  return (
    <SectionBlock id={`privacy-${section.id}`} ref={sectionRef}>
      <SectionNumber aria-hidden="true">{String(index + 1).padStart(2, '0')}</SectionNumber>
      <SectionTitle>{t(section.titleKey)}</SectionTitle>
      <SectionCopy>
        {section.bodyKeys.map((bodyKey) => (
          <p key={bodyKey}>{t(bodyKey)}</p>
        ))}
      </SectionCopy>
    </SectionBlock>
  )
}

export function PrivacyPage() {
  const { t } = useTranslation()
  const introRef = useReveal<HTMLDivElement>({
    children: true,
    stagger: 0.12,
    start: 'top 92%',
  })
  const sidebarRef = useReveal<HTMLElement>({ y: 28 })
  const contactRef = useReveal<HTMLElement>({
    children: true,
    stagger: 0.08,
    y: 24,
  })

  return (
    <>
      <Intro id="top">
        <IntroInner ref={introRef}>
          <IntroEyebrow>{t('privacyPage.hero.eyebrow')}</IntroEyebrow>
          <IntroTitle>{t('privacyPage.hero.title')}</IntroTitle>
          <IntroBottom>
            <IntroLead>{t('privacyPage.hero.lead')}</IntroLead>
            <Updated>
              <dt>{t('privacyPage.hero.lastUpdatedLabel')}</dt>
              <dd>
                <time dateTime="2026-08-25">{t('privacyPage.hero.lastUpdatedValue')}</time>
              </dd>
            </Updated>
          </IntroBottom>
        </IntroInner>
      </Intro>

      <Content>
        <LegalLayout>
          <Sidebar ref={sidebarRef}>
            <Toc aria-label={t('privacyPage.toc.label')}>
              <TocLabel>{t('privacyPage.toc.label')}</TocLabel>
              <TocList>
                {PRIVACY_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <TocLink href={`#privacy-${section.id}`}>{t(section.titleKey)}</TocLink>
                  </li>
                ))}
              </TocList>
            </Toc>

            <MobileToc>
              <MobileTocSummary>{t('privacyPage.toc.label')}</MobileTocSummary>
              <MobileTocNav aria-label={t('privacyPage.toc.label')}>
                <TocList>
                  {PRIVACY_SECTIONS.map((section) => (
                    <li key={section.id}>
                      <TocLink href={`#privacy-${section.id}`}>{t(section.titleKey)}</TocLink>
                    </li>
                  ))}
                </TocList>
              </MobileTocNav>
            </MobileToc>
          </Sidebar>

          <Article>
            <ContactCard ref={contactRef} aria-labelledby="privacy-controller-title">
              <ContactEyebrow>{t('privacyPage.controller.eyebrow')}</ContactEyebrow>
              <ContactTitle id="privacy-controller-title">
                {t('privacyPage.controller.title')}
              </ContactTitle>
              <ContactBody>{t('privacyPage.controller.body')}</ContactBody>
              <ContactLink href={`mailto:${SITE.email}`}>
                <span>{t('privacyPage.controller.emailLabel')}</span>
                <span>{SITE.email}</span>
              </ContactLink>
            </ContactCard>

            {PRIVACY_SECTIONS.map((section, index) => (
              <PrivacySection key={section.id} section={section} index={index} />
            ))}
          </Article>
        </LegalLayout>
      </Content>
    </>
  )
}
