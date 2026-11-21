import { adminDb } from './supabase';
import { renderEmail, type EmailOrder, type EmailContext } from './email-templates';
import { siteUrl } from './env';
import { logEvent } from './http';

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
  permanent?: boolean;
}

/** Sends one email through the Resend HTTP API. Acceptance ≠ inbox delivery. */
export async function sendViaResend(args: { to: string; subject: string; html: string; text: string; idempotencyKey: string }): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return { ok: false, error: 'RESEND_NOT_CONFIGURED' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Resend de-duplicates repeated requests with the same key for 24h
        'Idempotency-Key': args.idempotencyKey.slice(0, 256),
      },
      body: JSON.stringify({ from, to: [args.to], subject: args.subject, html: args.html, text: args.text }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (res.ok && body.id) return { ok: true, id: body.id };
    const transient = res.status === 429 || res.status >= 500;
    return { ok: false, error: `HTTP ${res.status}: ${body.name ?? ''} ${body.message ?? ''}`.trim(), permanent: !transient };
  } catch (e) {
    return { ok: false, error: `NETWORK: ${(e as Error).message}` };
  }
}

async function loadOrder(orderId: string): Promise<EmailOrder | null> {
  const { data, error } = await adminDb()
    .from('orders')
    .select('*, items:order_items(product_name_ar, variant_name, quantity, unit_price_halalas, line_total_halalas, notes, created_at)')
    .eq('id', orderId)
    .single();
  if (error || !data) return null;
  data.items.sort((a: any, b: any) => (a.created_at < b.created_at ? -1 : 1));
  return data as unknown as EmailOrder;
}

async function emailContext(): Promise<EmailContext> {
  const { data } = await adminDb().from('store_settings').select('whatsapp_number, store_name_ar').single();
  return {
    siteUrl: siteUrl(),
    logoUrl: process.env.EMAIL_LOGO_URL || undefined,
    whatsappDigits: data?.whatsapp_number ?? '966501131470',
    storeName: data?.store_name_ar ?? 'دَفوة',
  };
}

/**
 * Claims due notifications from the durable outbox and sends them.
 * Safe to run concurrently (rows are claimed with FOR UPDATE SKIP LOCKED).
 */
export async function processOutbox(opts: { orderId?: string; limit?: number } = {}) {
  const db = adminDb();
  const { data: claimed, error } = await db.rpc('dafwa_claim_emails', { p_limit: opts.limit ?? 20, p_order_id: opts.orderId ?? null });
  if (error) {
    logEvent('outbox_claim_failed', { error: error.message });
    return { processed: 0, sent: 0, failed: 0 };
  }
  const ctx = await emailContext();
  const cache = new Map<string, EmailOrder | null>();
  let sent = 0, failed = 0;

  for (const n of claimed ?? []) {
    let order = cache.get(n.order_id);
    if (order === undefined) {
      order = await loadOrder(n.order_id);
      cache.set(n.order_id, order);
    }
    let result: SendResult;
    if (!order) {
      result = { ok: false, error: 'ORDER_NOT_FOUND', permanent: true };
    } else {
      try {
        const email = renderEmail(n.kind, order, ctx);
        result = await sendViaResend({ to: n.recipient, ...email, idempotencyKey: n.dedupe_key });
      } catch (e) {
        result = { ok: false, error: `RENDER: ${(e as Error).message}`, permanent: true };
      }
    }
    await db.rpc('dafwa_complete_email', {
      p_id: n.id, p_ok: result.ok, p_provider_id: result.id ?? null, p_error: result.error ?? null, p_permanent: !!result.permanent,
    });
    if (result.ok) sent++;
    else failed++;
    logEvent(result.ok ? 'email_accepted' : 'email_failed', { notification: n.id, kind: n.kind, attempt: n.attempts, error: result.error });
  }
  return { processed: claimed?.length ?? 0, sent, failed };
}
