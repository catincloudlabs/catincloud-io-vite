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
          // 1. React Vendor (Keep this)
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // 2. D3 Vendor (New)
          // Groups d3-array, d3-scale, etc. into one cacheable file
          if (id.includes('node_modules/d3-')) {
            return 'd3-vendor';
          }

          // 3. Icons (Keep if using Lucide)
          if (id.includes('lucide-react')) {
            return 'icons';
          }

          // REMOVED: Plotly, Recharts, SyntaxHighlighter
          // (Ensure you npm uninstall these packages to keep node_modules clean)
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Lowered slightly as D3/Canvas is lighter than Plotly
  }
})
