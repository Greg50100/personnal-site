import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT : Le nom du dépôt GitHub entre les slashes.
  // Si votre dépôt s'appelle "mon-portfolio", mettez base: '/mon-portfolio/'
  base: '/personnal-site/', 
})
