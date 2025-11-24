import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT : Remplacez 'personnal-site' par le nom exact de votre dépôt GitHub s'il est différent
  base: '/personnal-site/', 
})
