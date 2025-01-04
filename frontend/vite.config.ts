import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    port: 4173,
    host: true
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@mui/material'],
          utils: ['axios', '@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
