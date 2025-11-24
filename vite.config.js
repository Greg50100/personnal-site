import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    base: '/',
  }

  // Si on construit pour la production (GitHub Pages), on ajoute le nom du dépôt
  if (command !== 'serve') {
    // IMPORTANT : Assurez-vous que 'personnal-site' correspond EXACTEMENT au nom de votre dépôt GitHub
    config.base = '/personnal-site/'
  }

  return config
})
