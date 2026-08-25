import { useEffect, useLayoutEffect, useRef } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { gsap } from '../lib/gsap'
import { useMediaQuery, usePrefersReducedMotion } from '../hooks/useMediaQuery'

const pulse = keyframes`
  0%, 100% { opacity: 0.45; transform: scale(0.82); }
  50% { opacity: 1; transform: scale(1); }
`

const chartBreathe = keyframes`
  0%, 100% { transform: scaleY(0.72); opacity: 0.62; }
  50% { transform: scaleY(1); opacity: 1; }
`

const marquee = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`

const cardFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.7em); }
`

const Scene = styled.div`
  position: relative;
`

/**
 * Pinned animation on normal devices; with reduced motion it collapses to a
 * normal auto-height block with the lid already open.
 */
const Stage = styled.div<{ $still: boolean }>`
  height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
  padding: clamp(84px, 14vh, 120px) ${({ theme }) => theme.layout.pagePadding}
    clamp(30px, 7vh, 58px);
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};

  @media (max-height: 600px) and (orientation: landscape) {
    padding-top: 132px;
    padding-bottom: 24px;
  }

  ${({ $still }) =>
    $still &&
    css`
      height: auto;
      min-height: 80svh;
      overflow: visible;
      padding-top: clamp(48px, 10vw, 90px);
      padding-bottom: clamp(48px, 10vw, 90px);
    `}
`

const Glow = styled.div`
  position: absolute;
  width: min(1000px, 88vw);
  height: min(560px, 62vh);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 91, 255, 0.36), transparent 70%);
  filter: blur(40px);
  opacity: 0.34;
  pointer-events: none;
`

const SceneHeader = styled.div<{ $still: boolean }>`
  margin: 0 0 clamp(18px, 3vh, 34px);
  position: relative;

  @media (max-width: 760px), (max-height: 600px) {
    width: auto;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    margin: 0 0 30px;
    padding-top: 14px;
    border-top: 1px solid rgba(231, 236, 245, 0.16);

    ${({ $still, theme }) =>
      !$still &&
      css`
        position: absolute;
        z-index: 2;
        top: calc(82px + env(safe-area-inset-top));
        left: ${theme.layout.pagePadding};
        right: ${theme.layout.pagePadding};
      `}
  }
`

const ChapterIndex = styled.span`
  display: none;

  @media (max-width: 760px), (max-height: 600px) {
    display: block;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 10px;
    line-height: 1;
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Caption = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.onDeepDim};
`

const ChapterArrow = styled.span`
  display: none;

  @media (max-width: 760px), (max-height: 600px) {
    width: 28px;
    height: 28px;
    border: 1px solid rgba(231, 236, 245, 0.18);
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: ${({ theme }) => theme.colors.onDeepDim};
    font-size: 13px;
    line-height: 1;
  }
`

const Perspective = styled.div`
  perspective: 1900px;
  width: min(980px, 84vw, 68vh);
  position: relative;

  @media (max-height: 600px) and (orientation: landscape) {
    width: min(900px, 72vw, 34vh);
  }
`

const Laptop = styled.div`
  position: relative;
  transform-style: preserve-3d;
`

const Lid = styled.div<{ $still: boolean }>`
  transform-origin: 50% 100%;
  transform: ${({ $still }) => ($still ? 'rotateX(0deg)' : 'rotateX(-88deg)')};
  background: #171d27;
  border-radius: 22px 22px 6px 6px;
  padding: 12px 12px 18px;
  box-shadow: ${({ theme }) => theme.shadows.l};
`

const Screen = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  aspect-ratio: 16 / 10;
  container-type: inline-size;
  background: #07090e;
`

const ScreenContent = styled.div<{ $still: boolean }>`
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: ${({ $still }) => ($still ? 1 : 0)};
`

const DemoPage = styled.div`
  width: 100%;
  min-height: 390%;
  overflow: hidden;
  background: #f4f6fb;
  color: #111827;
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: clamp(5px, 1.45cqw, 14px);
`

const DemoTopbar = styled.div`
  min-height: 6.2em;
  padding: 1.35em 3em;
  border-bottom: 1px solid #dde2ee;
  display: flex;
  align-items: center;
  gap: 2.4em;
  background: rgba(255, 255, 255, 0.9);
