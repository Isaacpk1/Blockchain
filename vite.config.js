import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Para GitHub Pages: use o nome do repositório. Ex.: repo "blockchain" → base: '/Blockchain/'
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'Blockchain'

export default defineConfig({
  base: `/${repoName}/`,
  plugins: [react()],
})
