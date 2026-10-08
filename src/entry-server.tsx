import { renderToString } from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'
import i18n from './i18n'
import { App } from './App'
import { loadPage } from './routes'
import { AppThemeProvider } from './theme/ThemeContext'
import { GlobalStyle } from './theme/GlobalStyle'
import { pageMeta } from './seo'
export { PUBLIC_PATHS, SITE_ORIGIN } from '../shared/routes'
export async function render(pathname: string) {
  const Page = await loadPage(pathname)
  const sheet = new ServerStyleSheet()
  try {
    const html = renderToString(sheet.collectStyles(<AppThemeProvider><GlobalStyle /><App pathname={pathname} Page={Page} /></AppThemeProvider>))
    return { html, styles: sheet.getStyleTags(), meta: pageMeta(i18n.t.bind(i18n), pathname) }
  } finally { sheet.seal() }
}
