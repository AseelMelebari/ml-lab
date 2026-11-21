import type { Context } from '@netlify/functions';
import { checkoutSchema } from '../../shared/checkout-schema';
import { errorCode } from '../../shared/labels';
import { adminDb } from './_lib/supabase';
import { json, errorJson, hashKey, clientIp, logEvent } from './_lib/http';
import { processOutbox } from './_lib/outbox';

/**
 * POST /api/create-order
 * Validates input, then delegates ALL pricing / zone / slot / capacity checks
 * to the transactional database function dafwa_create_order().
 */
export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') return errorJson('METHOD_NOT_ALLOWED', 405);
  const db = adminDb();

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorJson('INVALID_REQUEST');
  }

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return json({ ok: false, code: 'VALIDATION', message: issue?.message, path: issue?.path.join('.') }, 422);
  }
  const input = parsed.data;
  if (input.website) return errorJson('INVALID_REQUEST'); // honeypot

  // Anti-abuse: 10 attempts / 10 min per IP, 6 orders / hour per phone.
  const ip = clientIp(req, context);
  const [ipOk, phoneOk] = await Promise.all([
    db.rpc('dafwa_rate_limit_hit', { p_key: `order-ip:${hashKey(ip)}`, p_window_seconds: 600, p_max: 10 }),
    db.rpc('dafwa_rate_limit_hit', { p_key: `order-phone:${hashKey(input.customer.phone)}`, p_window_seconds: 3600, p_max: 6 }),
  ]);
  if (ipOk.data === false || phoneOk.data === false) return errorJson('RATE_LIMITED', 429);

  const { website: _hp, ...payload } = input;
  const { data, error } = await db.rpc('dafwa_create_order', { p: payload });
  if (error) {
    const code = errorCode(error.message);
    logEvent('order_rejected', { code: code ?? 'UNKNOWN', detail: code ? undefined : error.message });
    return json({ ok: false, code: code ?? 'SERVER_ERROR', detail: code ? error.details : undefined }, code ? 409 : 500);
  }

  const orderId: string = data.order_id;
  logEvent(data.duplicate ? 'order_duplicate' : 'order_created', { order: data.order_number });

  // Try to send notifications right away; failures stay queued for the scheduled retry worker.
  if (!data.duplicate) {
    try {
      await Promise.race([processOutbox({ orderId }), new Promise((r) => setTimeout(r, 7000))]);
    } catch (e) {
      logEvent('outbox_inline_failed', { error: (e as Error).message });
    }
  }

  const { data: receipt } = await db.rpc('dafwa_order_receipt', { p_order_id: orderId, p_key: input.idempotency_key });
  return json({ ok: true, duplicate: data.duplicate, receipt });
};
