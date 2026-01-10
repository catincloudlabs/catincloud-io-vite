import { createClient } from '@supabase/supabase-js';

// Debugging log - Check your browser console to see what prints here!
console.log("Supabase Config Check:", {
  URL: import.meta.env.VITE_SUPABASE_URL,
  KEY_EXISTS: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Supabase Env Variables missing! Check your .env file.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder-key"
);
