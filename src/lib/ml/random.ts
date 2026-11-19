/** Seeded pseudo-random utilities so every stochastic simulation is reproducible. */
export type RNG = () => number;

/** Mulberry32: tiny, fast, well-distributed 32-bit PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample via the Box–Muller transform. */
export function gaussian(rng: RNG): number {
  let u = 0;
  while (u <= Number.EPSILON) u = rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function randInt(rng: RNG, maxExclusive: number): number {
  return Math.min(maxExclusive - 1, Math.floor(rng() * maxExclusive));
}

export function uniform(rng: RNG, min: number, max: number): number {
  return min + (max - min) * rng();
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(arr: readonly T[], rng: RNG): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Sample k distinct indices from [0, n). */
export function sampleWithoutReplacement(n: number, k: number, rng: RNG): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  return shuffle(idx, rng).slice(0, Math.min(k, n));
}
