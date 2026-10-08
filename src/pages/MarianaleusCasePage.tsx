import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Container, Eyebrow } from '../components/ui/primitives'
import { ROUTES, SITE } from '../config/site'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReveal } from '../hooks/useReveal'

type PreviewMode = 'screenshot' | 'live'
type DevicePreset = 'desktop' | 'mobile'

const DEVICE_PRESETS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const

const FACTS = [
  {
    label: 'caseMariana.facts.industryLabel',
    value: 'caseMariana.facts.industryValue',
  },
  {
    label: 'caseMariana.facts.locationLabel',
    value: 'caseMariana.facts.locationValue',
  },
  {
    label: 'caseMariana.facts.scopeLabel',
    value: 'caseMariana.facts.scopeValue',
  },
  {
    label: 'caseMariana.facts.yearLabel',
    value: 'caseMariana.facts.yearValue',
  },
] as const

const SOLUTIONS = ['message', 'trust', 'conversion'] as const

const CaseHero = styled.section`
  min-height: min(920px, 100svh);
  /* Keep the dark hero behind the shared transparent sticky header. */
  margin-top: calc(-92px - env(safe-area-inset-top));
  padding: calc(clamp(132px, 17vh, 196px) + env(safe-area-inset-top))
    ${({ theme }) => theme.layout.pagePadding} clamp(58px, 8vw, 108px);
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: min(820px, 78vw);
    aspect-ratio: 1;
    right: -18%;
    bottom: -54%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(102, 92, 246, 0.3), transparent 68%);
    filter: blur(18px);
    pointer-events: none;
  }

  @media (max-width: 760px), (max-height: 600px) and (max-width: 1020px) {
    margin-top: calc(-78px - env(safe-area-inset-top));
  }
`

const HeroInner = styled(Container)`
  min-height: calc(min(920px, 100svh) - clamp(190px, 25vh, 304px));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(54px, 9vw, 112px);
  position: relative;
  z-index: 1;
`

const HeroTop = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: clamp(30px, 7vw, 110px);
  align-items: end;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`

const HeroEyebrow = styled(Eyebrow)`
  color: ${({ theme }) => theme.colors.onDeepDim};
  margin-bottom: clamp(20px, 3vw, 34px);
`

const HeroTitle = styled.h1`
  max-width: 11ch;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 650;
  font-size: clamp(54px, 10vw, 146px);
  line-height: 0.84;
  letter-spacing: -0.075em;
  overflow-wrap: anywhere;
`

const HeroCopy = styled.div`
  padding-bottom: clamp(2px, 1vw, 14px);
`

const HeroLead = styled.p`
  max-width: 40ch;
  color: ${({ theme }) => theme.colors.onDeepDim};
  font-size: clamp(17px, 1.55vw, 22px);
  line-height: 1.48;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;

  @media (max-width: 560px) {
    display: grid;
    grid-template-columns: 1fr;
  }
`

const actionStyles = css`
  min-height: 54px;
  padding: 15px 24px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  font-weight: 650;
  line-height: 1.2;
  text-decoration: none;
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease;

  &:hover {
    transform: translateY(-2px);
  }
`

const PrimaryAction = styled.a`
  ${actionStyles};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;

  &:hover {
    background: ${({ theme }) => theme.colors.accentInk};
  }
`

const HeroSecondaryAction = styled.a`
  ${actionStyles};
  color: ${({ theme }) => theme.colors.onDeep};
  background: rgba(247, 249, 252, 0.08);
  border-color: rgba(247, 249, 252, 0.14);

  &:hover {
    background: rgba(247, 249, 252, 0.14);
    border-color: rgba(247, 249, 252, 0.25);
  }
`

const FactsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid rgba(247, 249, 252, 0.16);

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Fact = styled.div`
  padding: 22px clamp(12px, 2vw, 28px) 0 0;

  &:not(:first-child) {
    padding-left: clamp(12px, 2vw, 28px);
    border-left: 1px solid rgba(247, 249, 252, 0.12);
  }

  @media (max-width: 760px) {
    min-height: 104px;
    padding-top: 18px;

    &:nth-child(3) {
      padding-left: 0;
      border-left: 0;
      border-top: 1px solid rgba(247, 249, 252, 0.12);
    }

    &:nth-child(4) {
      border-top: 1px solid rgba(247, 249, 252, 0.12);
    }
  }
