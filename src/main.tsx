import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './i18n'
import { App } from './App'
import { AppThemeProvider } from './theme/ThemeContext'
import { GlobalStyle } from './theme/GlobalStyle'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found')

createRoot(container).render(
  <StrictMode>
    <AppThemeProvider>
      <GlobalStyle />
      <App />
    </AppThemeProvider>
  </StrictMode>,
)
