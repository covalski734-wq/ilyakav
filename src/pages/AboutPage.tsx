import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Container, Eyebrow } from '../components/ui/primitives'
import { CaseCards } from '../components/CaseCards'
import { ROUTES } from '../config/site'
import { useReveal } from '../hooks/useReveal'

const CAPABILITIES = ['strategy', 'design', 'frontend', 'customApps'] as const

const AboutHero = styled.section`
  position: relative;
  min-height: min(940px, 100svh);
  margin-top: calc(-92px - env(safe-area-inset-top));
  padding: calc(clamp(148px, 19vh, 214px) + env(safe-area-inset-top))
    ${({ theme }) => theme.layout.pagePadding} clamp(60px, 8vw, 108px);
  overflow: hidden;
  isolation: isolate;
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};

  &::before {
    content: '';
    position: absolute;
    z-index: -2;
    width: min(880px, 76vw);
    aspect-ratio: 1;
    top: -54%;
    right: -13%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(102, 92, 246, 0.34), transparent 68%);
    filter: blur(22px);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    opacity: 0.09;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px);
    background-size: 78px 78px;
    mask-image: linear-gradient(120deg, #000, transparent 74%);
    -webkit-mask-image: linear-gradient(120deg, #000, transparent 74%);
    pointer-events: none;
  }

  @media (max-width: 760px) {
    min-height: min(850px, 100svh);
    margin-top: calc(-78px - env(safe-area-inset-top));
    padding: calc(126px + env(safe-area-inset-top)) clamp(18px, 5vw, 24px) 54px;

    &::before {
      width: 138vw;
      top: -28%;
      right: -72%;
    }

    &::after {
      background-size: 46px 46px;
    }
  }

  @media (max-height: 600px) and (max-width: 1020px) {
    min-height: 100svh;
    margin-top: calc(-78px - env(safe-area-inset-top));
    padding: calc(96px + env(safe-area-inset-top)) clamp(18px, 4vw, 34px) 34px;

    &::before {
      width: 112vw;
      top: -72%;
      right: -42%;
    }
  }
`

const HeroInner = styled(Container)`
  min-height: calc(min(940px, 100svh) - clamp(208px, 27vh, 322px));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(56px, 9vw, 112px);

  @media (max-width: 760px) {
    min-height: calc(min(850px, 100svh) - 180px);
    gap: 54px;
  }

  @media (max-height: 600px) and (max-width: 1020px) {
    min-height: 0;
    gap: 34px;
  }
`

const HeroMain = styled.div``


const HeroTitle = styled.h1`
  overflow-wrap: anywhere;
  hyphens: manual;
  max-width: 25ch;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(38px, 5.6vw, 80px);
  font-weight: 680;
  line-height: 1.05;
  letter-spacing: -0.07em;

  @media (max-width: 430px) {
    font-size: clamp(34px, 8.5vw, 42px);
    line-height: 1.08;
    letter-spacing: -0.062em;
  }

  @media (max-height: 600px) and (max-width: 1020px) {
    max-width: 25ch;
    font-size: clamp(34px, 4.6vw, 50px);
    line-height: 1.08;
    letter-spacing: -0.055em;
  }
`

const HeroBottom = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(250px, 0.55fr);
  gap: clamp(28px, 7vw, 110px);
  align-items: end;
  padding-top: 26px;
  border-top: 1px solid rgba(247, 249, 252, 0.16);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  @media (max-height: 600px) and (max-width: 1020px) {
    gap: 16px 32px;
    padding-top: 18px;
  }
`

const HeroLead = styled.p`
  max-width: 53ch;
  font-size: clamp(18px, 1.7vw, 24px);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.onDeepDim};
`

const HeroNote = styled.p`
  max-width: 34ch;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.onDeepDim};
`

const BaseSection = styled.section`
  padding: ${({ theme }) => theme.layout.sectionPadding} ${({ theme }) => theme.layout.pagePadding};
