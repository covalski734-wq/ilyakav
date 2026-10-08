import styled from 'styled-components'

/** Reserve the runway in CSS, before hydration, fonts or animation setup. */
export const ScrollTrack = styled.div<{ $distance: string; $compactDistance: string }>`
  position: relative;
  display: flow-root;
  &::after { content: ''; display: block; height: ${({ $distance }) => $distance}; pointer-events: none; }
  @media (max-width: 760px), (max-height: 600px) {
    &::after { height: ${({ $compactDistance }) => $compactDistance}; }
  }
  @media (prefers-reduced-motion: reduce) { &::after { display: none; } }
`

export const StickyScene = styled.div`
  position: sticky;
  top: 0;
  @media (prefers-reduced-motion: reduce) { position: relative; }
`
