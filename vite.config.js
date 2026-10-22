import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // En production le site est servi par GitHub Pages sous /<nom-du-dépôt>/.
  // Pour un domaine personnel (ou un dépôt <utilisateur>.github.io), remplacer par '/'.
  base: command === 'build' || isPreview ? '/personnal-site/' : '/',
  build: {
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
}))
