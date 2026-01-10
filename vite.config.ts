import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Load env vars available to the build process
  const env = loadEnv(mode, process.cwd(), '');

  // --- CLOUDFLARE DEBUG LOG ---
  console.log("🔍 CLOUDFLARE BUILD DEBUG:");
  console.log("------------------------------------------------");
  console.log("Target Mode:", mode);
  console.log("VITE_SUPABASE_URL:", env.VITE_SUPABASE_URL ? "✅ DETECTED" : "❌ MISSING");
  console.log("VITE_ANON_KEY:", env.VITE_SUPABASE_ANON_KEY ? "✅ DETECTED" : "❌ MISSING");
  
  if (env.VITE_SUPABASE_URL) {
      console.log("Value Preview:", env.VITE_SUPABASE_URL.substring(0, 15) + "...");
  }
  console.log("------------------------------------------------");
  // -----------------------------

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 3000 },
    build: { chunkSizeWarningLimit: 1500 }
  };
});
