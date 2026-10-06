// Keep the desktop hold; on phones the ribbon assembles during normal scrolling.
export function getHeroScrollLayout(viewport: number, height: number, compact: boolean, reduced: boolean) {
  const sticky = !reduced && !compact
  const hold = sticky ? Math.round(viewport * .75) : 0
  return {
    sticky,
    trackHeight: height + hold,
    lead: sticky ? Math.max(0, height - viewport) : 0,
    distance: reduced ? 0 : sticky ? hold : Math.round(viewport * .45),
    // The last fifth assembles after the scene starts leaving the viewport.
    finish: sticky ? Math.round(viewport * .18) : 0,
  }
}
