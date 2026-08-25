export type ThemeMode = 'light' | 'dark'

const shared = {
  radii: {
    xl: '28px',
    lg: '20px',
    md: '14px',
    pill: '999px',
  },
  fonts: {
    display: "'Onest', ui-sans-serif, system-ui, sans-serif",
    sans: "'Onest', ui-sans-serif, system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Consolas, monospace",
  },
  layout: {
    maxWidth: '1440px',
    pagePadding: 'clamp(18px, 4vw, 56px)',
    sectionPadding: 'clamp(56px, 8vw, 120px)',
  },
} as const

export const lightTheme = {
  mode: 'light' as ThemeMode,
  colors: {
    bg: '#f4f6f9',
    surface: '#ffffff',
    surface2: '#e9edf3',
    deep: '#0b0e14',
    deep2: '#151a24',
    text: '#11151d',
    textDim: '#626c7b',
    onDeep: '#f7f9fc',
    onDeepDim: 'rgba(231,236,245,.68)',
    accent: '#635bff',
    accentSoft: '#e5e4ff',
    accentInk: '#4740dd',
    status: '#55d6a0',
    line: '#dce2ea',
  },
  shadows: {
    s: '0 1px 2px rgba(9,13,20,.05), 0 12px 28px rgba(9,13,20,.07)',
    m: '0 2px 4px rgba(9,13,20,.05), 0 24px 56px rgba(9,13,20,.11)',
    l: '0 32px 90px rgba(5,8,14,.24)',
  },
  ...shared,
}

export const darkTheme = {
  mode: 'dark' as ThemeMode,
  colors: {
    bg: '#090b10',
    surface: '#12161e',
    surface2: '#1b202a',
    deep: '#06080c',
    deep2: '#10141c',
    text: '#f4f6fa',
    textDim: '#919aaa',
    onDeep: '#f7f9fc',
    onDeepDim: 'rgba(231,236,245,.66)',
    accent: '#665cf6',
    accentSoft: '#292653',
    accentInk: '#5e56e8',
    status: '#62dda9',
    line: '#272d38',
  },
  shadows: {
    s: '0 10px 26px rgba(0,0,0,.3)',
    m: '0 22px 54px rgba(0,0,0,.4)',
    l: '0 40px 90px rgba(0,0,0,.55)',
  },
  ...shared,
}

export const themes: Record<ThemeMode, AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
}

export type AppTheme = typeof lightTheme
