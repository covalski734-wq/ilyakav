import { createGlobalStyle, css, keyframes } from 'styled-components'

export const drift = keyframes`
  0%   { transform: translate3d(-4%, -2%, 0) scale(1.06) rotate(0deg); }
  50%  { transform: translate3d(4%, 3%, 0) scale(1.12) rotate(6deg); }
  100% { transform: translate3d(-4%, -2%, 0) scale(1.06) rotate(0deg); }
`

export const breathe = keyframes`
  0%, 100% { opacity: .55; transform: scale(1); }
  50%      { opacity: .9; transform: scale(1.06); }
`

/** Screenshot placeholders and media are desaturated so layout reads before imagery. */
export const grayscaleMedia = css`
  overflow: hidden;

  img,
  video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1) contrast(1.04);
  }
`

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }

  html {
    scroll-behavior: smooth;
    background: ${({ theme }) => theme.colors.bg};
  }

  body {
    margin: 0;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.sans};
    font-size: 17px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    overflow-x: clip;
  }

  h1, h2, h3, h4, p { margin: 0; }

  a { color: inherit; }

  summary {
    list-style: none;
    cursor: pointer;
  }
  summary::-webkit-details-marker { display: none; }

  button { font-family: inherit; }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
  }
`
