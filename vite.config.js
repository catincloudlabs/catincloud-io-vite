import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // This tells Vite: "Forward any request starting with /data to S3"
      '/data': {
        target: 'https://catincloud-io-public.s3.us-east-2.amazonaws.com/data',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/data/, '') 
      }
    }
  }
})
