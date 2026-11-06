import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export function analyticsHeadScripts(gtmId: string, metaEnabled = true): string {
  if (!/^GTM-[A-Z0-9]+$/.test(gtmId)) return ''
  return `<script src="/gtm-init.js" data-meta-enabled="${metaEnabled}"></script>\n    <script id="ilyakav-gtm" async src="https://www.googletagmanager.com/gtm.js?id=${gtmId}"></script>`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const gtmId = (env.VITE_GTM_ID ?? 'GTM-TKPFHC7B').trim()
  const metaEnabled = (env.VITE_META_ENABLED ?? 'true').trim().toLowerCase() !== 'false'
  return {
  plugins: [
    {
      name: 'early-gtm',
      transformIndexHtml(html) {
        return html.replace('<!-- gtm-head -->', analyticsHeadScripts(gtmId, metaEnabled))
      },
    },
    react({
      babel: {
        plugins: [['babel-plugin-styled-components', { displayName: true, ssr: true }]],
      },
    }),
  ],
  server: { port: 5173, open: true },
  ssr: { noExternal: ['styled-components', 'gsap'] },
  }
})
