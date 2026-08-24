import { useLayoutEffect, useRef } from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { gsap } from '../lib/gsap'
import { grayscaleMedia } from '../theme/GlobalStyle'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'

const Scene = styled.div`
  position: relative;
`

/**
 * Pinned stage. GSAP scrubs the lid open and scrolls a page strip inside the screen;
 * with reduced motion it collapses to a normal auto-height block with the lid already open.
 */
const Stage = styled.div<{ $still: boolean }>`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
  padding: clamp(84px, 14vh, 120px) ${({ theme }) => theme.layout.pagePadding} clamp(30px, 7vh, 58px);
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};

  ${({ $still }) =>
    $still &&
    css`
      height: auto;
      overflow: visible;
      padding-top: clamp(44px, 10vw, 76px);
      padding-bottom: clamp(44px, 10vw, 76px);
    `}
`

const Glow = styled.div`
  position: absolute;
  width: min(1000px, 88vw);
  height: min(560px, 62vh);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(224, 117, 76, 0.32), transparent 70%);
  filter: blur(40px);
  pointer-events: none;
`

const Caption = styled.p`
  margin: 0 0 clamp(18px, 3vh, 34px);
  font-size: 15px;
  color: ${({ theme }) => theme.colors.onDeepDim};
  position: relative;
`

const Perspective = styled.div`
  perspective: 1900px;
  width: min(900px, 84vw, 44vh);
  position: relative;
`

const Laptop = styled.div`
  transform-style: preserve-3d;
  position: relative;
`

const Lid = styled.div<{ $still: boolean }>`
  transform-origin: 50% 100%;
  transform: ${({ $still }) => ($still ? 'rotateX(0deg)' : 'rotateX(-88deg)')};
  background: #2c241d;
  border-radius: 22px 22px 6px 6px;
  padding: 12px 12px 18px;
  box-shadow: ${({ theme }) => theme.shadows.l};
`

const Screen = styled.div`
  ${grayscaleMedia};
  position: relative;
  border-radius: 14px;
  aspect-ratio: 16 / 10;
  background: #0d0a08;
`

const ScreenContent = styled.div<{ $still: boolean }>`
  position: absolute;
  inset: 0;
  opacity: ${({ $still }) => ($still ? 1 : 0)};
`

/** Tall strip of "page" that scrolls behind the screen bezel. */
const Strip = styled.div`
  width: 100%;
  height: 300%;
  background:
    repeating-linear-gradient(180deg, rgba(246, 239, 228, 0.09) 0 3%, rgba(246, 239, 228, 0.03) 3% 6%),
    repeating-linear-gradient(135deg, rgba(224, 117, 76, 0.16) 0 22px, transparent 22px 44px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 6% 5%;

  span {
    font-size: 12px;
    color: rgba(246, 239, 228, 0.72);
  }

  span:nth-child(2) {
    color: rgba(246, 239, 228, 0.5);
  }
`

const ScreenOff = styled.div<{ $still: boolean }>`
  position: absolute;
  inset: 0;
  background: linear-gradient(140deg, #1b1510, #0d0a08);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $still }) => ($still ? 0 : 1)};

  span {
    font-family: ${({ theme }) => theme.fonts.serif};
    font-size: clamp(14px, 1.6vw, 22px);
    color: rgba(246, 239, 228, 0.26);
  }
`

const Hinge = styled.div`
  height: 6px;
  background: #241d17;
  border-radius: 0 0 4px 4px;
  transform: translateY(-2px);
`

const Base = styled.div<{ $still: boolean }>`
  transform-origin: 50% 0;
  transform: ${({ $still }) => ($still ? 'rotateX(74deg)' : 'rotateX(84deg)')};
  background: linear-gradient(180deg, #3a2f26, #221b15);
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
  background: rgba(246, 239, 228, 0.15);
  border-radius: 3px;
`

const Trackpad = styled.div`
  margin: clamp(5px, 0.8vw, 10px) auto 0;
  width: 26%;
  height: clamp(9px, 1.5vw, 20px);
  border-radius: 6px;
  background: rgba(246, 239, 228, 0.08);
`

const Note = styled.p<{ $still: boolean }>`
  margin: clamp(20px, 3vh, 40px) 0 0;
  font-size: clamp(15px, 1.4vw, 19px);
  color: ${({ theme }) => theme.colors.onDeepDim};
  max-width: 48ch;
  position: relative;
  opacity: ${({ $still }) => ($still ? 1 : 0)};
`

const KEY_ROWS = [14, 14, 13] as const

export function LaptopScene() {
  const { t } = useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const still = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (still || !root.current) return

    const ctx = gsap.context((self) => {
      const q = self.selector as (sel: string) => Element[]
      const mobile = window.innerWidth < 760

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: q('[data-stage]')[0],
          start: 'top top',
          end: mobile ? '+=200%' : '+=260%',
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      timeline
        .fromTo('[data-laptop]', { y: 90, scale: 0.92 }, { y: 0, scale: 1, ease: 'none', duration: 1 }, 0)
        .fromTo('[data-lid]', { rotateX: -88 }, { rotateX: 0, ease: 'none', duration: 1.4 }, 0)
        .fromTo('[data-base]', { rotateX: 84 }, { rotateX: 74, ease: 'none', duration: 1.4 }, 0)
        .to('[data-screen-off]', { opacity: 0, duration: 0.3 }, 1.3)
        .to('[data-screen-on]', { opacity: 1, duration: 0.3 }, 1.3)
        .to('[data-glow]', { opacity: 1.15, scale: 1.12, duration: 1 }, 1.3)
        .fromTo('[data-strip]', { y: '0%' }, { y: '-62%', ease: 'none', duration: 2.6 }, 1.7)
        .fromTo('[data-note]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 2.0)
        .to('[data-laptop]', { scale: 0.9, y: -26, duration: 0.8 }, 4.2)
        .to('[data-caption]', { opacity: 0.4, duration: 0.8 }, 4.2)
    }, root)

    return () => ctx.revert()
  }, [still])

  return (
    <Scene ref={root}>
      <Stage $still={still} data-stage>
        <Glow data-glow />
        <Caption data-caption>{t('laptop.caption')}</Caption>

        <Perspective>
          <Laptop data-laptop>
            <Lid $still={still} data-lid>
              <Screen>
                <ScreenContent $still={still} data-screen-on>
                  <Strip data-strip>
                    <span>{t('laptop.screenTop')}</span>
                    <span>{t('laptop.screenMid')}</span>
                    <span>{t('laptop.screenBottom')}</span>
                  </Strip>
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
                <Key />
                <Key $wide />
                <Key />
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
