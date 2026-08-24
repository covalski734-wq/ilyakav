export type ThemeMode = 'light' | 'dark'

const shared = {
  radii: {
    xl: '34px',
    lg: '26px',
    md: '18px',
    pill: '999px',
  },
  fonts: {
    serif: "'Instrument Serif', Georgia, serif",
    sans: "'Instrument Sans', ui-sans-serif, system-ui, sans-serif",
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
    bg: '#f7f2ea',
    surface: '#fffdfa',
    surface2: '#efe6d8',
    deep: '#1d1712',
    deep2: '#292019',
    text: '#221c16',
    textDim: '#6d6154',
    onDeep: '#f6efe4',
    onDeepDim: 'rgba(246,239,228,.66)',
    accent: '#c2542f',
    accentSoft: '#f2ddd2',
    accentInk: '#a8431f',
  },
  shadows: {
    s: '0 10px 26px rgba(74,50,30,.08)',
    m: '0 22px 54px rgba(74,50,30,.12)',
    l: '0 40px 90px rgba(35,22,12,.2)',
  },
  ...shared,
}

export const darkTheme = {
  mode: 'dark' as ThemeMode,
  colors: {
    bg: '#17120e',
    surface: '#211a14',
    surface2: '#2b221a',
    deep: '#100c09',
    deep2: '#1a1410',
    text: '#f6efe4',
    textDim: 'rgba(246,239,228,.64)',
    onDeep: '#f6efe4',
    onDeepDim: 'rgba(246,239,228,.62)',
    accent: '#e0754c',
    accentSoft: '#3a251b',
    accentInk: '#f0a385',
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
