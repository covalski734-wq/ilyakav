import { useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { ServiceIcon } from '../components/ui/ServiceIcon'

const orbit = keyframes`to { transform: rotate(360deg); }`
const float = keyframes`50% { transform: translateY(-9px); }`
const draw = keyframes`to { stroke-dashoffset: -40; }`
const enter = keyframes`from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; }`
const Wrapper = styled.div<{ $playing: boolean }>`
  position: relative; width: 100%; max-width: 610px; margin: 0 auto;
  .orbit, .flow, .satellite { animation-play-state: ${({ $playing }) => $playing ? 'running' : 'paused'}; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; } }
`
const Stage = styled.div`
  position: relative; width: 100%; aspect-ratio: 1.09; isolation: isolate;
  &::before { content: ''; position: absolute; inset: 12% 3%; z-index: -1; border-radius: 50%; background: radial-gradient(ellipse, #7161ff28, transparent 65%); }
  @media (max-width: 1100px) { min-height: 390px; }
`
const Rings = styled.svg`
  position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible;
  .orbit { transform-origin: 300px 275px; animation: ${orbit} 55s linear infinite; }
  .flow { stroke-dasharray: 5 15; animation: ${draw} 3s linear infinite; }
`
const Core = styled.div`
  position: absolute; left: 22%; top: 26%; width: 60%;
  border: 1px solid #c8c4ff47; border-radius: 18px; overflow: hidden;
  background: linear-gradient(135deg, #25283eee, #101524f5);
  box-shadow: 0 28px 65px #0006, inset 0 1px #ffffff0a;
  transform: perspective(900px) rotateY(-10deg) rotateX(5deg) rotate(-4deg);
  @media (max-width: 1100px) { top: 22%; }
  @media (max-width: 420px) { left: 20%; width: 65%; }
`
const Toolbar = styled.div`
  display: flex; align-items: center; gap: 5px; padding: 12px 15px; border-bottom: 1px solid #ffffff12;
  i { width: 5px; height: 5px; border-radius: 50%; background: #5f6580; }
  span { margin-left: auto; font: 9px ${({ theme }) => theme.fonts.mono}; color: #a1a9c0; }
`
const CoreContent = styled.div`
  padding: clamp(16px, 2.2vw, 30px); min-height: 205px; animation: ${enter} .3s ease both;
  > svg { width: 30px; height: 30px; color: #c6bfff; margin-bottom: 16px; }
  > p { color: #f5f4ff; font-size: clamp(22px, 2.2vw, 32px); line-height: 1.1; letter-spacing: -.045em; font-weight: 600; }
  > small { display: block; color: #adb5c8; font-size: 11px; margin-top: 12px; line-height: 1.6; }
  @media (max-width: 1100px) {
    min-height: 0; padding: 18px;
    > svg { width: 24px; height: 24px; margin-bottom: 10px; }
    > small { display: none; }
    > p { font-size: 23px; }
  }
`
const MiniAction = styled.div`
  margin-top: 22px; padding: 9px 12px; border-radius: 6px; background: #b6acf7; color: #211b3d;
  display: flex; justify-content: space-between; gap: 10px; font-size: 10px; font-weight: 600;
`
const Satellite = styled.div<{ $position: 'top' | 'bottom' }>`
  position: absolute; z-index: 2; display: flex; align-items: center; gap: 12px;
  top: ${({ $position }) => $position === 'top' ? '12%' : 'auto'};
  bottom: ${({ $position }) => $position === 'bottom' ? '9%' : 'auto'};
  left: ${({ $position }) => $position === 'top' ? '4%' : 'auto'};
  right: ${({ $position }) => $position === 'bottom' ? '1%' : 'auto'};
  padding: 13px 17px; border: 1px solid #b1b9d529; border-radius: 12px;
  background: #141a29; box-shadow: 0 15px 36px #0004;
  animation: ${float} 8s ease-in-out infinite;
  animation-delay: ${({ $position }) => $position === 'top' ? '-2s' : '-5s'};
  > svg { color: #b3ace9; width: 22px; height: 22px; flex: none; }
  strong { display: block; font-size: 12px; font-weight: 500; color: #e2e7f0; }
  small { display: block; font-size: 10px; color: #98a8bd; margin-top: 2px; }
  @media (max-width: 420px) { padding: 9px 11px; gap: 8px; strong { font-size: 11px; } small { font-size: 9px; } }
  @media (max-width: 1100px) { bottom: ${({ $position }) => $position === 'bottom' ? '2%' : 'auto'}; }
`
const Tick = styled.span`color: #bde6a6; font-size: 15px; margin-left: 8px;`
const Marker = styled.span`
  position: absolute; left: 4%; bottom: 15%; font: 10px ${({ theme }) => theme.fonts.mono}; color: #8c94ae;
  writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: .13em;
`
const Controls = styled.div`
  position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 0; border-top: 1px solid #2a3040;
`
const Choices = styled.div`
  display: flex; flex-wrap: wrap; gap: 4px;
`
const Choice = styled.button<{ $active: boolean }>`
  display: inline-flex; gap: 7px; align-items: center; padding: 8px 9px; border: 1px solid ${({ $active }) => $active ? '#716794' : 'transparent'};
  background: ${({ $active }) => $active ? '#27233d' : 'transparent'}; color: ${({ $active }) => $active ? '#e1dbff' : '#a0aabf'};
  border-radius: 6px; font-size: 11px; cursor: pointer; min-height: 36px;
  &:hover { background: #2c2941; color: #f1eeff; }
  span { font: 9px ${({ theme }) => theme.fonts.mono}; opacity: .65; }
`
const Pause = styled.button`
  width: 36px; height: 36px; flex: none; background: transparent; border: 1px solid #41495d; border-radius: 50%; color: #c3ccdc; cursor: pointer;
  &:hover { background: #242a3a; }
  &:disabled { opacity: .45; cursor: default; }
`
const Caption = styled.p`margin-top: 9px; font-size: 11px; color: #929eb3;`
const SCENARIOS = ['site', 'bot', 'automation'] as const

export function HeroExperience() {
  const { t } = useTranslation()
  const [active, setActive] = useState<(typeof SCENARIOS)[number]>('site')
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(true)
  const still = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return <Wrapper ref={ref} $playing={!paused && !still && visible}>
    <Stage aria-hidden="true">
      <Rings viewBox="0 0 600 550" fill="none">
        <g stroke="#8d82d0" strokeWidth=".65" opacity=".42" transform="rotate(-28 300 275)">
          {Array.from({ length: 9 }, (_, i) => <ellipse key={i} cx="300" cy="275" rx={232 - i * 6} ry={220 - i * 18} />)}
        </g>
        <g stroke="#626b8e" strokeWidth=".6" opacity=".28" transform="rotate(39 300 275)">
          <ellipse cx="300" cy="275" rx="255" ry="195" /><ellipse cx="300" cy="275" rx="265" ry="203" />
        </g>
        <path d="M120 120V200Q120 220 150 220H210M400 360V430H510" stroke="#41445e" strokeWidth="1.5" />
        <path className="flow" d="M120 120V200Q120 220 150 220H210M400 360V430H510" stroke="#c3b8ff" strokeWidth="2" />
        <g className="orbit"><circle cx="532" cy="275" r="4" fill="#c9bfff" /><circle cx="68" cy="275" r="3" fill="#bde6a6" /></g>
        <path d="M520 93h12m-6-6v12M70 413h12m-6-6v12" stroke="#9aa3c0" strokeWidth="1" />
      </Rings>
      <Satellite className="satellite" $position="top"><ServiceIcon kind="bot" /><div><strong>{t('hero.scene.incoming')}</strong><small>{t('hero.scene.incomingNote')}</small></div><Tick>↗</Tick></Satellite>
      <Core>
        <Toolbar><i /><i /><i /><span>ilyakav. / digital</span></Toolbar>
        <CoreContent key={active}><ServiceIcon kind={active} /><p>{t(`hero.scene.scenarios.${active}.title`)}</p><small>{t(`hero.scene.scenarios.${active}.note`)}</small><MiniAction>{t(`hero.scene.scenarios.${active}.action`)}<span>↗</span></MiniAction></CoreContent>
      </Core>
      <Satellite className="satellite" $position="bottom"><ServiceIcon kind="automation" /><div><strong>{t('hero.scene.result')}</strong><small>{t('hero.scene.resultNote')}</small></div><Tick>✓</Tick></Satellite>
      <Marker>IDEA → INTERFACE → IMPACT</Marker>
    </Stage>
    <Controls>
      <Choices role="group" aria-label={t('hero.scene.choose')}>
        {SCENARIOS.map((key, index) => <Choice key={key} $active={key === active} aria-pressed={key === active} onClick={() => setActive(key)} type="button"><span aria-hidden="true">0{index + 1}</span>{t(`hero.scene.scenarios.${key}.label`)}</Choice>)}
      </Choices>
      <Pause type="button" disabled={still} aria-pressed={paused || still} aria-label={t(paused ? 'hero.scene.play' : 'hero.scene.pause')} onClick={() => setPaused(value => !value)}><span aria-hidden="true">{paused || still ? '▷' : 'Ⅱ'}</span></Pause>
    </Controls>
    <Caption aria-live="polite">{t('hero.scene.caption')} · {t(`hero.scene.scenarios.${active}.note`)}</Caption>
  </Wrapper>
}
