import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/data': {
        target: 'https://catincloud.io', 
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 1. Caches React Core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // 2. Caches ALL Plotly related code (The Fix)
          // This catches 'plotly.js', 'react-plotly.js', and your 'plotly-custom.js'
          // keeping them in the same scope so registration works.
          if (id.includes('plotly')) {
            return 'plotly';
          }

          // 3. Caches Recharts
          if (id.includes('recharts')) {
            return 'recharts';
          }

          // 4. Caches Syntax Highlighter (Heavy)
          if (id.includes('react-syntax-highlighter') || id.includes('refractor')) {
            return 'syntax';
          }

          // 5. Caches Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1500 
  }
})