`

const FactLabel = styled.p`
  margin-bottom: 7px;
  color: ${({ theme }) => theme.colors.onDeepDim};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 11px;
  line-height: 1.35;
`

const FactValue = styled.p`
  max-width: 20ch;
  font-size: clamp(15px, 1.35vw, 19px);
  font-weight: 600;
  line-height: 1.35;
`

const ContentSection = styled.section`
  padding: ${({ theme }) => theme.layout.sectionPadding} ${({ theme }) => theme.layout.pagePadding};
  scroll-margin-top: 96px;
`

const StoryHead = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 0.68fr) minmax(0, 1.32fr);
  gap: clamp(30px, 7vw, 120px);
  align-items: start;
  margin-bottom: clamp(44px, 7vw, 90px);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 18px;
  }
`

const SectionHeading = styled.h2`
  max-width: 15ch;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 650;
  font-size: clamp(36px, 5.6vw, 78px);
  line-height: 0.96;
  letter-spacing: -0.052em;
`

const StoryLead = styled.p`
  max-width: 49ch;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: clamp(17px, 1.55vw, 21px);
  line-height: 1.6;
`

const NarrativeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 24px);

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`

const NarrativeCard = styled.article<{ $accent?: boolean }>`
  min-height: clamp(320px, 34vw, 470px);
  padding: clamp(26px, 4vw, 54px);
  border: 1px solid
    ${({ $accent, theme }) => ($accent ? 'transparent' : theme.colors.line)};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ $accent, theme }) => ($accent ? theme.colors.accent : theme.colors.surface)};
  color: ${({ $accent, theme }) => ($accent ? '#fff' : theme.colors.text)};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 48px;
`

const CardEyebrow = styled(Eyebrow)<{ $accent?: boolean }>`
  color: ${({ $accent, theme }) => ($accent ? 'rgba(255,255,255,.94)' : theme.colors.textDim)};
`

const NarrativeTitle = styled.h3`
  max-width: 14ch;
  margin-bottom: 20px;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 620;
  font-size: clamp(29px, 3vw, 46px);
  line-height: 1.02;
  letter-spacing: -0.038em;
`

const NarrativeBody = styled.p`
  max-width: 47ch;
  color: inherit;
  opacity: 0.9;
  font-size: clamp(16px, 1.2vw, 18px);
  line-height: 1.58;
`

const SolutionsSection = styled(ContentSection)`
  padding-top: clamp(18px, 3vw, 44px);
`

const SolutionsHead = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.7fr);
  gap: clamp(28px, 5vw, 78px);
  align-items: end;
  margin-bottom: clamp(34px, 5vw, 64px);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`

const SolutionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid ${({ theme }) => theme.colors.line};

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`

const Solution = styled.article`
  min-height: 330px;
  padding: clamp(26px, 3vw, 42px) clamp(20px, 3vw, 38px) 32px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 50px;

  &:not(:first-child) {
    padding-left: clamp(20px, 3vw, 38px);
    border-left: 1px solid ${({ theme }) => theme.colors.line};
  }

  @media (max-width: 760px) {
    min-height: 260px;
    padding-right: 0;

    &:not(:first-child) {
      padding-left: 0;
      border-top: 1px solid ${({ theme }) => theme.colors.line};
      border-left: 0;
    }
  }
`

const SolutionIndex = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => (theme.mode === 'dark' ? '#a39dff' : theme.colors.accent)};
`

const SolutionTitle = styled.h3`
  margin-bottom: 14px;
  font-size: clamp(25px, 2.4vw, 36px);
  line-height: 1.08;
  letter-spacing: -0.032em;
`

const SolutionBody = styled.p`
  max-width: 39ch;
  color: ${({ theme }) => theme.colors.textDim};
  line-height: 1.55;
`

const PreviewSection = styled.section`
  padding: ${({ theme }) => theme.layout.sectionPadding} ${({ theme }) => theme.layout.pagePadding};
  background: ${({ theme }) => theme.colors.surface2};
`

