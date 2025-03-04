import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
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
