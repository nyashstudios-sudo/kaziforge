import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn("⚠️ Using dummy Supabase config. Auth and DB features will not work until you add real keys.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);