import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    assetsDir: 'frontend-assets',
  },
  server: {
    proxy: {
      '/webhook': {
        target: 'http://localhost:7860',
        changeOrigin: true,
      },
      '/webhook-test': {
        target: 'http://localhost:7860',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:7860',
        changeOrigin: true,
      }
    }
  }
})
