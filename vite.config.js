import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import syncVault from './api/sync-vault.js'
import vaultDrawing from './api/vault-drawing.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['GITHUB_TOKEN', 'VAULT_GITHUB_REPO', 'VAULT_FOLDER', 'OBSIDIAN_VAULT_NAME', 'VAULT_OWNER_USER_ID']) {
    if (env[key] !== undefined) process.env[key] = env[key]
  }
  return { plugins: [react(), {
    name: 'local-vault-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        const handler = { '/api/sync-vault': syncVault, '/api/vault-drawing': vaultDrawing }[url.pathname]
        if (!handler) return next()
        req.query = Object.fromEntries(url.searchParams)
        res.status = code => { res.statusCode = code; return res }
        res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)) }
        await handler(req, res)
      })
    },
  }] }
})
