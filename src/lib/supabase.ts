import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anon);

/** Public client (anon key). All access is governed by Row Level Security. */
export const supabase = createClient(url || 'http://localhost:54321', anon || 'public-anon-key-missing', {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'dafwa-auth' },
});
