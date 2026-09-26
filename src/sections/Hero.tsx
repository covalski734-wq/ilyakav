import { useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { ROUTES, SECTION_IDS } from '../config/site'
import { Container, PrimaryButton } from '../components/ui/primitives'
import { HeroRibbon } from './HeroRibbon'
import { ScrollTrigger } from '../lib/gsap'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { getHeroScrollLayout } from './heroScrollLayout'

// The scroll runway belongs to document layout, rather than a dynamically
// inserted pin spacer. Following pinned sections always measure its full height.
const Track = styled.div`
  position: relative;
  height: 175svh;
  margin-top: calc(-92px - env(safe-area-inset-top));
  @media (max-width: 760px) {
    height: 140svh;
    margin-top: calc(-78px - env(safe-area-inset-top));
  }
  @media (max-height: 600px) and (max-width: 1020px) {
    height: auto;
    margin-top: calc(-78px - env(safe-area-inset-top));
  }
  @media (prefers-reduced-motion: reduce) { height: auto; }
`

const Wrapper = styled.section`
  position: sticky;
  top: 0;
  isolation: isolate;
  overflow: hidden;
  min-height: 100svh;
  padding: calc(116px + env(safe-area-inset-top)) ${({ theme }) => theme.layout.pagePadding} 0;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.bg};
  border-radius: 0 0 32px 32px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  display: flex;
  > div { display: flex; flex-direction: column; }
  @media (max-width: 760px) {
    padding: calc(86px + env(safe-area-inset-top)) clamp(20px, 5.6vw, 36px) 0;
    border-radius: 0 0 24px 24px;
    > div { max-width: 520px; }
  }
  @media (max-height: 600px) and (min-width: 761px) and (max-width: 1020px) {
    padding-top: calc(86px + env(safe-area-inset-top));
  }
`
const Layout = styled.div`
  position: relative;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 20px;
  padding: clamp(32px, 6vh, 76px) 0;
  align-items: center;
  align-content: center;
  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto minmax(0, 1fr);
    row-gap: 14px;
    padding: 10px 0 0;
    align-content: start;
  }
  @media (max-height: 600px) and (min-width: 761px) and (max-width: 1020px) {
    padding: 16px 0 24px;
  }
`
const Title = styled.h1`
  position: relative;
  z-index: 2;
  grid-column: 1;
  grid-row: 1;
  align-self: end;
  padding-bottom: 28px;
  max-width: 11ch;
  font-size: clamp(54px, 6.45vw, 98px);
  font-weight: 550;
  line-height: 1.035;
  letter-spacing: -.065em;
  text-wrap: initial;
  span { display: block; color: ${({ theme }) => theme.mode === 'light' ? theme.colors.accentInk : '#b8b1ff'}; }
  @media (max-width: 1000px) and (min-width: 761px) { font-size: clamp(48px, 6.5vw, 65px); }
  @media (max-width: 760px) {
    grid-row: 1;
    padding-bottom: 0;
    max-width: none;
    font-size: clamp(36px, 10.5vw, 62px);
    line-height: 1.04;
    letter-spacing: -.055em;
  }
  @media (max-height: 600px) and (min-width: 761px) and (max-width: 1020px) {
    font-size: clamp(34px, 5vw, 48px);
    padding-bottom: 16px;
  }
`
const Details = styled.div`
  position: relative;
  z-index: 2;
  grid-column: 1;
  grid-row: 2;
  align-self: start;
  min-width: 0;
`
const Lead = styled.p`
  max-width: 39ch;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: clamp(16px, 1.35vw, 19px);
  line-height: 1.65;
  [data-mobile-copy] { display: none; }
  @media (max-width: 760px) {
    max-width: 35ch;
    font-size: 15px;
    line-height: 1.5;
    [data-desktop-copy] { display: none; }
    [data-mobile-copy] { display: inline; }
  }
  @media (max-height: 600px) and (min-width: 761px) and (max-width: 1020px) { font-size: 14px; line-height: 1.5; }
`
const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 26px;
  margin-top: 30px;
  > a:first-child { gap: 24px; padding: 18px 24px; border-radius: 16px; }
  @media (max-width: 760px) {
    margin-top: 18px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px 22px;
    max-width: 380px;
    > a:first-child { min-height: 52px; padding: 13px 18px; font-size: 14px; gap: 14px; }
  }
  @media (max-width: 359px) { gap: 10px 16px; > a:first-child { padding: 13px 12px; gap: 8px; } }
  @media (max-height: 600px) and (min-width: 761px) and (max-width: 1020px) {
    margin-top: 18px;
    > a:first-child { padding: 12px 18px; font-size: 14px; }
  }
`
const More = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  font-size: 14px;
  text-underline-offset: 6px;
  &:hover { text-decoration: underline; }
  @media (max-width: 359px) { font-size: 13px; }
`
const Foot = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 22px 0 26px;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textDim};
  p:last-child { text-align: right; }
  @media (max-width: 760px) {
    font-size: 11px;
    line-height: 1.4;
    padding: 10px 0 max(14px, env(safe-area-inset-bottom));
    p:last-child { display: none; }
  }
  @media (max-height: 600px) and (min-width: 761px) and (max-width: 1020px) { display: none; }
