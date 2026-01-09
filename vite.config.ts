import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000
    // proxy: {
    //   '/data': {
    //     target: 'https://catincloud.io', 
    //     changeOrigin: true,
    //     secure: false
    //   }
    // }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('plotly')) return 'plotly';
          if (id.includes('recharts')) return 'recharts';
          if (id.includes('react-syntax-highlighter') || id.includes('refractor')) return 'syntax';
          if (id.includes('lucide-react')) return 'icons';
        }
      }
    },
    chunkSizeWarningLimit: 1500 
  }
});