`

const DemoBrand = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.65em;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 1.35em;
  font-weight: 700;

  &::before {
    content: '';
    width: 1.45em;
    height: 1.45em;
    border-radius: 0.45em 0.45em 0.45em 50%;
    background: linear-gradient(135deg, #635bff, #35b8ff);
  }
`

const DemoNav = styled.div`
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 2.2em;
  color: #70798d;
  font-size: 0.88em;

  span:first-child {
    color: #111827;
    font-weight: 650;
  }
`

const DemoStatus = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.7em;
  padding: 0.75em 1.1em;
  border: 1px solid #dce3ef;
  border-radius: 999px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.78em;
  color: #4d596f;

  &::before {
    content: '';
    width: 0.62em;
    height: 0.62em;
    border-radius: 50%;
    background: #34c98d;
    animation: ${pulse} 2.2s ease-in-out infinite;
    animation-play-state: var(--demo-play-state, paused);
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
    }
  }
`

const DemoHero = styled.div`
  min-height: 41em;
  padding: 8em 5em 5em;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 32%, rgba(99, 91, 255, 0.22), transparent 24em),
    linear-gradient(135deg, #0d1321, #151d32 70%, #1b1b43);
  color: #f8faff;

  &::after {
    content: '';
    position: absolute;
    width: 22em;
    height: 22em;
    right: 8em;
    top: 7em;
    border: 1px solid rgba(166, 175, 255, 0.28);
    border-radius: 50%;
    box-shadow:
      0 0 0 4em rgba(112, 105, 255, 0.05),
      0 0 0 8em rgba(112, 105, 255, 0.035);
    animation: ${pulse} 6s ease-in-out infinite;
    animation-play-state: var(--demo-play-state, paused);
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
    }
  }
`

const DemoEyebrow = styled.p`
  margin: 0 0 2.2em;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.84em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9fa9ff;
`

const DemoTitle = styled.h3`
  position: relative;
  z-index: 1;
  max-width: 9.5ch;
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 5.2em;
  line-height: 0.94;
  letter-spacing: -0.06em;
`

const DemoLead = styled.p`
  position: relative;
  z-index: 1;
  max-width: 38ch;
  margin: 2.1em 0 0;
  color: #aeb8cc;
  font-size: 1.15em;
  line-height: 1.55;
`

const DemoAction = styled.span`
  position: relative;
  z-index: 1;
  width: fit-content;
  margin-top: 2.6em;
  padding: 1.15em 1.55em;
  border-radius: 0.9em;
  display: inline-flex;
  align-items: center;
  gap: 1em;
  background: #635bff;
  color: #fff;
  font-size: 0.9em;
  font-weight: 700;

  &::after {
    content: '\2192';
  }
`

const DemoMetrics = styled.div`
  padding: 3.2em 4em;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.4em;
  background: #edf0f7;
