/**
 * Synthetic educational datasets. Every generator is deterministic for a given seed.
 * These are clearly synthetic — they are NOT real-world measurements.
 */
import { gaussian, mulberry32, uniform, type RNG } from './random';
import { clamp, nextId, type ClassPoint, type Domain, type RegPoint } from './types';

export const REG_DOMAIN: Domain = { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
export const CLASS_DOMAIN: Domain = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };

export type RegressionDatasetId = 'linear' | 'noisy' | 'outliers' | 'curved' | 'flat';
export type ClassificationDatasetId =
  | 'separable'
  | 'overlap'
  | 'moons'
  | 'circles'
  | 'xor'
  | 'imbalanced'
  | 'threeBlobs';
export type ClusterDatasetId = 'blobs3' | 'blobs4' | 'uneven' | 'elongated' | 'rings' | 'uniform';

const cx = (v: number) => clamp(v, CLASS_DOMAIN.xMin + 0.1, CLASS_DOMAIN.xMax - 0.1);
const cy = (v: number) => clamp(v, CLASS_DOMAIN.yMin + 0.1, CLASS_DOMAIN.yMax - 0.1);

export function makeRegression(id: RegressionDatasetId, n: number, seed: number): RegPoint[] {
  const rng = mulberry32(seed);
  const pts: RegPoint[] = [];
  for (let i = 0; i < n; i++) {
    const x = uniform(rng, 0.5, 9.5);
    let y: number;
    switch (id) {
      case 'linear':
        y = 0.7 * x + 1.5 + gaussian(rng) * 0.35;
        break;
      case 'noisy':
        y = 0.6 * x + 2 + gaussian(rng) * 1.4;
        break;
      case 'outliers':
        y = 0.65 * x + 1.8 + gaussian(rng) * 0.4;
        if (i % 9 === 4) y += 3.5 + rng() * 1.5;
        break;
      case 'curved':
        y = 0.12 * (x - 5) ** 2 + 2.2 + gaussian(rng) * 0.35;
        break;
      case 'flat':
      default:
        y = 5 + gaussian(rng) * 1.2;
    }
    pts.push({ id: nextId('r'), x, y: clamp(y, 0.1, 9.9) });
  }
  return pts;
}

function blob(rng: RNG, mx: number, my: number, s: number, label: number): ClassPoint {
  return { id: nextId('c'), x: cx(mx + gaussian(rng) * s), y: cy(my + gaussian(rng) * s), label };
}

export function makeClassification(id: ClassificationDatasetId, n: number, seed: number): ClassPoint[] {
  const rng = mulberry32(seed);
  const pts: ClassPoint[] = [];
  const half = Math.floor(n / 2);
  switch (id) {
    case 'separable':
      for (let i = 0; i < n; i++) {
        const label = i < half ? 0 : 1;
        pts.push(label === 0 ? blob(rng, -2.2, -1.6, 0.9, 0) : blob(rng, 2.0, 1.8, 0.9, 1));
      }
      break;
    case 'overlap':
      for (let i = 0; i < n; i++) {
        const label = i < half ? 0 : 1;
        pts.push(label === 0 ? blob(rng, -1.1, -0.8, 1.5, 0) : blob(rng, 1.1, 0.9, 1.5, 1));
      }
      break;
    case 'moons':
      for (let i = 0; i < n; i++) {
        const label = i < half ? 0 : 1;
        const t = Math.PI * rng();
        const r = 2.6;
        const x = label === 0 ? r * Math.cos(t) - 1.3 : r * Math.cos(t) + 1.3;
        const y = label === 0 ? r * Math.sin(t) - 0.9 : -r * Math.sin(t) + 0.9;
        pts.push({ id: nextId('c'), x: cx(x + gaussian(rng) * 0.3), y: cy(y + gaussian(rng) * 0.3), label });
      }
      break;
    case 'circles':
      for (let i = 0; i < n; i++) {
        const label = i < half ? 0 : 1;
        const t = 2 * Math.PI * rng();
        const r = label === 0 ? 3.5 : 1.4;
        pts.push({
          id: nextId('c'),
          x: cx(r * Math.cos(t) + gaussian(rng) * 0.35),
          y: cy(r * Math.sin(t) + gaussian(rng) * 0.35),
          label,
        });
      }
      break;
    case 'xor':
      for (let i = 0; i < n; i++) {
        const q = i % 4;
        const sx = q === 0 || q === 3 ? 1 : -1;
        const sy = q === 0 || q === 1 ? 1 : -1;
        const label = sx * sy > 0 ? 0 : 1;
        pts.push(blob(rng, sx * 2.2, sy * 2.2, 0.9, label));
      }
      break;
    case 'imbalanced': {
      const minority = Math.max(3, Math.round(n * 0.12));
      for (let i = 0; i < n; i++) {
        const label = i < n - minority ? 0 : 1;
        pts.push(label === 0 ? blob(rng, -0.8, -0.6, 1.6, 0) : blob(rng, 1.9, 1.7, 0.8, 1));
      }
      break;
    }
    case 'threeBlobs':
    default: {
      const centers = [
        [-2.6, -2],
        [2.6, -1.8],
        [0, 2.7],
      ];
      for (let i = 0; i < n; i++) {
        const label = i % 3;
        pts.push(blob(rng, centers[label][0], centers[label][1], 0.95, label));
      }
    }
  }
  return pts;
}

/** Cluster datasets: points carry a hidden "true" label used only for reference, never by the algorithm. */
export function makeClusters(id: ClusterDatasetId, n: number, seed: number): ClassPoint[] {
  const rng = mulberry32(seed);
  const pts: ClassPoint[] = [];
  const centersFor: Record<string, number[][]> = {
    blobs3: [
      [-2.5, -2],
      [2.5, -1.5],
      [0, 2.6],
    ],
    blobs4: [
      [-2.8, -2.6],
      [2.6, -2.6],
      [-2.6, 2.6],
      [2.6, 2.4],
    ],
  };
  switch (id) {
    case 'blobs3':
    case 'blobs4': {
      const c = centersFor[id];
      for (let i = 0; i < n; i++) pts.push(blob(rng, c[i % c.length][0], c[i % c.length][1], 0.8, i % c.length));
      break;
    }
    case 'uneven':
      for (let i = 0; i < n; i++) {
        if (i % 5 < 3) pts.push(blob(rng, -1.8, -0.5, 1.4, 0));
        else if (i % 5 === 3) pts.push(blob(rng, 2.8, 2.6, 0.4, 1));
        else pts.push(blob(rng, 3, -2.8, 0.4, 2));
      }
      break;
    case 'elongated':
      for (let i = 0; i < n; i++) {
        const label = i % 2;
        const t = uniform(rng, -3.8, 3.8);
        pts.push({
          id: nextId('c'),
          x: cx(t + gaussian(rng) * 0.25),
          y: cy((label === 0 ? -1.1 : 1.1) + 0.25 * t + gaussian(rng) * 0.25),
          label,
        });
      }
      break;
    case 'rings':
      return makeClassification('circles', n, seed);
    case 'uniform':
    default:
      for (let i = 0; i < n; i++)
        pts.push({ id: nextId('c'), x: uniform(rng, -4.5, 4.5), y: uniform(rng, -4.5, 4.5), label: 0 });
  }
  return pts;
}

/** Deterministic train/test split. Returns index arrays. */
export function trainTestSplit(n: number, testFraction: number, seed: number): { train: number[]; test: number[] } {
  const rng = mulberry32(seed);
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const nTest = Math.round(n * testFraction);
  return { test: idx.slice(0, nTest), train: idx.slice(nTest) };
}
