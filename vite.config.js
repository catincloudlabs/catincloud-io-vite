import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/data': {
        // FIXED: Added '.io' (assuming catincloud.io is your domain)
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
          
          // 2. Plotly (Lightweight Basic Version)
          'plotly': ['react-plotly.js', 'plotly.js-basic-dist'], 
          
          // 3. Recharts (Heavy chart library, kept separate)
          'recharts': ['recharts'],
          
          // --- SPLIT UI UTILITIES HERE ---
          
          // 4. Icons (Lightweight - needed immediately for Header/UI)
          'icons': ['lucide-react', 'clsx'],

          // 5. Syntax Highlighter (Heavy - loaded ONLY when Logic Modal opens)
          'syntax': ['react-syntax-highlighter']
        }
      }
    },
    chunkSizeWarningLimit: 1000 
  }
})
