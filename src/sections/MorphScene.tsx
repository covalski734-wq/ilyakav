import { useLayoutEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { gsap } from '../lib/gsap'
import { grayscaleMedia } from '../theme/GlobalStyle'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'

const Scene = styled.div`
  position: relative;
`

const Stage = styled.div<{ $still: boolean }>`
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: clamp(20px, 4vw, 64px);
  padding: clamp(80px, 13vh, 116px) ${({ theme }) => theme.layout.pagePadding} clamp(26px, 6vh, 52px);
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.xl};
  position: relative;

  ${({ $still }) =>
    $still &&
    css`
      height: auto;
      overflow: visible;
      padding-top: clamp(44px, 10vw, 76px);
      padding-bottom: clamp(44px, 10vw, 76px);
    `}

  @media (max-width: 760px) {
    flex-direction: column;
    text-align: left;
  }
`

const CopyCol = styled.div`
  position: relative;
  z-index: 2;
  flex: 0 1 min(38ch, 40%);
`

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.serif};
  font-weight: 400;
  font-size: clamp(32px, 4.6vw, 66px);
  line-height: 1;
  letter-spacing: -0.02em;
  margin-bottom: 18px;
  max-width: 15ch;
`

const Copy = styled.p`
  font-size: clamp(16px, 1.35vw, 19px);
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.textDim};
  max-width: 40ch;
`

const FrameWrap = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  align-self: stretch;
`

const Halo = styled.div`
  position: absolute;
  width: 110%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: radial-gradient(circle, ${({ theme }) => theme.colors.accentSoft}, transparent 70%);
  filter: blur(24px);
  pointer-events: none;
`

/**
 * The frame GSAP resizes from a 16:10 desktop viewport into a 1:2 phone.
 * When motion is reduced it simply renders as the phone.
 */
const Frame = styled.div<{ $still: boolean }>`
  ${grayscaleMedia};
  width: ${({ $still }) => ($still ? 'min(300px, 74vw)' : 'min(760px, 80vw)')};
  aspect-ratio: ${({ $still }) => ($still ? '9 / 18' : '16 / 10')};
  max-height: 100%;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  padding: 12px;
  position: relative;
  box-shadow: ${({ theme }) => theme.shadows.m};
`

const FrameInner = styled.div`
  height: 100%;
  overflow: hidden;
  border-radius: 14px;
  background: linear-gradient(
    150deg,
    ${({ theme }) => theme.colors.surface2},
    ${({ theme }) => theme.colors.accentSoft}
  );
  display: flex;
  align-items: flex-end;
  padding: 14px;

  span {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textDim};
  }
`

export function MorphScene() {
  const { t } = useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const still = usePrefersReducedMotion()
  const [isPhone, setIsPhone] = useState(false)

  useLayoutEffect(() => {
    if (still || !root.current) return

    const ctx = gsap.context((self) => {
      const q = self.selector as (sel: string) => Element[]
      const frame = q('[data-frame]')[0] as HTMLElement | undefined
      if (!frame) return

      const mobile = window.innerWidth < 760
      const stageWidth = () => frame.parentElement?.clientWidth || window.innerWidth
      const desktopWidth = () => Math.min(mobile ? 420 : 900, stageWidth() * (mobile ? 0.9 : 0.82))
      const phoneWidth = () => Math.min(mobile ? 190 : 300, stageWidth() * (mobile ? 0.46 : 0.34))

      // GSAP drives width/height directly, so the CSS aspect-ratio has to step aside
      frame.style.aspectRatio = 'auto'

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: q('[data-stage]')[0],
          start: 'top top',
          end: mobile ? '+=170%' : '+=200%',
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setIsPhone(self.progress > 0.55),
        },
      })

      timeline.fromTo(
        frame,
        { width: desktopWidth, height: () => desktopWidth() * 0.625 },
        { width: phoneWidth, height: () => phoneWidth() * 2, ease: 'none', duration: 1 },
        0,
      )
    }, root)

    return () => ctx.revert()
  }, [still])

  const phone = still || isPhone

  return (
    <Scene ref={root}>
      <Stage $still={still} data-stage>
        <CopyCol>
          <Title>{t('morph.title')}</Title>
          <Copy>{phone ? t('morph.mobileCopy') : t('morph.desktopCopy')}</Copy>
        </CopyCol>

        <FrameWrap>
          <Halo />
          <Frame $still={still} data-frame>
            <FrameInner>
              <span>{phone ? t('morph.mobileLabel') : t('morph.desktopLabel')}</span>
            </FrameInner>
          </Frame>
        </FrameWrap>
      </Stage>
    </Scene>
  )
}
