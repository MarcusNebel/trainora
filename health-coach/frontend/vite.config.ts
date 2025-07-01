import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/ask': {
        target: 'http://backend:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true,      // <- Wichtig für Docker, sonst erkennt er Änderungen nicht!
    },
  }
})