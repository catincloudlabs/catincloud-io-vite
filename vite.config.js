import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/data': {
        // Points to Cloudflare production for local development
        target: 'https://catincloud.io', 
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 1. Core React (caches forever)
          'react-vendor': ['react', 'react-dom'],
          
          // 2. Plotly (Custom Bundle)
          // Explicitly groups the core + specific modules into one file.
          'plotly': [
            'react-plotly.js',
            'plotly.js/lib/core',
            'plotly.js/lib/scatter',
            'plotly.js/lib/bar',
            'plotly.js/lib/pie',
            'plotly.js/lib/heatmap',
            'plotly.js/lib/scatterpolar'
          ], 
          
          // 3. Recharts (Heavy chart library, kept separate)
          'recharts': ['recharts'],
          
          // 4. Icons (Lightweight - needed immediately for Header/UI)
          'icons': ['lucide-react', 'clsx'],

          // 5. Syntax Highlighter (Heavy - loaded ONLY when Logic Modal opens)
          'syntax': ['react-syntax-highlighter']
        }
      }
    },
    // Adjusted warning limit since chunks are now optimized
    chunkSizeWarningLimit: 1000 
  }
})
