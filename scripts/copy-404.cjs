/**
 * Copia index.html para 404.html no build.
 * No GitHub Pages, ao acessar uma rota direta (ex.: /blockchain/patient),
 * o servidor retorna 404.html; com o mesmo conteúdo do index, o SPA carrega e o React Router resolve a rota.
 */
const fs = require('fs')
const path = require('path')

const dist = path.join(__dirname, '..', 'dist')
const indexPath = path.join(dist, 'index.html')
const notFoundPath = path.join(dist, '404.html')

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath)
  console.log('Copiado index.html → 404.html para suporte a rotas do SPA no GitHub Pages.')
} else {
  console.warn('dist/index.html não encontrado. Execute "npm run build" primeiro.')
}
