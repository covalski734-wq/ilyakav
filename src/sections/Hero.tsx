import { useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { HERO_VIDEO, ROUTES, SECTION_IDS } from '../config/site'
import { breathe, drift } from '../theme/GlobalStyle'
import { GhostButton, PrimaryButton } from '../components/ui/primitives'
import { useMediaQuery, usePrefersReducedMotion } from '../hooks/useMediaQuery'

const Wrapper = styled.section`
  position: relative;
  min-height: 100svh;
  /* pulls the sticky header on top of the video */
  margin-top: calc(-92px - env(safe-area-inset-top));
  padding: calc(116px + env(safe-area-inset-top)) ${({ theme }) => theme.layout.pagePadding}
    clamp(38px, 6vh, 68px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  isolation: isolate;
  background: #07090e;
  color: #f7f9fc;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.14;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 76px 76px;
    mask-image: linear-gradient(100deg, #000, transparent 72%);
    -webkit-mask-image: linear-gradient(100deg, #000, transparent 72%);
  }

  @media (max-width: 760px) {
    /* Keep a deliberate peek of the next chapter on tall phones, while short
       screens can grow naturally when translated copy needs more room. */
    min-height: min(720px, 100svh);
    margin-top: calc(-78px - env(safe-area-inset-top));
    padding: calc(102px + env(safe-area-inset-top)) clamp(16px, 5vw, 20px) 34px;
    justify-content: flex-end;

    &::after {
      opacity: 0.1;
      background-size: 44px 44px;
      mask-image: linear-gradient(to bottom, #000, transparent 72%);
      -webkit-mask-image: linear-gradient(to bottom, #000, transparent 72%);
    }
  }
`

/** Fades up from the gradient fallback once the first frames are decoded. */
const Video = styled.video<{ $focus: string; $ready: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: ${({ $focus }) => $focus};
  transform: scale(1.08);
  transform-origin: 52% 44%;
  filter: saturate(0.42) contrast(1.1) brightness(0.84);
  opacity: ${({ $ready }) => ($ready ? 1 : 0)};
  transition: opacity 1.1s ease;

  @media (max-width: 760px) {
    object-position: 68% center;
    transform: scale(1.04);
    filter: saturate(0.34) contrast(1.12) brightness(0.72);
  }
`

const Fallback = styled.div<{ $hidden: boolean }>`
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  transition: opacity 1.1s ease;
`

const DriftingGlow = styled.div`
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(40% 46% at 72% 38%, rgba(99, 91, 255, 0.58), transparent 68%),
    radial-gradient(30% 36% at 84% 64%, rgba(112, 205, 255, 0.28), transparent 70%),
    radial-gradient(46% 46% at 62% 18%, rgba(170, 165, 255, 0.2), transparent 72%);
  filter: blur(28px);
  animation: ${drift} 26s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Scrim = styled.div<{ $variant: 'side' | 'warm' | 'bottom' | 'flat' }>`
  position: absolute;
  pointer-events: none;
  inset: 0;

  ${({ $variant }) => {
    switch ($variant) {
      case 'side':
        return css`
          background: linear-gradient(
            100deg,
            rgba(7, 9, 14, 0.97) 0%,
            rgba(7, 9, 14, 0.78) 34%,
            rgba(7, 9, 14, 0.14) 62%,
            transparent 78%
          );

          @media (max-width: 760px) {
            background: linear-gradient(
              to bottom,
              rgba(7, 9, 14, 0.93) 0%,
              rgba(7, 9, 14, 0.82) 54%,
              rgba(7, 9, 14, 0.96) 100%
            );
          }
        `
      case 'warm':
        return css`
          background: radial-gradient(60% 70% at 74% 46%, rgba(99, 91, 255, 0.24), transparent 72%);
          mix-blend-mode: soft-light;
        `
      case 'bottom':
        return css`
          inset: auto 0 0 0;
          height: 52%;
          background: linear-gradient(
            to top,
            rgba(7, 9, 14, 0.9),
            rgba(7, 9, 14, 0.34) 48%,
            transparent
          );
        `
      default:
        return css`
          background: linear-gradient(160deg, rgba(7, 9, 14, 0.2), rgba(7, 9, 14, 0.82));
        `
    }
  }}
`

const Inner = styled.div`
  position: relative;
  z-index: 1;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  width: 100%;

  @media (max-width: 760px) {
    margin: 0;
    padding-top: clamp(26px, 7vh, 58px);
  }
`

/** Staggered entrance for the three hero blocks. */
const Reveal = styled.div<{ $delay: number; $still: boolean }>`
  ${({ $delay, $still }) =>
    $still
      ? css`
          opacity: 1;
        `
      : css`
          opacity: 0;
          transform: translateY(26px);
          animation: hero-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${$delay}s forwards;

          @keyframes hero-in {
            to {
              opacity: 1;
              transform: none;
            }
          }
        `}
`

const Badge = styled.p`
  position: relative;
  margin: 0 0 clamp(18px, 2.6vw, 28px);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px 9px 11px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid rgba(247, 249, 252, 0.16);
  background: rgba(9, 12, 18, 0.48);
  backdrop-filter: blur(12px);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  line-height: 1.35;
  color: rgba(247, 249, 252, 0.82);

  @media (max-width: 380px) {
    font-size: 11px;
  }
`

const Pulse = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.status};
  box-shadow: 0 0 0 4px rgba(85, 214, 160, 0.1);
  animation: ${breathe} 2.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Title = styled.h1`
  position: relative;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 700;
  font-size: min(clamp(48px, 7.4vw, 122px), 13vh);
  line-height: 0.94;
  letter-spacing: -0.055em;
  max-width: 14ch;
  width: fit-content;
  color: #f8f9fc;

  @media (max-width: 760px) {
    font-size: clamp(39px, 12vw, 54px);
    line-height: 0.98;
    letter-spacing: -0.05em;
    max-width: 11ch;
  }
`

const Bottom = styled.div`
  display: grid;
  grid-template-columns: minmax(min(100%, 290px), 42ch) auto;
  justify-content: space-between;
  gap: clamp(20px, 4vw, 60px);
  align-items: end;
  margin-top: clamp(24px, 4vw, 48px);

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }

  @media (max-width: 760px) {
    gap: 22px;
    margin-top: 24px;
  }
`

const Lead = styled.p`
  position: relative;
  font-size: clamp(16px, 1.35vw, 20px);
  line-height: 1.55;
  color: rgba(231, 236, 245, 0.8);
  max-width: 42ch;

  @media (max-width: 760px) {
    font-size: 15px;
    line-height: 1.55;
    max-width: 36ch;
  }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;

    > a:first-of-type {
      width: 100%;
      min-height: 52px;
    }

    > a:last-of-type {
      justify-content: flex-start;
      width: fit-content;
      padding: 10px 2px;
      background: transparent;

      &::after {
        content: '\\2192';
        margin-left: 8px;
      }
    }
  }
`

const SlotNote = styled.p`
  flex: 1 1 22ch;
  min-width: 18ch;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  line-height: 1.45;
  color: rgba(231, 236, 245, 0.58);
`

export function Hero() {
  const { t } = useTranslation()
  const wrapperRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const still = usePrefersReducedMotion()
  const mobileViewport = useMediaQuery('(max-width: 760px)')
  const saveData =
    typeof navigator !== 'undefined' &&
    Boolean(
      (
        navigator as Navigator & {
          connection?: { saveData?: boolean }
        }
      ).connection?.saveData,
    )
  const useHeroVideo = !still && !mobileViewport && !saveData

  useEffect(() => {
    if (!useHeroVideo) {
      setVideoReady(false)
      return
    }

    const video = videoRef.current
    const wrapper = wrapperRef.current
    if (!video || !wrapper) return

    const setPlayback = (visible: boolean) => {
      if (!visible) {
        video.pause()
        return
      }

      const play = video.play()
      if (play && typeof play.catch === 'function') play.catch(() => undefined)
    }

    if (typeof IntersectionObserver === 'undefined') {
      setPlayback(true)
      return () => video.pause()
    }

    const observer = new IntersectionObserver(([entry]) => setPlayback(entry.isIntersecting), {
      threshold: 0.08,
    })
    observer.observe(wrapper)

    return () => {
      observer.disconnect()
      video.pause()
    }
  }, [useHeroVideo])

  return (
    <Wrapper ref={wrapperRef} id={SECTION_IDS.top}>
      {/* the gradient holds the frame until the loop is decoded, then cross-fades out */}
      <Fallback $hidden={useHeroVideo && videoReady}>
        <DriftingGlow />
        <Scrim $variant="flat" />
      </Fallback>

      {useHeroVideo && (
        <Video
          ref={videoRef}
          $focus={HERO_VIDEO.focus}
          $ready={videoReady}
          src={HERO_VIDEO.src}
          poster={HERO_VIDEO.poster || undefined}
          playsInline
          muted
          loop
          autoPlay
          preload="metadata"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
        />
      )}

      <Scrim $variant="side" />
      <Scrim $variant="warm" />
      <Scrim $variant="bottom" />

      <Inner>
        <Reveal $delay={0} $still={still}>
          <Badge>
            <Pulse />
            <span>{t('hero.badge')}</span>
          </Badge>
        </Reveal>

        <Reveal $delay={0.1} $still={still}>
          <Title>
            <span>{t('hero.title')}</span>
          </Title>
        </Reveal>

        <Reveal $delay={0.2} $still={still}>
          <Bottom>
            <Lead>
              <span>{t('hero.lead')}</span>
            </Lead>
            <Actions>
              <PrimaryButton href={ROUTES.contact}>{t('actions.startProject')}</PrimaryButton>
              <GhostButton href={`#${SECTION_IDS.work}`}>{t('actions.viewWork')}</GhostButton>
              {useHeroVideo && !videoReady && <SlotNote>{t('hero.videoNote')}</SlotNote>}
            </Actions>
          </Bottom>
        </Reveal>
      </Inner>
    </Wrapper>
  )
}
