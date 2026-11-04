import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { useId, useRef } from 'react'
import styled from 'styled-components'
import { gsap } from '../lib/gsap'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { brandParts } from '../components/brandGeometry'
import { ribbonEdgePaths, type RibbonPoint } from './ribbonChoreography'
import { createRibbonSurfaceRenderer } from './ribbonSurfaceRenderer'

const Art = styled.div`
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  width: 120%;
  margin-left: -10%;
  pointer-events: none;
  user-select: none;
  @media (max-width: 760px) {
    grid-column: 1; grid-row: 3; width: 100%;
    height: clamp(230px, 64vw, 320px);
    margin: 0;
    align-self: center;
    display: grid;
    place-items: center;
  }
`
const Stage = styled.div`
  position: relative; width: 100%;
  max-width: clamp(220px, calc(100svh - 340px), 660px);
  aspect-ratio: 1; margin: auto;
  svg, canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
  @media (max-width: 760px) {
    height: 100%; width: auto; max-width: 100%;
    svg, canvas { transform: scale(1.2); transform-origin: center; }
  }
`
function sample(path:string):RibbonPoint[] {
  const node=document.createElementNS('http://www.w3.org/2000/svg','path')
  node.setAttribute('d',path)
  const length=node.getTotalLength()
  return Array.from({length:96},(_,i)=>{
    const point=node.getPointAtLength(length*i/95)
    return {x:point.x,y:point.y}
  })
}


export function HeroRibbon() {
  const id=useId().replace(/:/g,'')
  const root=useRef<HTMLDivElement>(null)
  const reduced=usePrefersReducedMotion()
  useIsomorphicLayoutEffect(()=>{
    const element=root.current
    if(!element||reduced)return
    const canvas=element.querySelector('canvas')!
    const logo=element.querySelector('svg')!
    const edges=ribbonEdgePaths.map(([left,right])=>({left:sample(left),right:sample(right)}))
    const renderer=createRibbonSurfaceRenderer(canvas,edges)
    if(!renderer)return
    const state={progress:0}
    let idleFrame=0,lastTime=0,phase=0,elapsed=0,visible=false,lost=false
    const draw=()=>{
      if(lost)return
      const fade=Math.max(0,Math.min(1,(state.progress-.96)/.025))
      // Keep the opaque surface underneath until the SVG fully covers it.
      // Complementary opacities would dip to 75% coverage halfway through.
      canvas.style.opacity=fade<1?'1':'0'
      logo.style.opacity=String(fade)
      renderer.draw(state.progress,phase)
    }
    const canIdle=()=>!lost&&visible&&!document.hidden
    const tick=(time:number)=>{
      idleFrame=0
      if(!canIdle()){lastTime=0;return}
      if(!lastTime||time-lastTime>=32){
        if(lastTime){
          const delta=Math.min(time-lastTime,80)
          elapsed=(elapsed+delta)%14000
          phase+=delta*.00035
        }
        // A quiet opening, a smooth assembly, a logo hold, then a soft return.
        const cycle=elapsed/1000
        const ease=(value:number)=>(1-Math.cos(Math.PI*value))/2
        state.progress=cycle<2?0:cycle<6?ease((cycle-2)/4):cycle<8?1:cycle<12?1-ease((cycle-8)/4):0
        lastTime=time;draw()
      }
      idleFrame=requestAnimationFrame(tick)
    }
    const sync=()=>{
      if(canIdle()) {if(!idleFrame){lastTime=0;idleFrame=requestAnimationFrame(tick)}}
      else {cancelAnimationFrame(idleFrame);idleFrame=0;lastTime=0}
    }
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()})
    observer.observe(element)
    const resize=new ResizeObserver(draw)
    resize.observe(element)
    const onContextLost=()=>{
      lost=true;sync()
      canvas.style.opacity='0';logo.style.opacity='1'
    }
    canvas.addEventListener('webglcontextlost',onContextLost)
    document.addEventListener('visibilitychange',sync)
    draw()
    const context=gsap.context(()=>{
      gsap.fromTo(element.querySelector('[data-ribbon-stage]'),
        {autoAlpha:0,y:20,scale:.96},
        {autoAlpha:1,y:0,scale:1,duration:.75,ease:'power2.out',transformOrigin:'50% 50%'})

    },element)
    return ()=>{
      context.revert();observer.disconnect();cancelAnimationFrame(idleFrame)
      document.removeEventListener('visibilitychange',sync)
      resize.disconnect();renderer.dispose()
      canvas.removeEventListener('webglcontextlost',onContextLost)
      canvas.style.opacity='0';logo.style.opacity='1'
    }
  },[reduced])
  return <Art ref={root} aria-hidden="true"><Stage data-ribbon-stage>
    <canvas style={{opacity:0}} />
    <svg viewBox="-90 -80 620 620" fill="none" focusable="false">
      <defs>{brandParts.map(part=><linearGradient key={part.name} id={`${id}-${part.name}`} gradientUnits="userSpaceOnUse" x1={part.axis[0]} y1={part.axis[1]} x2={part.axis[2]} y2={part.axis[3]}>
        {part.colors.map((color,i)=><stop key={color} offset={i/2} stopColor={color}/>)}</linearGradient>)}</defs>
      {brandParts.map(part=><path data-brand-part key={part.name} d={part.path} fill={`url(#${id}-${part.name})`}/>)}

    </svg>
  </Stage></Art>
}

