import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { gsap } from '../lib/gsap'
import { bindScrollTimeline } from '../lib/scrollTimeline'
import { ScrollTrack, StickyScene } from '../components/ui/ScrollScene'
import { useMediaQuery, usePrefersReducedMotion } from '../hooks/useMediaQuery'

const progressIn = keyframes`
  from { transform: scaleX(0.18); }
  to { transform: scaleX(1); }
`

const Scene = styled(ScrollTrack)`
  position: relative;
`

const Stage = styled.div<{ $still: boolean }>`
  height: clamp(540px, 72svh, 760px);
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: clamp(20px, 4vw, 64px);
  padding: 104px ${({ theme }) => theme.layout.pagePadding}
    clamp(24px, 4vh, 40px);
  background: ${({ theme }) => theme.colors.bg};
  border-radius: ${({ theme }) => theme.radii.xl};
  position: relative;

  ${({ $still }) =>
    $still &&
    css`
      height: auto;
      overflow: clip;
      padding-top: clamp(44px, 10vw, 76px);
      padding-bottom: clamp(44px, 10vw, 76px);
    `}

  @media (max-width: 760px) {
    padding-top: 88px;
    height: ${({ $still }) => $still ? 'auto' : 'clamp(600px, 78svh, 740px)'};
    flex-direction: column;
    text-align: left;
  }

  @media (max-height: 600px) and (orientation: landscape) {
    height: ${({ $still }) => $still ? 'auto' : '100svh'};
    gap: 20px;
    padding-top: 116px;
    padding-bottom: 22px;
  }
`

const CopyCol = styled.div`
  position: relative;
  z-index: 2;
  flex: 0 1 min(38ch, 40%);
  padding-top: clamp(20px, 4vh, 40px);

  @media (max-width: 760px) {
    flex: none;
    padding-top: 0;
  }
`

const Title = styled.h2`
  max-width: 15ch;
  margin-bottom: 18px;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 650;
  font-size: clamp(32px, 4.6vw, 66px);
  line-height: 1;
  letter-spacing: -0.045em;

  @media (max-width: 760px) {
    font-size: clamp(31px, 10vw, 44px);
  }
`

const Copy = styled.p`
  max-width: 42ch;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: clamp(16px, 1.35vw, 19px);
  line-height: 1.55;

  @media (max-width: 760px) {
    font-size: 15px;
  }
`

const FrameWrap = styled.div`
  position: relative;
  z-index: 2;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  align-self: stretch;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-bottom: 40px;
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

/** The shell morphs; the code-native UI inside responds through container queries. */
const Frame = styled.div<{ $still: boolean; $phone: boolean }>`
  width: ${({ $still, $phone }) =>
    $still ? ($phone ? 'min(300px, 74vw)' : 'min(760px, 80vw)') : 'min(760px, 80vw)'};
  aspect-ratio: ${({ $still, $phone }) => ($still && $phone ? '9 / 18' : '16 / 10')};
  max-width: 100%;
  max-height: 100%;
  padding: 12px;
  position: relative;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.m};

  @media (max-width: 760px) {
    padding: 8px;
  }
`

const FrameInner = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
  container-type: inline-size;
  border-radius: 14px;
  background: #eef1f6;
`

const ProductUi = styled.div`
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 22% minmax(0, 1fr);
  overflow: hidden;
  background: #f3f5f9;
  color: #121724;
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: clamp(1px, 1.5cqw, 13px);

  @container (max-width: 460px) {
    grid-template-columns: minmax(0, 1fr);
    padding-bottom: 11em;
  }
`

const ProductSidebar = styled.aside`
  min-width: 0;
  padding: 2.2em 1.8em;
  display: flex;
  flex-direction: column;
  background: #111827;
  color: #dbe2ef;

  @container (max-width: 460px) {
    position: absolute;
    z-index: 5;
    left: 0;
    right: 0;
    bottom: 0;
    height: 11em;
    padding: 1.35em 2.2em;
    display: block;
    border-top: 1px solid rgba(218, 226, 241, 0.12);
  }
`

const ProductBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8em;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 1.05em;
  font-weight: 700;

  span {
    width: 2em;
    height: 2em;
    border-radius: 0.65em 0.65em 0.65em 50%;
    display: block;
    background: linear-gradient(135deg, #746dff, #37c4ff);
    box-shadow: 0 0.8em 2.2em rgba(99, 91, 255, 0.32);
  }

  @container (max-width: 460px) {
    display: none;
  }
`

const ProductWorkspace = styled.p`
  margin: 4em 0 1.3em;
  color: #6f7b91;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.08em;

  @container (max-width: 460px) {
    display: none;
  }
`

const ProductNav = styled.nav`
  display: grid;
  gap: 0.7em;

  span {
    min-width: 0;
    padding: 1em 1.1em;
    border-radius: 0.8em;
    display: flex;
    align-items: center;
    gap: 0.8em;
    color: #8f9aae;
    font-size: 0.8em;
    white-space: nowrap;

    &::before {
      content: '';
      width: 0.7em;
      height: 0.7em;
      flex: none;
      border: 1px solid currentColor;
      border-radius: 0.24em;
    }

    &:first-child {
      color: #fff;
      background: rgba(116, 109, 255, 0.2);

      &::before {
        border-color: #7c76ff;
        background: #7c76ff;
      }
    }
  }

  @container (max-width: 460px) {
    height: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1em;

    span {
      padding: 0.8em 0.3em;
      flex-direction: column;
      justify-content: center;
      gap: 0.6em;
      font-size: 0.9em;

      &::before {
        width: 1.2em;
        height: 1.2em;
      }
    }
  }
`

const ProductAccount = styled.div`
  margin-top: auto;
  padding-top: 2em;
  border-top: 1px solid rgba(219, 226, 239, 0.1);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.9em;
  align-items: center;

  > span {
    width: 2.5em;
    height: 2.5em;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: #29344a;
    color: #fff;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.72em;
  }

  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 0.72em;
  }

  small {
    margin-top: 0.35em;
    color: #748197;
    font-size: 0.62em;
  }

  @container (max-width: 460px) {
    display: none;
  }
`

const ProductMain = styled.main`
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: radial-gradient(circle at 92% 4%, rgba(99, 91, 255, 0.1), transparent 27em), #f4f6fa;
`

const ProductTopbar = styled.div`
  height: 6.4em;
  padding: 1.3em 2.4em;
  border-bottom: 1px solid #dce1eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1em;
  background: rgba(255, 255, 255, 0.78);

  @container (max-width: 460px) {
    height: 9em;
    padding: 1.8em 2.2em;
  }
`

const Search = styled.span`
  width: min(20em, 42%);
  padding: 0.95em 1.2em;
  border: 1px solid #dce1eb;
  border-radius: 0.9em;
  color: #929bac;
  background: #fff;
  font-size: 0.72em;

  @container (max-width: 460px) {
    width: 3.2em;
    height: 3.2em;
    padding: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    color: transparent;

    &::after {
      content: '\2315';
      color: #667085;
      font-size: 1.4em;
    }
  }
`

const NewTask = styled.span`
  padding: 1em 1.35em;
  border-radius: 0.9em;
  background: #635bff;
  color: #fff;
  font-size: 0.72em;
  font-weight: 700;

  @container (max-width: 460px) {
    margin-left: auto;
    padding: 1.1em 1.4em;
    font-size: 0.85em;
  }
`

const ProductContent = styled.div`
  height: calc(100% - 6.4em);
  padding: 3em;
  overflow: hidden;

  @container (max-width: 460px) {
    height: calc(100% - 9em);
    padding: 2.8em 2.2em 3em;
  }
`

const ProductEyebrow = styled.p`
  margin: 0 0 0.8em;
  color: #635bff;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.66em;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`

const ProductTitle = styled.h3`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 3em;
  line-height: 1;
  letter-spacing: -0.055em;

  @container (max-width: 460px) {
    font-size: 4.5em;
  }
`

const ProductLead = styled.p`
  max-width: 48ch;
  margin: 1em 0 0;
  color: #737d90;
  font-size: 0.82em;
  line-height: 1.5;

  @container (max-width: 460px) {
    max-width: 34ch;
    font-size: 1.05em;
  }
`

const Stats = styled.div`
  margin-top: 2.8em;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1em;

  @container (max-width: 460px) {
    margin-top: 3.4em;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.4em;

    > div:last-child {
      grid-column: 1 / -1;
    }
  }
`

const Stat = styled.div`
  min-width: 0;
  padding: 1.5em;
  border: 1px solid #dce1eb;
  border-radius: 1.3em;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 1em 3em rgba(37, 49, 74, 0.05);

  small {
    display: block;
    overflow: hidden;
    color: #7d8799;
    font-size: 0.65em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    display: block;
    margin-top: 0.55em;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 1.9em;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  @container (max-width: 460px) {
    padding: 1.8em;

    small {
      font-size: 0.82em;
    }

    strong {
      font-size: 2.7em;
    }
  }
`

const ProjectsHead = styled.div`
  margin-top: 2.8em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1em;

  h4 {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 1.35em;
    letter-spacing: -0.03em;
  }

  span {
    color: #635bff;
    font-size: 0.68em;
  }

  @container (max-width: 460px) {
    margin-top: 3.6em;

    h4 {
      font-size: 2em;
    }

    span {
      font-size: 0.9em;
    }
  }
`

