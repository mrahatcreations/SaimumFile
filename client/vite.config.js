import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8336,
    proxy: {
      '/api': {
        target: 'http://localhost:8335',
        changeOrigin: true,
      },
    },
  },
})