`

export function Hero() {
  const { t } = useTranslation()
  const track = useRef<HTMLDivElement>(null)
  const scene = useRef<HTMLElement>(null)
  const reduced = usePrefersReducedMotion()
  useLayoutEffect(() => {
    const outer = track.current, inner = scene.current
    if (!outer || !inner) return
    let frame = 0, disposed = false
    const measure = () => {
      if (disposed) return
      // 100svh stays stable when a phone's address bar expands/collapses.
      const viewport = parseFloat(getComputedStyle(inner).minHeight) || document.documentElement.clientHeight
      const height = inner.offsetHeight
      const compact = window.matchMedia('(max-width: 760px), (max-height: 600px) and (max-width: 1020px)').matches
      const layout = getHeroScrollLayout(viewport, height, compact, reduced)
      const nextHeight = `${layout.trackHeight}px`
      if (outer.style.height !== nextHeight || outer.dataset.scrollLead !== String(layout.lead) || outer.dataset.scrollDistance !== String(layout.distance) || outer.dataset.scrollFinish !== String(layout.finish)) {
        outer.style.height = nextHeight
        outer.dataset.scrollDistance = String(layout.distance)
        outer.dataset.scrollFinish = String(layout.finish)
        outer.dataset.scrollLead = String(layout.lead)
        inner.style.top = `${-layout.lead}px`
        inner.style.position = layout.sticky ? 'sticky' : 'relative'
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => ScrollTrigger.refresh())
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(inner)
    window.addEventListener('resize', measure)
    document.fonts.ready.then(measure)
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [reduced])
  return <Track ref={track} id={SECTION_IDS.top} data-hero-track>
    <Wrapper ref={scene} aria-labelledby="hero-heading">
    <Container>
      <Layout>
        <Title id="hero-heading">{t('hero.title')}<span>{t('hero.titleAccent')}</span></Title>
        <Details>
          <Lead><span data-desktop-copy>{t('hero.lead')}</span><span data-mobile-copy>{t('hero.mobileLead')}</span></Lead>
          <Actions>
            <PrimaryButton href={ROUTES.contact}>{t('actions.startProject')}<span aria-hidden="true">↗</span></PrimaryButton>
            <More href={`#${SECTION_IDS.services}`}>{t('nav.services')}<span aria-hidden="true">↓</span></More>
          </Actions>
        </Details>
        <HeroRibbon />
      </Layout>
      <Foot>
        <p>{t('hero.signature')}</p>
        <p>{t('hero.facts.scopeNote')}</p>
      </Foot>
    </Container>
    </Wrapper>
  </Track>
}
