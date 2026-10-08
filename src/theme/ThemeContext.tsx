import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'

import { themes } from './tokens'
import type { ThemeMode } from './tokens'

const STORAGE_KEY = 'ilyakav-theme'

type ThemeContextValue = {
  mode: ThemeMode
  toggleTheme: () => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* Storage unavailable: use the light site default. */
  }
  return 'light'
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light')
  useEffect(() => { setModeState(readStoredMode()) }, [])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore — the theme still applies for this session */
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark')
  }, [mode, setMode])

  useEffect(() => {
    document.documentElement.dataset.theme = mode
    document.documentElement.style.colorScheme = mode
  }, [mode])

  const value = useMemo(() => ({ mode, toggleTheme, setMode }), [mode, toggleTheme, setMode])

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={themes[mode]}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <AppThemeProvider>')
  return ctx
}
