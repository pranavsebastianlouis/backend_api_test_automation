import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import { remoteEntryAliasPlugin } from '../vite-plugin-remote-entry-alias'

export default defineConfig({
  base: '/',
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    remoteEntryAliasPlugin(),
    react(),
    federation({
      name: 'cruises',
      filename: 'remoteEntry.js',
      exposes: {
        './CruiseSearchWidget': './src/mfe/CruiseSearchWidget.tsx',
      },
      remotes: {
        airlines: 'http://localhost:8001/assets/remoteEntry.js',
      },
      // Keep React as a single instance across host/remotes.
      shared: ['react', 'react-dom'],
    }),
  ],
  build: { modulePreload: false, target: 'esnext', minify: false, cssCodeSplit: false },
  server: { host: true, port: 8002, strictPort: true, cors: true },
  preview: { host: true, port: 8002, strictPort: true, cors: true },
})
