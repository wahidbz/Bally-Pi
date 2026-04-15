import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-physics': ['matter-js'],
          'vendor-anim': ['framer-motion'],
          'vendor-audio': ['howler'],
        }
      }
    }
  },
  server: {
    port: 5173
  }
})
