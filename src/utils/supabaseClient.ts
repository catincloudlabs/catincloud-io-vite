import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase Env Variables missing! The Knowledge Graph will not function.");
}

// Create the client with a fallback to prevent "White Screen" crashes
// If keys are missing, we pass empty strings which allows the app to load (but queries will fail gracefully)
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder-key"
);
