import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site: https://majjieswarkumar2006-eng.github.io/class2ppt/
  base: '/class2ppt/',
  build: {
    // Avoid Jekyll reserved "assets" folder on GitHub Pages
    assetsDir: 'static',
  },
})
