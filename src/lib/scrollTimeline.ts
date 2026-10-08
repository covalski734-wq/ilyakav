/** Animate from the actual CSS sticky geometry; never write scroll position,
 * inject spacers, or switch a scene between fixed and normal positioning. */
export function bindScrollTimeline(track: HTMLElement, timeline: gsap.core.Timeline) {
  let frame = 0
  let disposed = false
  let invalidate = false
  const render = () => {
    frame = 0
    if (disposed) return
    const distance = parseFloat(getComputedStyle(track, '::after').height) || 0
    const progress = distance ? Math.max(0, Math.min(1, -track.getBoundingClientRect().top / distance)) : 0
    if (invalidate) { timeline.invalidate(); invalidate = false }
    timeline.progress(progress)
  }
  const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(render) }
  const resize = () => { invalidate = true; schedule() }
  const observer = new ResizeObserver(resize)
  observer.observe(track)
  observer.observe(document.body)
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', resize)
  document.fonts.addEventListener('loadingdone', resize)
  document.fonts.ready.then(() => { if (!disposed) resize() })
  render()
  return () => {
    disposed = true
    cancelAnimationFrame(frame)
    observer.disconnect()
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', resize)
    document.fonts.removeEventListener('loadingdone', resize)
  }
}
