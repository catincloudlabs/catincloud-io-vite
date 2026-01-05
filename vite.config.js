import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/data': {
        target: 'https://catincloud-io-public.s3.us-east-2.amazonaws.com/data',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/data/, '') 
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 1. Core React (caches forever)
          'react-vendor': ['react', 'react-dom'],
          
          // 2. Plotly (UPDATED: Now using the lightweight Basic version)
          'plotly': ['react-plotly.js', 'plotly.js-basic-dist'], 
          
          // 3. Recharts (Another heavy chart library, best kept separate)
          'recharts': ['recharts'],
          
          // 4. UI Utilities (Icons and Syntax Highlighting)
          'ui-utils': ['lucide-react', 'react-syntax-highlighter', 'clsx']
        }
      }
    },
    // We can lower this now because the basic Plotly bundle is much smaller (~1MB)
    chunkSizeWarningLimit: 1000 
  }
})
