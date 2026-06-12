import { createClient } from '@supabase/supabase-js';

// Prevent crash if VITE_SUPABASE_URL is missing or invalid
let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/['"]/g, '').trim();
if (!supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://placeholder.supabase.co';
}
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').replace(/['"]/g, '').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
