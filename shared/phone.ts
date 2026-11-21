/**
 * Normalises Saudi mobile numbers to E.164 (+9665XXXXXXXX).
 * Accepts: 05XXXXXXXX, 5XXXXXXXX, +9665XXXXXXXX, 9665XXXXXXXX, 009665XXXXXXXX,
 * with spaces/dashes, and Arabic-Indic digits (٠-٩ / ۰-۹).
 */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

export function normalizeSaudiMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = toLatinDigits(String(raw)).replace(/[\s\-().]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('00')) s = s.slice(2);
  if (s.startsWith('966')) s = s.slice(3);
  if (s.startsWith('0')) s = s.slice(1);
  return /^5\d{8}$/.test(s) ? `+966${s}` : null;
}

/** +966501131470 → 0501131470 (local display) */
export function formatSaudiMobileLocal(e164: string): string {
  return e164.startsWith('+966') ? `0${e164.slice(4)}` : e164;
}

/** +966501131470 → 966501131470 (for wa.me links) */
export function waDigits(phone: string): string {
  const n = normalizeSaudiMobile(phone);
  return (n ?? phone).replace(/\D/g, '');
}
