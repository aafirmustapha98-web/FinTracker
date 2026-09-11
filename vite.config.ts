import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * L'application est publiée sur GitHub Pages sous https://<compte>.github.io/FinTracker/ :
 * le build utilise donc `/FinTracker/` comme chemin de base, surchargeable par
 * la variable d'environnement `VITE_BASE` (autre dépôt, sous-domaine, autre hébergeur).
 * En développement, la racine reste `/`.
 */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? process.env.VITE_BASE ?? '/FinTracker/' : '/',
}))
