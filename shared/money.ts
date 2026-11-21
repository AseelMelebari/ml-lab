const nf = new Intl.NumberFormat('ar-SA-u-nu-latn', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** 1550 halalas → "15.5 ر.س" */
export function formatSAR(halalas: number | string | null | undefined): string {
  const n = Number(halalas ?? 0) / 100;
  return `${nf.format(n)} ر.س`;
}

export function sarToHalalas(sar: string | number): number {
  const n = typeof sar === 'number' ? sar : Number(String(sar).replace(/,/g, '').trim());
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

export function halalasToSar(h: number | null | undefined): string {
  if (h == null) return '';
  return (h / 100).toFixed(2).replace(/\.00$/, '');
}
