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
          
          // 2. Plotly (The biggest file - matched to your package.json)
          'plotly': ['react-plotly.js', 'plotly.js'], 
          
          // 3. Recharts (Another heavy chart library, best kept separate)
          'recharts': ['recharts'],
          
          // 4. UI Utilities (Icons and Syntax Highlighting)
          'ui-utils': ['lucide-react', 'react-syntax-highlighter', 'clsx']
        }
      }
    },
    // Plotly alone is ~3MB, so we raise the warning limit to stop the console spam
    chunkSizeWarningLimit: 1600 
  }
})
