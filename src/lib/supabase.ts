import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase URL or Key. Leaderboard functionality will be disabled.');
}

export const isSupabaseEnabled = !!supabaseUrl && !!supabaseKey && supabaseUrl !== 'placeholder-url' && supabaseKey !== 'placeholder-key';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);
