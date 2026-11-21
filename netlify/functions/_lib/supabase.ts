import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let client: SupabaseClient | null = null;

/** Service-role client. SERVER ONLY — bypasses RLS. Never import from src/. */
export function adminDb(): SupabaseClient {
  if (!client) {
    client = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Verifies the caller's Supabase JWT and that they are a store admin. */
export async function requireAdmin(req: Request): Promise<{ userId: string } | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const db = adminDb();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: role } = await db.from('admin_roles').select('user_id').eq('user_id', data.user.id).maybeSingle();
  return role ? { userId: data.user.id } : null;
}
