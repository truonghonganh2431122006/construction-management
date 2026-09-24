import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import process from 'node:process'

const proxy = {
  '/auth': {
    target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000',
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy,
  },
  preview: { proxy },
})
