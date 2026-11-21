import { createHash } from 'node:crypto';

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });
}

export function errorJson(code: string, status = 400, message?: string) {
  return json({ ok: false, code, message }, status);
}

export function hashKey(value: string): string {
  return createHash('sha256').update(`${process.env.RATE_LIMIT_SALT ?? 'dafwa'}:${value}`).digest('hex').slice(0, 32);
}

export function clientIp(req: Request, context?: { ip?: string }): string {
  return context?.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

/** Logs without personal data: only codes and ids. */
export function logEvent(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ event, ...data, at: new Date().toISOString() }));
}