const Projects = styled.div`
  margin-top: 1.2em;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1em;

  @container (max-width: 460px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.4em;

    > article:last-child {
      display: none;
    }
  }
`

const ProjectCard = styled.article<{ $accent?: boolean }>`
  min-width: 0;
  padding: 1.5em;
  border: 1px solid ${({ $accent }) => ($accent ? '#c8c4ff' : '#dce1eb')};
  border-radius: 1.3em;
  background: ${({ $accent }) => ($accent ? '#f0efff' : '#fff')};

  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 0.82em;
  }

  small {
    margin-top: 0.55em;
    color: #818a9b;
    font-size: 0.62em;
  }

  @container (max-width: 460px) {
    padding: 1.9em;

    strong {
      font-size: 1.15em;
    }

    small {
      font-size: 0.82em;
    }
  }
`

const Progress = styled.div<{ $value: number }>`
  height: 0.55em;
  margin-top: 1.8em;
  overflow: hidden;
  border-radius: 999px;
  background: #e4e7ee;

  &::after {
    content: '';
    width: ${({ $value }) => `${$value}%`};
    height: 100%;
    display: block;
    transform-origin: left;
    border-radius: inherit;
    background: #635bff;
    animation: ${progressIn} 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    animation-play-state: var(--demo-play-state, paused);
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
    }
  }
`

const ProjectMeta = styled.div`
  margin-top: 0.8em;
  display: flex;
  justify-content: flex-end;
  color: #6f788a;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.58em;

  @container (max-width: 460px) {
    font-size: 0.78em;
  }
`

const NextCard = styled.div`
  margin-top: 1.2em;
  padding: 1.2em 1.5em;
  border-radius: 1.2em;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1em;
  background: #111827;
  color: #fff;

  > span:first-child {
    width: 2.7em;
    height: 2.7em;
    border-radius: 0.8em;
    display: grid;
    place-items: center;
    background: #635bff;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.62em;
  }

  strong,
  small {
    display: block;
  }

  strong {
    font-size: 0.74em;
  }

  small {
    margin-top: 0.35em;
    color: #8d99af;
    font-size: 0.6em;
  }

  > span:last-child {
    padding: 0.7em 0.9em;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.09);
    color: #aeb9ca;
    font-size: 0.58em;
  }

  @container (max-width: 460px) {
    margin-top: 1.6em;
    padding: 1.7em;

    strong {
      font-size: 1em;
    }

    small {
      font-size: 0.78em;
    }

    > span:last-child {
      display: none;
    }
  }
`

const ViewportLabel = styled.span`
  position: absolute;
  z-index: 8;
  left: 12px;
  bottom: -38px;
  padding: 8px 11px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: ${({ theme }) => theme.radii.pill};
  background: rgba(7, 9, 14, 0.78);
  color: #fff;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  backdrop-filter: blur(10px);
`

