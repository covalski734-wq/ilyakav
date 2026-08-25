import styled, { css } from 'styled-components'

export const Section = styled.section`
  padding: ${({ theme }) => theme.layout.sectionPadding} ${({ theme }) => theme.layout.pagePadding};
`

export const Container = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  width: 100%;
`

export const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 650;
  font-size: clamp(32px, 4.4vw, 62px);
  line-height: 0.98;
  letter-spacing: -0.045em;
`

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 600;
  border: 0;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.md};
  transition:
    background 0.3s ease,
    color 0.3s ease,
    transform 0.3s ease;
`

export const PrimaryButton = styled.a`
  ${buttonBase};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: 16px;
  padding: 18px 30px;

  &:hover {
    background: ${({ theme }) => theme.colors.accentInk};
    transform: translateY(-2px);
  }
`

export const GhostButton = styled.a`
  ${buttonBase};
  background: rgba(248, 243, 236, 0.14);
  color: #f8f3ec;
  font-size: 16px;
  padding: 18px 30px;

  &:hover {
    background: rgba(248, 243, 236, 0.26);
    transform: translateY(-2px);
  }
`

export const InvertedButton = styled.a`
  ${buttonBase};
  background: ${({ theme }) => theme.colors.onDeep};
  color: ${({ theme }) => theme.colors.deep};
  font-size: 16px;
  padding: 17px 30px;

  &:hover {
    background: ${({ theme }) => theme.colors.accent};
    color: #fff;
    transform: translateY(-2px);
  }
`

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.s};
  padding: 24px;
`

/** Auto-fitting grid used by every card row on the page. */
export const AutoGrid = styled.div<{ $min?: string; $gap?: string }>`
  display: grid;
  grid-template-columns: ${({ $min = '230px' }) => `repeat(auto-fit, minmax(min(100%, ${$min}), 1fr))`};
  gap: ${({ $gap = 'clamp(12px, 1.6vw, 18px)' }) => $gap};
`

export const Eyebrow = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  letter-spacing: 0.03em;
  color: ${({ theme }) => theme.colors.textDim};
`
