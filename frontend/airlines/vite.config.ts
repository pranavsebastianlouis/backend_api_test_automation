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
      name: 'airlines',
      filename: 'remoteEntry.js',
      // ── What THIS app exposes to other MFEs ──
      exposes: {
        './FlightSearchWidget': './src/mfe/FlightSearchWidget.tsx',
      },
      // ── Remote MFEs this app consumes ──
      remotes: {
        cruises: 'http://localhost:8002/assets/remoteEntry.js',
      },
      // Keep React as a single instance across host/remotes.
      // (The React hook crash you saw happens when React is duplicated.)
      shared: ['react', 'react-dom'],
    }),
  ],
  // Required for Module Federation to work correctly
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    // Bind IPv4 + IPv6 so localhost/127.0.0.1 and Playwright always reach the app (Windows often [::1]-only otherwise).
    host: true,
    port: 8001,
    strictPort: true,
    cors: true,
  },
  preview: {
    host: true,
    port: 8001,
    strictPort: true,
    cors: true,
  },
})