const PreviewHead = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.75fr);
  gap: clamp(28px, 5vw, 86px);
  align-items: end;
  margin-bottom: clamp(34px, 5vw, 62px);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`

const PreviewCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.m};
  overflow: hidden;
`

const PreviewToolbar = styled.div`
  min-height: 76px;
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 760px) {
    padding: 10px;
    display: grid;
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`

const ToolbarSide = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 760px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const toolbarControlStyles = css`
  min-height: 44px;
  padding: 10px 15px;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 11px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const ToolbarButton = styled.button<{ $active?: boolean }>`
  ${toolbarControlStyles};
  border-color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.line)};
  background: ${({ $active, theme }) => ($active ? theme.colors.accentSoft : 'transparent')};
`

const ToolbarLink = styled.a`
  ${toolbarControlStyles};
`

const PreviewCanvas = styled.div`
  min-height: 280px;
  padding: clamp(16px, 3vw, 42px);
  background:
    linear-gradient(rgba(102, 92, 246, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 92, 246, 0.07) 1px, transparent 1px),
    ${({ theme }) => theme.colors.deep2};
  background-size: 32px 32px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
`

const ViewportSizer = styled.div<{ $preset: DevicePreset }>`
  flex: none;
  position: relative;
  overflow: hidden;
  border: ${({ $preset }) => ($preset === 'mobile' ? '8px' : '10px')} solid #07090e;
  border-radius: ${({ $preset }) => ($preset === 'mobile' ? '34px' : '18px')};
  background: #fff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
`

const LogicalViewport = styled.div`
  position: absolute;
  inset: 0 auto auto 0;
  transform-origin: top left;
  background: #fff;
  overflow: hidden;
`

const PreviewImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
`

const LiveFrame = styled.iframe`
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
`

const ExitLiveButton = styled.button`
  ${toolbarControlStyles};
  position: absolute;
  z-index: 3;
  top: clamp(24px, 4vw, 54px);
  right: clamp(24px, 4vw, 54px);
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(6, 8, 12, 0.88);
  color: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);

  &:hover {
    border-color: #fff;
  }
`

const FinalSection = styled.section`
  padding: clamp(76px, 11vw, 156px) ${({ theme }) => theme.layout.pagePadding};
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};
`

const FinalGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: clamp(30px, 7vw, 116px);
  align-items: end;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`

const FinalEyebrow = styled(Eyebrow)`
  margin-bottom: 18px;
  color: ${({ theme }) => theme.colors.onDeepDim};
`

const FinalTitle = styled.h2`
  max-width: 13ch;
  font-size: clamp(40px, 6.4vw, 92px);
  line-height: 0.95;
  letter-spacing: -0.055em;
`

const FinalLead = styled.p`
  max-width: 42ch;
  color: ${({ theme }) => theme.colors.onDeepDim};
  font-size: clamp(16px, 1.45vw, 20px);
  line-height: 1.55;
