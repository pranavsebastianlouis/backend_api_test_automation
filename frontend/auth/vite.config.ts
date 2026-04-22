import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { host: true, port: 8003, strictPort: true, cors: true },
  preview: { host: true, port: 8003, strictPort: true, cors: true },
})
