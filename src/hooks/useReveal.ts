import { useLayoutEffect, useRef } from 'react'

import { gsap } from '../lib/gsap'
import { usePrefersReducedMotion } from './useMediaQuery'

type RevealOptions = {
  /** Animate the element's direct children in sequence instead of the element itself. */
  children?: boolean
  y?: number
  /** Start scale — below 1 gives the element a pop rather than a plain lift. */
  scale?: number
  stagger?: number
  delay?: number
  duration?: number
  ease?: string
  /** ScrollTrigger start position, relative to the element. */
  start?: string
}

/**
 * Fades an element (or its direct children) up as it scrolls into view, once.
 * Inline props are cleared afterwards so nothing is left holding a transform —
 * a lingering one would break `position: sticky` descendants.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>({
  children = false,
  y = 28,
  scale = 1,
  stagger = 0.08,
  delay = 0,
  duration = 0.8,
  ease = 'power3.out',
  start = 'top 86%',
}: RevealOptions = {}) {
  const ref = useRef<T>(null)
  const still = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const el = ref.current
    if (still || !el) return

    const ctx = gsap.context(() => {
      const targets = children ? Array.from(el.children) : [el]
      if (!targets.length) return

      gsap.from(targets, {
        y,
        scale,
        opacity: 0,
        duration,
        delay,
        stagger,
        ease,
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: el, start, once: true },
      })
    }, ref)

    return () => ctx.revert()
  }, [still, children, y, scale, stagger, delay, duration, ease, start])

  return ref
}