`

export function MarianaleusCasePage() {
  const { t } = useTranslation()
  const compact = useMediaQuery(
    '(max-width: 760px), (max-height: 600px) and (max-width: 1020px)',
  )
  const [mode, setMode] = useState<PreviewMode>('screenshot')
  const [preset, setPreset] = useState<DevicePreset>(compact ? 'mobile' : 'desktop')
  const [scale, setScale] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const screenshotToggleRef = useRef<HTMLButtonElement>(null)

  const heroRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12, y: 22 })
  const factsRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.08, y: 18 })
  const storyRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.1, y: 24 })
  const narrativeRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12, y: 28 })
  const solutionsHeadRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.1, y: 22 })
  const solutionsRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.1, y: 24 })
  const previewHeadRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.1, y: 22 })
  const previewRef = useReveal<HTMLDivElement>({ y: 24, scale: 0.985 })
  const finalRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12, y: 24 })

  const viewport = DEVICE_PRESETS[preset]
  const bezelSize = preset === 'mobile' ? 16 : 20
  const liveUrl = `https://${SITE.flagship}`
  const showLive = mode === 'live' && !compact

  const exitLive = () => {
    setMode('screenshot')
    window.requestAnimationFrame(() => screenshotToggleRef.current?.focus())
  }

  useEffect(() => {
    if (compact && mode === 'live') setMode('screenshot')
  }, [compact, mode])

  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const measure = () => {
      const styles = window.getComputedStyle(canvas)
      const horizontalPadding = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight)
      const availableWidth = Math.max(1, canvas.clientWidth - horizontalPadding)
      const availableHeight = compact ? 720 : 760
      const nextScale = Math.min(
        1,
        Math.max(1, availableWidth - bezelSize) / viewport.width,
        Math.max(1, availableHeight - bezelSize) / viewport.height,
      )

      setScale(Math.max(0.1, nextScale))
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [bezelSize, compact, viewport.height, viewport.width])

  const screenshotSrc =
    preset === 'desktop' ? '/media/marianaleus-desktop.jpg' : '/media/marianaleus-mobile.jpg'

  return (
    <>
      <CaseHero id="top">
        <HeroInner>
          <HeroTop ref={heroRef}>
            <div>
              <HeroEyebrow>{t('caseMariana.hero.eyebrow')}</HeroEyebrow>
              <HeroTitle>{t('caseMariana.hero.title')}</HeroTitle>
            </div>

            <HeroCopy>
              <HeroLead>{t('caseMariana.hero.lead')}</HeroLead>
              <Actions>
                <PrimaryAction href={liveUrl} target="_blank" rel="noreferrer">
                  {t('caseMariana.actions.openLive')}
                </PrimaryAction>
                <HeroSecondaryAction href="#case-story">
                  {t('caseMariana.actions.exploreCase')}
                </HeroSecondaryAction>
              </Actions>
            </HeroCopy>
          </HeroTop>

          <FactsGrid ref={factsRef}>
            {FACTS.map((fact) => (
              <Fact key={fact.label}>
                <FactLabel>{t(fact.label)}</FactLabel>
                <FactValue>{t(fact.value)}</FactValue>
              </Fact>
            ))}
          </FactsGrid>
        </HeroInner>
      </CaseHero>

      <ContentSection id="case-story">
        <Container>
          <StoryHead ref={storyRef}>
            <div>
              <Eyebrow>{t('caseMariana.story.eyebrow')}</Eyebrow>
              <SectionHeading>{t('caseMariana.story.title')}</SectionHeading>
            </div>
            <StoryLead>{t('caseMariana.story.lead')}</StoryLead>
          </StoryHead>

          <NarrativeGrid ref={narrativeRef}>
            <NarrativeCard>
              <CardEyebrow>{t('caseMariana.problem.eyebrow')}</CardEyebrow>
              <div>
                <NarrativeTitle>{t('caseMariana.problem.title')}</NarrativeTitle>
                <NarrativeBody>{t('caseMariana.problem.body')}</NarrativeBody>
              </div>
            </NarrativeCard>

            <NarrativeCard $accent>
              <CardEyebrow $accent>{t('caseMariana.approach.eyebrow')}</CardEyebrow>
              <div>
                <NarrativeTitle>{t('caseMariana.approach.title')}</NarrativeTitle>
                <NarrativeBody>{t('caseMariana.approach.body')}</NarrativeBody>
              </div>
            </NarrativeCard>
          </NarrativeGrid>
        </Container>
      </ContentSection>

      <SolutionsSection>
        <Container>
          <SolutionsHead ref={solutionsHeadRef}>
            <div>
              <Eyebrow>{t('caseMariana.solutions.eyebrow')}</Eyebrow>
              <SectionHeading>{t('caseMariana.solutions.title')}</SectionHeading>
            </div>
            <StoryLead>{t('caseMariana.solutions.lead')}</StoryLead>
          </SolutionsHead>

          <SolutionGrid ref={solutionsRef}>
            {SOLUTIONS.map((solution) => (
              <Solution key={solution}>
                <SolutionIndex>{t(`caseMariana.solutions.items.${solution}.index`)}</SolutionIndex>
                <div>
                  <SolutionTitle>{t(`caseMariana.solutions.items.${solution}.title`)}</SolutionTitle>
                  <SolutionBody>{t(`caseMariana.solutions.items.${solution}.body`)}</SolutionBody>
                </div>
              </Solution>
            ))}
          </SolutionGrid>
        </Container>
      </SolutionsSection>

      <PreviewSection id="case-preview">
        <Container>
          <PreviewHead ref={previewHeadRef}>
            <div>
              <Eyebrow>{t('caseMariana.preview.eyebrow')}</Eyebrow>
              <SectionHeading>{t('caseMariana.preview.title')}</SectionHeading>
            </div>
            <StoryLead>{t('caseMariana.preview.lead')}</StoryLead>
          </PreviewHead>

          <PreviewCard ref={previewRef}>
            <PreviewToolbar>
              <ToolbarSide
                role="group"
                aria-label={t('caseMariana.preview.modeGroupLabel')}
              >
                <ToolbarButton
                  ref={screenshotToggleRef}
                  type="button"
                  $active={mode === 'screenshot'}
                  aria-pressed={mode === 'screenshot'}
                  onClick={() => setMode('screenshot')}
                >
                  {t('caseMariana.preview.screenshot')}
                </ToolbarButton>

                {compact ? (
                  <ToolbarLink href={liveUrl} target="_blank" rel="noreferrer">
                    {t('caseMariana.preview.openLiveMobile')}
                  </ToolbarLink>
                ) : (
                  <ToolbarButton
                    type="button"
                    $active={mode === 'live'}
                    aria-pressed={mode === 'live'}
                    onClick={() => setMode('live')}
                  >
                    {t('caseMariana.preview.live')}
                  </ToolbarButton>
                )}
              </ToolbarSide>

              <ToolbarSide
                role="group"
                aria-label={t('caseMariana.preview.deviceGroupLabel')}
              >
                <ToolbarButton
                  type="button"
                  $active={preset === 'desktop'}
                  aria-pressed={preset === 'desktop'}
                  onClick={() => setPreset('desktop')}
                >
                  {t('caseMariana.preview.desktop')}
                </ToolbarButton>
                <ToolbarButton
                  type="button"
                  $active={preset === 'mobile'}
                  aria-pressed={preset === 'mobile'}
                  onClick={() => setPreset('mobile')}
                >
                  {t('caseMariana.preview.mobile')}
                </ToolbarButton>
              </ToolbarSide>
            </PreviewToolbar>

            <PreviewCanvas ref={canvasRef}>
              {showLive && (
                <ExitLiveButton type="button" onClick={exitLive}>
                  {t('caseMariana.preview.exitLive')}
                </ExitLiveButton>
              )}

              <ViewportSizer
                $preset={preset}
                style={{
                  width: viewport.width * scale + bezelSize,
                  height: viewport.height * scale + bezelSize,
                }}
              >
                <LogicalViewport
                  style={{
                    width: viewport.width,
                    height: viewport.height,
                    transform: `scale(${scale})`,
                  }}
                >
                  {showLive ? (
                    <LiveFrame
                      src={liveUrl}
                      title={t('caseMariana.preview.iframeTitle')}
                      loading="lazy"
                      sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <PreviewImage
                      src={screenshotSrc}
                      alt={t(
                        preset === 'desktop'
                          ? 'caseMariana.preview.desktopAlt'
                          : 'caseMariana.preview.mobileAlt',
                      )}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </LogicalViewport>
              </ViewportSizer>
            </PreviewCanvas>
          </PreviewCard>
        </Container>
      </PreviewSection>

      <FinalSection>
        <Container>
          <FinalGrid ref={finalRef}>
            <div>
              <FinalEyebrow>{t('caseMariana.finalCta.eyebrow')}</FinalEyebrow>
              <FinalTitle>{t('caseMariana.finalCta.title')}</FinalTitle>
            </div>
            <div>
              <FinalLead>{t('caseMariana.finalCta.lead')}</FinalLead>
              <Actions>
                <PrimaryAction href={ROUTES.contact}>
                  {t('caseMariana.actions.startProject')}
                </PrimaryAction>
                <HeroSecondaryAction href={liveUrl} target="_blank" rel="noreferrer">
                  {t('caseMariana.actions.openLive')}
                </HeroSecondaryAction>
              </Actions>
            </div>
          </FinalGrid>
        </Container>
      </FinalSection>
    </>
  )
}
