import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Note: For production builds consider switching to @vitejs/plugin-react-oxc as recommended by Vite

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
