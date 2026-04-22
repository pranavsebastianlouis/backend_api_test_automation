/**
 * Serves the federation bundle at both `/assets/remoteEntry.js` (Vite default)
 * and `/remoteEntry.js` so manual checks that omit `/assets/` load JS instead of the SPA
 * index.html fallback (which breaks Module Federation).
 */
import type { Connect, Plugin } from 'vite'

export function remoteEntryAliasPlugin(): Plugin {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    const raw = req.url ?? ''
    const pathOnly = raw.split('?')[0]
    if (pathOnly === '/remoteEntry.js') {
      const qs = raw.includes('?') ? '?' + raw.split('?').slice(1).join('?') : ''
      req.url = '/assets/remoteEntry.js' + qs
    }
    next()
  }

  return {
    name: 'remote-entry-alias',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}