`

const DemoMetric = styled.div`
  min-height: 11em;
  padding: 2em;
  border: 1px solid #dde2ec;
  border-radius: 1.6em;
  background: #fff;
  box-shadow: 0 1em 3em rgba(34, 47, 77, 0.06);

  small {
    color: #7c869a;
    font-size: 0.78em;
  }

  strong {
    display: block;
    margin-top: 0.7em;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 2.55em;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  span {
    display: block;
    margin-top: 0.8em;
    color: #21a775;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.72em;
  }
`

const DemoPanel = styled.div`
  margin: 4em;
  padding: 3.4em;
  border: 1px solid #dce2ec;
  border-radius: 2em;
  background: #fff;
  box-shadow: 0 2em 5em rgba(35, 48, 77, 0.08);
`

const DemoSectionHead = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2em;
  margin-bottom: 3em;

  p {
    margin: 0 0 0.7em;
    color: #635bff;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.76em;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  h4 {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 2.4em;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  span {
    color: #788296;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.75em;
  }
`

const DemoChart = styled.div`
  height: 25em;
  padding: 2em 2em 0;
  border-radius: 1.5em;
  display: flex;
  align-items: end;
  gap: 1.1em;
  overflow: hidden;
  background:
    linear-gradient(#e7eaf1 1px, transparent 1px) 0 0 / 100% 25%,
    linear-gradient(180deg, #f9faff, #f1f3fa);
`

const ChartBar = styled.span<{ $height: number; $delay: number }>`
  flex: 1;
  height: ${({ $height }) => `${$height}%`};
  min-width: 0;
  border-radius: 0.75em 0.75em 0 0;
  transform-origin: bottom;
  background: linear-gradient(180deg, #766fff, #4b46d6);
  box-shadow: 0 -0.8em 2em rgba(99, 91, 255, 0.18);
  animation: ${chartBreathe} 3.2s ease-in-out infinite;
  animation-delay: ${({ $delay }) => `${$delay}s`};
  animation-play-state: var(--demo-play-state, paused);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const DemoTicker = styled.div`
  overflow: hidden;
  border-block: 1px solid #dde2eb;
  background: #101729;
  color: #dfe5f4;
`

const TickerTrack = styled.div`
  width: max-content;
  padding: 1.8em 0;
  display: flex;
  animation: ${marquee} 16s linear infinite;
  animation-play-state: var(--demo-play-state, paused);

  span {
    padding-right: 5em;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.78em;
    letter-spacing: 0.04em;

    &::before {
      content: '';
      width: 0.55em;
      height: 0.55em;
      margin-right: 1.3em;
      border-radius: 50%;
      display: inline-block;
      background: #55d6a0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const DemoWorkflow = styled.div`
  padding: 6em 4em;
  background: #f4f6fb;
`

const WorkflowGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.4em;
`

const WorkflowColumn = styled.div`
  min-height: 28em;
  padding: 1.4em;
  border-radius: 1.5em;
  background: #e9edf5;

  > p {
    margin: 0.4em 0 1.4em;
    padding: 0 0.5em;
    color: #697489;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.75em;
  }
`

const WorkflowCard = styled.div<{ $accent?: boolean; $delay?: number }>`
  min-height: 9em;
  margin-top: 1.1em;
  padding: 1.5em;
  border: 1px solid ${({ $accent }) => ($accent ? '#bcb8ff' : '#d8deea')};
  border-radius: 1.2em;
  background: ${({ $accent }) => ($accent ? '#f0efff' : '#fff')};
  box-shadow: 0 0.8em 2.4em rgba(38, 50, 76, 0.06);
  animation: ${cardFloat} 5s ease-in-out infinite;
  animation-delay: ${({ $delay = 0 }) => `${$delay}s`};
  animation-play-state: var(--demo-play-state, paused);

  strong {
    display: block;
    font-size: 0.9em;
  }

  span {
    display: block;
    width: 72%;
    height: 0.65em;
    margin-top: 1.2em;
    border-radius: 999px;
    background: #e1e5ed;

    & + span {
      width: 46%;
      margin-top: 0.7em;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const DemoSignals = styled.div`
  padding: 6em 4em;
  background: #111827;
  color: #f8faff;
`

const SignalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.4em;
`

const SignalCard = styled.div`
  min-height: 17em;
  padding: 2.2em;
  border: 1px solid rgba(191, 201, 226, 0.14);
  border-radius: 1.5em;
  background: rgba(255, 255, 255, 0.045);

  span {
    width: 2.2em;
    height: 2.2em;
    border-radius: 0.8em;
    display: grid;
    place-items: center;
    background: #635bff;
    color: #fff;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.8em;
  }

  strong {
    display: block;
    margin-top: 3em;
    font-size: 1.1em;
  }

  p {
    margin: 1em 0 0;
    color: #9da8bd;
    font-size: 0.78em;
    line-height: 1.5;
  }
`

const DemoClosing = styled.div`
  min-height: 31em;
  padding: 7em 5em;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 3em;
  background: radial-gradient(circle at 18% 16%, rgba(99, 91, 255, 0.22), transparent 26em), #fff;

  h4 {
    max-width: 10ch;
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 3.7em;
    line-height: 0.98;
    letter-spacing: -0.055em;
  }

  span {
    flex: none;
    padding: 1.2em 1.6em;
    border-radius: 0.9em;
    background: #111827;
    color: #fff;
    font-size: 0.85em;
    font-weight: 700;
  }
`

const ScreenOff = styled.div<{ $still: boolean }>`
  position: absolute;
  inset: 0;
  background: linear-gradient(140deg, #111620, #06080c);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $still }) => ($still ? 0 : 1)};

  span {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: clamp(14px, 1.6vw, 22px);
    color: rgba(231, 236, 245, 0.28);
  }
`

const Hinge = styled.div`
  height: 6px;
  background: #121721;
  border-radius: 0 0 4px 4px;
  transform: translateY(-2px);
`

const Base = styled.div<{ $still: boolean }>`
  transform-origin: 50% 0;
  transform: ${({ $still }) => ($still ? 'rotateX(74deg)' : 'rotateX(84deg)')};
  background: linear-gradient(180deg, #242c39, #121721);
  border-radius: 0 0 26px 26px;
  padding: clamp(9px, 1.2vw, 16px) clamp(14px, 2.6vw, 36px) clamp(10px, 1.5vw, 20px);
  display: flex;
  flex-direction: column;
  gap: clamp(3px, 0.45vw, 6px);
  box-shadow: ${({ theme }) => theme.shadows.l};
`

const KeyRow = styled.div`
  display: flex;
  gap: clamp(2px, 0.35vw, 4px);
  height: clamp(5px, 0.72vw, 9px);
`

const Key = styled.span<{ $wide?: boolean }>`
  flex: ${({ $wide }) => ($wide ? 6 : 1)};
  background: rgba(231, 236, 245, 0.16);
  border-radius: 3px;
`

const Trackpad = styled.div`
  margin: clamp(5px, 0.8vw, 10px) auto 0;
  width: 26%;
  height: clamp(9px, 1.5vw, 20px);
  border-radius: 6px;
  background: rgba(231, 236, 245, 0.08);
`

const Note = styled.p<{ $still: boolean }>`
  margin: clamp(20px, 3vh, 40px) 0 0;
  max-width: 54ch;
  position: relative;
  opacity: ${({ $still }) => ($still ? 1 : 0)};
  color: ${({ theme }) => theme.colors.onDeepDim};
  font-size: clamp(15px, 1.4vw, 19px);
  line-height: 1.5;

  @media (max-height: 600px) and (orientation: landscape) {
    margin-top: 8px;
    max-width: min(54ch, 76vw);
    font-size: 13px;
    line-height: 1.35;
  }
`

const KEY_ROWS = [14, 14, 13] as const
const CHART_BARS = [38, 62, 48, 76, 58, 88, 67, 94, 72, 86, 78, 98] as const

export function LaptopScene() {
  const { t } = useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const mobileViewport = useMediaQuery('(max-width: 760px), (max-height: 600px)')
  const still = prefersReducedMotion

  useEffect(() => {
    const element = root.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        element.style.setProperty('--demo-play-state', entry.isIntersecting ? 'running' : 'paused')
      },
      { rootMargin: '180px 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (still || !root.current) return

    const ctx = gsap.context((self) => {
      const q = self.selector as (selector: string) => Element[]
      const mobile = mobileViewport
      const screen = q('[data-screen]')[0] as HTMLElement | undefined
      const strip = q('[data-strip]')[0] as HTMLElement | undefined
      const scrollDistance = () =>
        strip && screen ? -Math.max(0, strip.scrollHeight - screen.clientHeight) : 0

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: q('[data-stage]')[0],
          start: 'top top',
          end: mobile ? '+=150%' : '+=260%',
          scrub: mobile ? 0.4 : 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      timeline
        .fromTo(
          '[data-laptop]',
          { y: mobile ? 32 : 90, scale: mobile ? 0.96 : 0.92 },
          { y: 0, scale: 1, ease: 'none', duration: 1 },
          0,
        )
        .fromTo(
          '[data-lid]',
          { rotateX: mobile ? -70 : -88 },
          { rotateX: 0, ease: 'none', duration: 1.4 },
          0,
        )
        .fromTo('[data-base]', { rotateX: 84 }, { rotateX: 74, ease: 'none', duration: 1.4 }, 0)
        .to('[data-screen-off]', { opacity: 0, duration: 0.3 }, 1.3)
        .to('[data-screen-on]', { opacity: 1, duration: 0.3 }, 1.3)
        .to('[data-glow]', { opacity: 0.88, scale: 1.12, duration: 1 }, 1.3)
        .fromTo('[data-strip]', { y: 0 }, { y: scrollDistance, ease: 'none', duration: 2.6 }, 1.7)
        .fromTo('[data-note]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 2.0)
        .to('[data-laptop]', { scale: 0.9, y: -26, duration: 0.8 }, 4.2)
        .to('[data-caption]', { opacity: 0.4, duration: 0.8 }, 4.2)
    }, root)

    return () => ctx.revert()
  }, [mobileViewport, still])

  const tickerItems = [
    t('laptop.demo.ticker.delivery'),
    t('laptop.demo.ticker.review'),
    t('laptop.demo.ticker.sync'),
  ]

  return (
    <Scene ref={root}>
      <Stage $still={still} data-stage>
        <Glow data-glow />
        <SceneHeader $still={still} data-caption>
          <ChapterIndex aria-hidden="true">01</ChapterIndex>
          <Caption>{t('laptop.caption')}</Caption>
          <ChapterArrow aria-hidden="true">↓</ChapterArrow>
        </SceneHeader>

        <Perspective>
          <Laptop data-laptop>
            <Lid $still={still} data-lid>
              <Screen data-screen>
                <ScreenContent
                  $still={still}
                  data-screen-on
                  role="img"
                  aria-label={t('laptop.demo.ariaLabel')}
                >
                  <DemoPage data-strip data-demo-page aria-hidden="true">
                    <DemoTopbar>
                      <DemoBrand>{t('laptop.demo.brand')}</DemoBrand>
                      <DemoNav>
                        <span>{t('laptop.demo.nav.overview')}</span>
                        <span>{t('laptop.demo.nav.workflow')}</span>
                        <span>{t('laptop.demo.nav.signals')}</span>
                      </DemoNav>
                      <DemoStatus>{t('laptop.demo.status')}</DemoStatus>
                    </DemoTopbar>

                    <DemoHero>
                      <DemoEyebrow>{t('laptop.demo.hero.eyebrow')}</DemoEyebrow>
                      <DemoTitle>{t('laptop.demo.hero.title')}</DemoTitle>
                      <DemoLead>{t('laptop.demo.hero.lead')}</DemoLead>
                      <DemoAction>{t('laptop.demo.hero.action')}</DemoAction>
                    </DemoHero>

                    <DemoMetrics>
                      <DemoMetric>
                        <small>{t('laptop.demo.metrics.active')}</small>
                        <strong>24</strong>
                        <span>+ 18%</span>
                      </DemoMetric>
                      <DemoMetric>
                        <small>{t('laptop.demo.metrics.review')}</small>
                        <strong>06</strong>
                        <span>3 → 1</span>
                      </DemoMetric>
                      <DemoMetric>
                        <small>{t('laptop.demo.metrics.velocity')}</small>
                        <strong>1.8×</strong>
                        <span>+ 0.4</span>
                      </DemoMetric>
                    </DemoMetrics>

                    <DemoPanel>
                      <DemoSectionHead>
                        <div>
                          <p>{t('laptop.demo.overview.eyebrow')}</p>
                          <h4>{t('laptop.demo.overview.title')}</h4>
                        </div>
                        <span>{t('laptop.demo.overview.period')}</span>
                      </DemoSectionHead>
                      <DemoChart>
                        {CHART_BARS.map((height, index) => (
                          <ChartBar key={height + index} $height={height} $delay={index * -0.18} />
                        ))}
                      </DemoChart>
                    </DemoPanel>

                    <DemoTicker>
                      <TickerTrack>
                        {[...tickerItems, ...tickerItems].map((item, index) => (
                          <span key={`${item}-${index}`}>{item}</span>
                        ))}
                      </TickerTrack>
                    </DemoTicker>

                    <DemoWorkflow>
                      <DemoSectionHead>
                        <div>
                          <p>{t('laptop.demo.workflow.eyebrow')}</p>
                          <h4>{t('laptop.demo.workflow.title')}</h4>
                        </div>
                        <span>{t('laptop.demo.workflow.meta')}</span>
                      </DemoSectionHead>
                      <WorkflowGrid>
                        <WorkflowColumn>
                          <p>{t('laptop.demo.workflow.columns.active')}</p>
                          <WorkflowCard $accent $delay={-0.8}>
                            <strong>{t('laptop.demo.workflow.cards.discovery')}</strong>
                            <span />
                            <span />
                          </WorkflowCard>
                          <WorkflowCard $delay={-2.1}>
                            <strong>{t('laptop.demo.workflow.cards.content')}</strong>
                            <span />
                            <span />
                          </WorkflowCard>
                        </WorkflowColumn>
                        <WorkflowColumn>
                          <p>{t('laptop.demo.workflow.columns.review')}</p>
                          <WorkflowCard $delay={-1.4}>
                            <strong>{t('laptop.demo.workflow.cards.prototype')}</strong>
                            <span />
                            <span />
                          </WorkflowCard>
                        </WorkflowColumn>
                        <WorkflowColumn>
                          <p>{t('laptop.demo.workflow.columns.ready')}</p>
                          <WorkflowCard $accent $delay={-2.8}>
                            <strong>{t('laptop.demo.workflow.cards.release')}</strong>
                            <span />
                            <span />
                          </WorkflowCard>
                        </WorkflowColumn>
                      </WorkflowGrid>
                    </DemoWorkflow>

                    <DemoSignals>
                      <DemoSectionHead>
                        <div>
                          <p>{t('laptop.demo.signals.eyebrow')}</p>
                          <h4>{t('laptop.demo.signals.title')}</h4>
                        </div>
                      </DemoSectionHead>
                      <SignalGrid>
                        {(['priority', 'handoff', 'momentum'] as const).map((key, index) => (
                          <SignalCard key={key}>
                            <span>0{index + 1}</span>
                            <strong>{t(`laptop.demo.signals.items.${key}.title` as const)}</strong>
                            <p>{t(`laptop.demo.signals.items.${key}.body` as const)}</p>
                          </SignalCard>
                        ))}
                      </SignalGrid>
                    </DemoSignals>

                    <DemoClosing>
                      <h4>{t('laptop.demo.closing.title')}</h4>
                      <span>{t('laptop.demo.closing.action')} →</span>
                    </DemoClosing>
                  </DemoPage>
                </ScreenContent>
                <ScreenOff $still={still} data-screen-off>
                  <span>ilyakav.</span>
                </ScreenOff>
              </Screen>
            </Lid>

            <Hinge />

            <Base $still={still} data-base>
              {KEY_ROWS.map((count, rowIndex) => (
                <KeyRow key={rowIndex}>
                  {Array.from({ length: count }, (_, keyIndex) => (
                    <Key key={keyIndex} />
                  ))}
                </KeyRow>
              ))}
              <KeyRow>
                <Key />
                <Key $wide />
                <Key />
              </KeyRow>
              <Trackpad />
            </Base>
          </Laptop>
        </Perspective>

        <Note $still={still} data-note>
          {t('laptop.note')}
        </Note>
      </Stage>
    </Scene>
  )
}
