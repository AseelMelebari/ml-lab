import { requireAdmin } from './_lib/supabase';
import { json, errorJson } from './_lib/http';
import { processOutbox } from './_lib/outbox';

/** POST /api/email-dispatch {order_id?} — admin-only: sends queued emails now. */
export default async (req: Request) => {
  if (req.method !== 'POST') return errorJson('METHOD_NOT_ALLOWED', 405);
  const admin = await requireAdmin(req);
  if (!admin) return errorJson('FORBIDDEN', 403);
  const body = (await req.json().catch(() => ({}))) as { order_id?: string };
  const result = await processOutbox({ orderId: body.order_id, limit: 30 });
  return json({ ok: true, ...result });
};