export function MorphScene({ children }: { children?: ReactNode }) {
  const { t } = useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const mobileViewport = useMediaQuery('(max-width: 760px)')
  const still = prefersReducedMotion
  const [isPhone, setIsPhone] = useState(false)

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

  useIsomorphicLayoutEffect(() => {
    if (still || !root.current) return
    let stopScroll = () => {}

    const ctx = gsap.context((self) => {
      const q = self.selector as (selector: string) => Element[]
      const frame = q('[data-frame]')[0] as HTMLElement | undefined
      if (!frame) return

      const mobile = window.matchMedia('(max-width: 760px)').matches
      const stageWidth = () => frame.parentElement?.clientWidth || window.innerWidth
      const stageHeight = () => {
        const parent = frame.parentElement
        return parent ? parent.clientHeight - parseFloat(getComputedStyle(parent).paddingBottom) : window.innerHeight
      }
      const desktopWidth = () =>
        Math.min(mobile ? 420 : 900, stageWidth() * (mobile ? 0.9 : 0.82), stageHeight() / 0.625)
      const phoneWidth = () =>
        Math.min(mobile ? 190 : 300, stageWidth() * (mobile ? 0.46 : 0.34), stageHeight() / 2)
      let phoneState = false

      frame.style.aspectRatio = 'auto'

      const timeline = gsap.timeline({
        paused: true,
          onUpdate() {
            const nextPhone = this.progress() > 0.55
            if (nextPhone === phoneState) return
            phoneState = nextPhone
            setIsPhone(nextPhone)
          },
      })

      timeline.fromTo(
        frame,
        { width: desktopWidth, height: () => desktopWidth() * 0.625 },
        {
          width: phoneWidth,
          height: () => phoneWidth() * 2,
          ease: 'none',
          duration: 1,
        },
        0,
      )
      stopScroll = bindScrollTimeline(root.current!, timeline)
    }, root)

    return () => {
      stopScroll()
      ctx.revert()
      const frame = root.current?.querySelector('[data-frame]') as HTMLElement | null
      frame?.style.removeProperty('aspect-ratio')
      setIsPhone(false)
    }
  }, [mobileViewport, still])

  const phone = still ? mobileViewport : isPhone

  return (
    <Scene ref={root} id="responsive-demo" $distance="90svh" $compactDistance="65svh">
      <StickyScene data-sticky-scene>
      <Stage $still={still} data-stage>
        <CopyCol>
          <Title>{t('morph.title')}</Title>
          <Copy>{phone ? t('morph.mobileCopy') : t('morph.desktopCopy')}</Copy>
        </CopyCol>

        <FrameWrap>
          <Halo />
          <Frame $still={still} $phone={phone} data-frame>
            <FrameInner role="img" aria-label={t('morph.demo.ariaLabel')}>
              <ProductUi data-product-ui aria-hidden="true">
                <ProductSidebar>
                  <ProductBrand>
                    <span />
                    {t('morph.demo.brand')}
                  </ProductBrand>
                  <ProductWorkspace>{t('morph.demo.workspace')}</ProductWorkspace>
                  <ProductNav>
                    <span>{t('morph.demo.nav.overview')}</span>
                    <span>{t('morph.demo.nav.projects')}</span>
                    <span>{t('morph.demo.nav.team')}</span>
                  </ProductNav>
                  <ProductAccount>
                    <span>{t('morph.demo.account.initials')}</span>
                    <div>
                      <strong>{t('morph.demo.account.name')}</strong>
                      <small>{t('morph.demo.account.status')}</small>
                    </div>
                  </ProductAccount>
                </ProductSidebar>

                <ProductMain>
                  <ProductTopbar>
                    <Search>{t('morph.demo.search')}</Search>
                    <NewTask>{t('morph.demo.newTask')}</NewTask>
                  </ProductTopbar>

                  <ProductContent>
                    <ProductEyebrow>{t('morph.demo.eyebrow')}</ProductEyebrow>
                    <ProductTitle>{t('morph.demo.title')}</ProductTitle>
                    <ProductLead>{t('morph.demo.lead')}</ProductLead>

                    <Stats>
                      <Stat>
                        <small>{t('morph.demo.stats.active.label')}</small>
                        <strong>{t('morph.demo.stats.active.value')}</strong>
                      </Stat>
                      <Stat>
                        <small>{t('morph.demo.stats.completed.label')}</small>
                        <strong>{t('morph.demo.stats.completed.value')}</strong>
                      </Stat>
                      <Stat>
                        <small>{t('morph.demo.stats.velocity.label')}</small>
                        <strong>{t('morph.demo.stats.velocity.value')}</strong>
                      </Stat>
                    </Stats>

                    <ProjectsHead>
                      <h4>{t('morph.demo.projects.title')}</h4>
                      <span>{t('morph.demo.projects.viewAll')} →</span>
                    </ProjectsHead>
                    <Projects>
                      <ProjectCard $accent>
                        <strong>{t('morph.demo.projects.items.checkout.title')}</strong>
                        <small>{t('morph.demo.projects.items.checkout.meta')}</small>
                        <Progress $value={72} />
                        <ProjectMeta>
                          {t('morph.demo.projects.items.checkout.progress')}
                        </ProjectMeta>
                      </ProjectCard>
                      <ProjectCard>
                        <strong>{t('morph.demo.projects.items.portal.title')}</strong>
                        <small>{t('morph.demo.projects.items.portal.meta')}</small>
                        <Progress $value={46} />
                        <ProjectMeta>{t('morph.demo.projects.items.portal.progress')}</ProjectMeta>
                      </ProjectCard>
                    </Projects>

                    <NextCard>
                      <span>{t('morph.demo.next.time')}</span>
                      <div>
                        <strong>{t('morph.demo.next.title')}</strong>
                        <small>{t('morph.demo.next.label')}</small>
                      </div>
                      <span>{t('morph.demo.account.status')}</span>
                    </NextCard>
                  </ProductContent>
                </ProductMain>
              </ProductUi>
            </FrameInner>
            <ViewportLabel>
              {phone ? t('morph.mobileLabel') : t('morph.desktopLabel')}
            </ViewportLabel>
          </Frame>
        </FrameWrap>
      </Stage>
      {children}
      </StickyScene>
    </Scene>
  )
}
