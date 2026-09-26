// Preserve the desktop scene, but don't trap a phone on a hero taller than
// its viewport. In that case the ribbon assembles during ordinary scrolling.
export function getHeroScrollLayout(viewport: number, height: number, compact: boolean, reduced: boolean) {
  const sticky = !reduced && !(compact && (height > viewport + 24 || viewport < 600))
  const hold = sticky ? Math.round(viewport * (compact ? .4 : .75)) : 0
  return {
    sticky,
    trackHeight: height + hold,
    lead: sticky ? Math.max(0, height - viewport) : 0,
    distance: reduced ? 0 : sticky ? hold : Math.round(viewport * .45),
    // The last fifth assembles after the scene starts leaving the viewport.
    finish: sticky ? Math.round(viewport * (compact ? .1 : .18)) : 0,
  }
}