`

const EditorialHead = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 0.55fr) minmax(0, 1.45fr);
  gap: clamp(28px, 7vw, 120px);
  align-items: start;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`


const SectionTitle = styled.h2`
  max-width: 15ch;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(38px, 5.8vw, 82px);
  font-weight: 650;
  line-height: 0.96;
  letter-spacing: -0.055em;
`

const PositioningTitle = styled(SectionTitle)`
  font-size: clamp(38px, 4vw, 56px);
  overflow-wrap: anywhere;
`

const PositioningCopy = styled.div``

const BodyCopy = styled.p`
  max-width: 58ch;
  margin-top: clamp(20px, 3vw, 34px);
  color: ${({ theme }) => theme.colors.textDim};
  font-size: clamp(16px, 1.35vw, 19px);
  line-height: 1.68;
`

const PositioningStatement = styled.div`
  margin-top: clamp(50px, 8vw, 108px);
  padding: clamp(28px, 5vw, 68px);
  display: grid;
  grid-template-columns: minmax(120px, 0.36fr) minmax(0, 1.64fr);
  gap: clamp(24px, 5vw, 80px);
  align-items: start;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`

const StatementLabel = styled(Eyebrow)`
  color: #fff;
`

const StatementText = styled.p`
  max-width: 28ch;
  font-size: clamp(27px, 4.2vw, 60px);
  font-weight: 630;
  line-height: 1.02;
  letter-spacing: -0.048em;
`

const SplitHead = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.72fr);
  gap: clamp(30px, 7vw, 112px);
  align-items: end;
  margin-bottom: clamp(42px, 7vw, 82px);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 22px;
  }
`

const SectionLead = styled.p`
  max-width: 48ch;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: clamp(16px, 1.45vw, 20px);
  line-height: 1.62;
`

const ItemIndex = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => (theme.mode === 'dark' ? '#aaa5ff' : theme.colors.accent)};
`

const CapabilitiesSection = styled(BaseSection)`
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};
`

const DarkSectionLead = styled(SectionLead)`
  color: ${({ theme }) => theme.colors.onDeepDim};
`

const CapabilitiesList = styled.div`
  margin-top: clamp(48px, 8vw, 94px);
  border-top: 1px solid rgba(247, 249, 252, 0.16);
`

const CapabilityRow = styled.article`
  min-height: 180px;
  padding: clamp(25px, 3.4vw, 46px) 0;
  display: grid;
  grid-template-columns: minmax(58px, 0.18fr) minmax(210px, 0.66fr) minmax(0, 1.16fr);
  gap: clamp(16px, 4vw, 62px);
  align-items: start;
  border-bottom: 1px solid rgba(247, 249, 252, 0.16);

  @media (max-width: 680px) {
    min-height: 0;
    grid-template-columns: auto minmax(0, 1fr);

    > p {
      grid-column: 2;
    }
  }
`

const CapabilityTitle = styled.h3`
  max-width: 14ch;
  font-size: clamp(26px, 3.2vw, 46px);
  font-weight: 620;
  line-height: 1;
  letter-spacing: -0.044em;
`

const CapabilityBody = styled.p`
  max-width: 50ch;
  color: ${({ theme }) => theme.colors.onDeepDim};
  font-size: clamp(15px, 1.25vw, 18px);
  line-height: 1.62;
`

const CollaborationSection = styled(BaseSection)``

const CollaborationGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.84fr) minmax(0, 1.16fr);
  gap: clamp(28px, 7vw, 116px);
  align-items: start;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`

const CollaborationIntro = styled.div`
  position: sticky;
  top: 128px;

  @media (max-width: 820px) {
    position: static;
  }
`

const ModelCards = styled.div`
  display: grid;
  gap: 14px;
`

const ModelCard = styled.article<{ $accent?: boolean }>`
  min-height: 0;
  padding: clamp(28px, 4vw, 52px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  border: 1px solid ${({ $accent, theme }) => ($accent ? 'transparent' : theme.colors.line)};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ $accent, theme }) => ($accent ? theme.colors.accent : theme.colors.surface)};
  color: ${({ $accent, theme }) => ($accent ? '#fff' : theme.colors.text)};
