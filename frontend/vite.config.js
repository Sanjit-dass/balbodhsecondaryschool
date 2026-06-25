import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Note: For production builds consider switching to @vitejs/plugin-react-oxc as recommended by Vite

// https://vite.dev/config/
const apiProxyTarget = process.env.VITE_API_URL || 'http://127.0.0.1:5003';

export default defineConfig({
  base: '/',
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
