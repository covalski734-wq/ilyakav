import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './i18n'
import { App } from './App'
import { loadPage } from './routes'
import { AppThemeProvider } from './theme/ThemeContext'
import { GlobalStyle } from './theme/GlobalStyle'
import { initConsent } from './lib/consent'

async function start() {
  initConsent()
  const container = document.getElementById('root')
  if (!container) throw new Error('Root element #root not found')
  const pathname = window.location.pathname
  const Page = await loadPage(pathname)
  const app = <StrictMode><AppThemeProvider><GlobalStyle /><App pathname={pathname} Page={Page} /></AppThemeProvider></StrictMode>
  if (container.hasChildNodes()) hydrateRoot(container, app)
  else createRoot(container).render(app)
}
void start()
