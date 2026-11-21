import type { Context } from '@netlify/functions';
import { adminDb } from './_lib/supabase';
import { json, errorJson, hashKey, clientIp } from './_lib/http';

/** POST /api/order-receipt {order_id, key} — re-fetches the customer's own receipt. */
export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') return errorJson('METHOD_NOT_ALLOWED', 405);
  const body = (await req.json().catch(() => null)) as { order_id?: string; key?: string } | null;
  if (!body?.order_id || !body.key || !/^[0-9a-f-]{36}$/i.test(body.order_id) || body.key.length < 16) return errorJson('INVALID_REQUEST');
  const db = adminDb();
  const { data: ok } = await db.rpc('dafwa_rate_limit_hit', { p_key: `receipt:${hashKey(clientIp(req, context))}`, p_window_seconds: 600, p_max: 60 });
  if (ok === false) return errorJson('RATE_LIMITED', 429);
  const { data } = await db.rpc('dafwa_order_receipt', { p_order_id: body.order_id, p_key: body.key });
  if (!data) return errorJson('NOT_FOUND', 404);
  return json({ ok: true, receipt: data });
};
