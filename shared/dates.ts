export const TZ = 'Asia/Riyadh';

/** "2026-11-24" → "الثلاثاء 24 نوفمبر 2026" (Gregorian, Latin digits). */
export function formatDateAr(isoDate: string, opts: { weekday?: boolean; year?: boolean } = {}): string {
  const d = new Date(`${isoDate}T12:00:00+03:00`);
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
    timeZone: TZ,
    weekday: opts.weekday === false ? undefined : 'long',
    day: 'numeric',
    month: 'long',
    year: opts.year ? 'numeric' : undefined,
  }).format(d);
}

export function formatDateTimeAr(ts: string | Date): string {
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
    timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(ts));
}

/** "16:00" → "4:00 م" */
export function formatTimeAr(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'م' : 'ص';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Today's date in Riyadh as YYYY-MM-DD */
export function riyadhToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
