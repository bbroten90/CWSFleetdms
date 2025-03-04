import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@services': '/src/services'
    }
  },
  server: {
    port: 5174, // Force consistent port
    strictPort: true, // Fail if port is already in use
    hmr: {
      overlay: false // Disable error overlay
    }
  }
})
