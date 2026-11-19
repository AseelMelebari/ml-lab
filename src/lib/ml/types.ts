/** A point used by regression labs: one input feature x and a continuous target y. */
export interface RegPoint {
  id: string;
  x: number;
  y: number;
}

/** A point used by classification / clustering labs: two features (x, y) and an integer class label. */
export interface ClassPoint {
  id: string;
  x: number;
  y: number;
  label: number;
}

export interface Domain {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

let idCounter = 0;
export function nextId(prefix = 'p'): string {
  idCounter += 1;
  return `${prefix}${idCounter}`;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
