import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-styled-components', { displayName: true, ssr: false }]],
      },
    }),
  ],
  server: { port: 5173, open: true },
})
