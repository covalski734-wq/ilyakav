import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const gtmId = (loadEnv(mode, '.', 'VITE_').VITE_GTM_ID ?? 'GTM-TKPFHC7B').trim()
  return {
  plugins: [
    {
      name: 'early-gtm',
      transformIndexHtml(html) {
        const scripts = /^GTM-[A-Z0-9]+$/.test(gtmId)
          ? `<script src="/gtm-init.js"></script>\n    <script id="ilyakav-gtm" async src="https://www.googletagmanager.com/gtm.js?id=${gtmId}"></script>`
          : ''
        return html.replace('<!-- gtm-head -->', scripts)
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