`

const ModelLabel = styled(Eyebrow)<{ $accent?: boolean }>`
  color: ${({ $accent, theme }) => ($accent ? '#fff' : theme.colors.textDim)};
`

const ModelBody = styled.p`
  max-width: 47ch;
  font-size: clamp(16px, 1.2vw, 18px);
  line-height: 1.62;
  opacity: 1;
`

const ProjectsSection = styled(BaseSection)`
  background: ${({ theme }) => theme.colors.surface2};
`

const FinalSection = styled.section`
  padding: clamp(76px, 11vw, 158px) ${({ theme }) => theme.layout.pagePadding};
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};
`

const FinalGrid = styled(Container)`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: clamp(32px, 7vw, 116px);
  align-items: end;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`

const FinalTitle = styled.h2`
  max-width: 12ch;
  margin-top: 18px;
  font-size: clamp(42px, 6.7vw, 96px);
  font-weight: 650;
  line-height: 0.94;
  letter-spacing: -0.06em;
`

const FinalCopy = styled.div``

const FinalLead = styled.p`
  max-width: 42ch;
  color: ${({ theme }) => theme.colors.onDeepDim};
  font-size: clamp(16px, 1.45vw, 20px);
  line-height: 1.6;
`

const buttonStyles = css`
  min-height: 56px;
  margin-top: 28px;
  padding: 16px 27px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-weight: 650;
  line-height: 1.2;
  text-decoration: none;
  transition:
    transform 0.25s ease,
    background 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    background: ${({ theme }) => theme.colors.accentInk};
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 255, 255, 0.72);
    outline-offset: 4px;
  }

  @media (max-width: 520px) {
    width: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`

const FinalButton = styled.a`
  ${buttonStyles};
`

const Portrait = styled.img`
  display: block;
  width: 100%;
  max-width: 420px;
  height: auto;
  margin-top: 24px;
  border-radius: ${({ theme }) => theme.radii.xl};
`

const ProjectsTitle = styled(SectionTitle)`
  max-width: 24ch;
  margin-bottom: 36px;
`

const WorkLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 14px;
  min-height: 44px;
  margin-top: 28px;
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 6px;
`

export function AboutPage() {
  const { t } = useTranslation()

  const heroRef = useReveal<HTMLDivElement>({
    children: true,
    stagger: 0.12,
    y: 22,
  })
  const positioningRef = useReveal<HTMLDivElement>({
    children: true,
    stagger: 0.1,
    y: 24,
  })
  const statementRef = useReveal<HTMLDivElement>({ y: 28, scale: 0.985 })
  const capabilitiesHeadRef = useReveal<HTMLDivElement>({
    children: true,
    stagger: 0.1,
    y: 22,
  })
  const capabilitiesRef = useReveal<HTMLDivElement>({
    children: true,
    stagger: 0.08,
    y: 20,
  })
  const collaborationIntroRef = useReveal<HTMLDivElement>({
    children: true,
    stagger: 0.1,
    y: 22,
  })
  const modelRef = useReveal<HTMLDivElement>({
    children: true,
    stagger: 0.12,
    y: 28,
  })
  const finalRef = useReveal<HTMLDivElement>({
    children: true,
    stagger: 0.12,
    y: 24,
  })

  return (
    <>
      <AboutHero id="top">
        <HeroInner ref={heroRef}>
          <HeroMain>
            <HeroTitle>{t('aboutPage.hero.title')}</HeroTitle>
          </HeroMain>

          <HeroBottom>
            <HeroLead>{t('aboutPage.hero.lead')}</HeroLead>
            <HeroNote>{t('aboutPage.hero.note')}</HeroNote>
          </HeroBottom>
        </HeroInner>
      </AboutHero>

      <BaseSection>
        <Container>
          <EditorialHead ref={positioningRef}>
            <div>
              <Eyebrow>{t('aboutPage.positioning.title')}</Eyebrow>
              <Portrait src="/media/ilya-portrait-768.webp" srcSet="/media/ilya-portrait-480.webp 480w, /media/ilya-portrait-768.webp 768w" sizes="(max-width: 760px) 90vw, 32vw" width={768} height={1024} alt={t('aboutPage.positioning.portraitAlt')} loading="lazy" decoding="async" />
            </div>
            <PositioningCopy>
              <PositioningTitle>{t('aboutPage.positioning.lead')}</PositioningTitle>
              <BodyCopy>{t('aboutPage.positioning.body')}</BodyCopy>
            </PositioningCopy>
          </EditorialHead>

          <PositioningStatement ref={statementRef}>
            <StatementLabel>{t('aboutPage.positioning.statementLabel')}</StatementLabel>
            <StatementText>{t('aboutPage.positioning.statement')}</StatementText>
          </PositioningStatement>
        </Container>
      </BaseSection>


      <CapabilitiesSection>
        <Container>
          <SplitHead ref={capabilitiesHeadRef}>
            <div>
              <SectionTitle>{t('aboutPage.capabilities.title')}</SectionTitle>
            </div>
            <DarkSectionLead>{t('aboutPage.capabilities.lead')}</DarkSectionLead>
          </SplitHead>

          <CapabilitiesList ref={capabilitiesRef}>
            {CAPABILITIES.map((capability) => (
              <CapabilityRow key={capability}>
                <ItemIndex aria-hidden="true">
                  {t(`aboutPage.capabilities.items.${capability}.index`)}
                </ItemIndex>
                <CapabilityTitle>
                  {t(`aboutPage.capabilities.items.${capability}.title`)}
                </CapabilityTitle>
                <CapabilityBody>
                  {t(`aboutPage.capabilities.items.${capability}.body`)}
                </CapabilityBody>
              </CapabilityRow>
            ))}
          </CapabilitiesList>
          <WorkLink href="/#work">{t('aboutPage.capabilities.workLink')} <span aria-hidden="true">→</span></WorkLink>
        </Container>
      </CapabilitiesSection>

      <CollaborationSection>
        <Container>
          <CollaborationGrid>
            <CollaborationIntro ref={collaborationIntroRef}>
              <SectionTitle>{t('aboutPage.collaboration.title')}</SectionTitle>
            </CollaborationIntro>

            <ModelCards ref={modelRef}>
              <ModelCard $accent>
                <ModelLabel $accent>{t('aboutPage.collaboration.solo.label')}</ModelLabel>
                <div>
                  <ModelBody>{t('aboutPage.collaboration.solo.body')}</ModelBody>
                </div>
              </ModelCard>

              <ModelCard>
                <ModelLabel>{t('aboutPage.collaboration.network.label')}</ModelLabel>
                <div>
                  <ModelBody>{t('aboutPage.collaboration.network.body')}</ModelBody>
                </div>
              </ModelCard>
            </ModelCards>
          </CollaborationGrid>
        </Container>
      </CollaborationSection>

      <ProjectsSection>
        <Container>
          <ProjectsTitle>{t('aboutPage.projectsTitle')}</ProjectsTitle>
          <CaseCards compact />
          <WorkLink href="/#work">{t('aboutPage.allProjects')} <span aria-hidden="true">→</span></WorkLink>
        </Container>
      </ProjectsSection>

      <FinalSection>
        <FinalGrid ref={finalRef}>
          <div>
            <FinalTitle>{t('aboutPage.finalCta.title')}</FinalTitle>
          </div>
          <FinalCopy>
            <FinalLead>{t('aboutPage.finalCta.lead')}</FinalLead>
            <FinalButton href={ROUTES.contact}>{t('aboutPage.finalCta.button')}</FinalButton>
          </FinalCopy>
        </FinalGrid>
      </FinalSection>
    </>
  )
}
