import { useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { HERO_VIDEO, ROUTES, SECTION_IDS } from '../config/site'
import { breathe, drift } from '../theme/GlobalStyle'
import { GhostButton, PrimaryButton } from '../components/ui/primitives'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'

const Wrapper = styled.section`
  position: relative;
  min-height: 100svh;
  /* pulls the sticky header on top of the video */
  margin-top: -92px;
  padding: 92px ${({ theme }) => theme.layout.pagePadding} clamp(30px, 5vh, 56px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  background: #181310;
  color: #f8f3ec;
`

/** Fades up from the gradient fallback once the first frames are decoded. */
const Video = styled.video<{ $focus: string; $ready: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: ${({ $focus }) => $focus};
  transform: scale(1.13);
  transform-origin: 52% 44%;
  opacity: ${({ $ready }) => ($ready ? 1 : 0)};
  transition: opacity 1.1s ease;
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
    radial-gradient(40% 46% at 72% 38%, rgba(224, 117, 76, 0.55), transparent 68%),
    radial-gradient(30% 36% at 84% 64%, rgba(242, 221, 210, 0.34), transparent 70%),
    radial-gradient(46% 46% at 62% 18%, rgba(255, 196, 150, 0.2), transparent 72%);
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
            rgba(24, 19, 16, 0.94) 0%,
            rgba(24, 19, 16, 0.7) 30%,
            rgba(24, 19, 16, 0.12) 58%,
            transparent 78%
          );
        `
      case 'warm':
        return css`
          background: radial-gradient(60% 70% at 74% 46%, rgba(194, 84, 47, 0.28), transparent 72%);
          mix-blend-mode: soft-light;
        `
      case 'bottom':
        return css`
          inset: auto 0 0 0;
          height: 52%;
          background: linear-gradient(
            to top,
            rgba(20, 15, 12, 0.88),
            rgba(20, 15, 12, 0.34) 48%,
            transparent
          );
        `
      default:
        return css`
          background: linear-gradient(160deg, rgba(24, 19, 16, 0.2), rgba(24, 19, 16, 0.75));
        `
    }
  }}
`

const Inner = styled.div`
  position: relative;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  width: 100%;
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
  margin: 0 0 clamp(16px, 2.6vw, 26px);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 18px 9px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: rgba(248, 243, 236, 0.14);
  font-size: 14px;
  color: rgba(248, 243, 236, 0.88);
`

const Pulse = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  animation: ${breathe} 2.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Title = styled.h1`
  position: relative;
  isolation: isolate;
  font-family: ${({ theme }) => theme.fonts.serif};
  font-weight: 400;
  font-size: min(clamp(40px, 8.6vw, 140px), 13vh);
  line-height: 1.04;
  letter-spacing: -0.02em;
  max-width: 16ch;
  width: fit-content;
  color: #fdfbf8;

  /* local darkening so the headline stays readable over any frame of the loop */
  &::before {
    content: '';
    position: absolute;
    z-index: 0;
    inset: -0.22em -1.6em -0.24em -1.2em;
    background: radial-gradient(
      70% 62% at 34% 50%,
      rgba(20, 15, 12, 0.92),
      rgba(20, 15, 12, 0.74) 52%,
      rgba(20, 15, 12, 0.34) 78%,
      transparent 100%
    );
    pointer-events: none;
  }

  span {
    position: relative;
    z-index: 1;
  }
`

const Bottom = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: clamp(20px, 4vw, 60px);
  align-items: end;
  margin-top: clamp(24px, 4vw, 48px);
`

const Lead = styled.p`
  position: relative;
  isolation: isolate;
  font-size: clamp(16px, 1.35vw, 20px);
  line-height: 1.55;
  color: rgba(248, 243, 236, 0.86);
  max-width: 42ch;

  &::before {
    content: '';
    position: absolute;
    z-index: 0;
    inset: -0.7em -1.6em -0.7em -1em;
    background: radial-gradient(
      72% 70% at 32% 50%,
      rgba(20, 15, 12, 0.86),
      rgba(20, 15, 12, 0.6) 56%,
      transparent 100%
    );
    pointer-events: none;
  }

  span {
    position: relative;
    z-index: 1;
  }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`

const SlotNote = styled.p`
  flex: 1 1 22ch;
  min-width: 18ch;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(248, 243, 236, 0.6);
`

export function Hero() {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const still = usePrefersReducedMotion()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const play = video.play()
    if (play && typeof play.catch === 'function') play.catch(() => undefined)
  }, [videoReady])

  return (
    <Wrapper id={SECTION_IDS.top}>
      {/* the gradient holds the frame until the loop is decoded, then cross-fades out */}
      <Fallback $hidden={videoReady}>
        <DriftingGlow />
        <Scrim $variant="flat" />
      </Fallback>

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
              {!videoReady && <SlotNote>{t('hero.videoNote')}</SlotNote>}
            </Actions>
          </Bottom>
        </Reveal>
      </Inner>
    </Wrapper>
  )
}
