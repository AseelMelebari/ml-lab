/** K-Means (Lloyd's algorithm) exposed step by step: assignment and centroid-update phases. */
import { mulberry32, randInt, sampleWithoutReplacement, type RNG } from './random';

export type Vec2 = [number, number];
export type KMeansInit = 'random' | 'kmeans++';

const sq = (a: Vec2, b: Vec2) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

/** Forgy (random distinct data points) or k-means++ seeding. */
export function initCentroids(points: readonly Vec2[], k: number, method: KMeansInit, rng: RNG): Vec2[] {
  const n = points.length;
  if (n === 0) return [];
  const kk = Math.min(k, n);
  if (method === 'random') return sampleWithoutReplacement(n, kk, rng).map((i) => [...points[i]] as Vec2);
  const centroids: Vec2[] = [[...points[randInt(rng, n)]] as Vec2];
  while (centroids.length < kk) {
    const d2 = points.map((p) => Math.min(...centroids.map((c) => sq(p, c))));
    const total = d2.reduce((a, b) => a + b, 0);
    if (total === 0) break;
    let r = rng() * total;
    let chosen = n - 1;
    for (let i = 0; i < n; i++) {
      r -= d2[i];
      if (r <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push([...points[chosen]] as Vec2);
  }
  return centroids;
}

/** Assignment step: each point joins its nearest centroid (ties → lower index). */
export function assignClusters(points: readonly Vec2[], centroids: readonly Vec2[]): number[] {
  return points.map((p) => {
    let best = 0;
    let bd = Infinity;
    centroids.forEach((c, i) => {
      const d = sq(p, c);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  });
}

/** Update step: each centroid moves to the mean of its points. Empty clusters keep their position. */
export function updateCentroids(points: readonly Vec2[], labels: readonly number[], centroids: readonly Vec2[]): Vec2[] {
  const sums = centroids.map(() => [0, 0, 0]);
  points.forEach((p, i) => {
    const s = sums[labels[i]];
    s[0] += p[0];
    s[1] += p[1];
    s[2]++;
  });
  return centroids.map((c, i) => (sums[i][2] > 0 ? [sums[i][0] / sums[i][2], sums[i][1] / sums[i][2]] : [...c]) as Vec2);
}

/** Within-cluster sum of squared distances. */
export function inertia(points: readonly Vec2[], labels: readonly number[], centroids: readonly Vec2[]): number {
  return points.reduce((s, p, i) => s + sq(p, centroids[labels[i]]), 0);
}

export interface KMeansResult {
  centroids: Vec2[];
  labels: number[];
  inertia: number;
  iterations: number;
  converged: boolean;
  history: { centroids: Vec2[]; inertia: number }[];
}

export function runKMeans(
  points: readonly Vec2[],
  k: number,
  opts: { init?: KMeansInit; seed?: number; maxIter?: number; initial?: Vec2[] } = {},
): KMeansResult {
  const rng = mulberry32(opts.seed ?? 1);
  let centroids = opts.initial ?? initCentroids(points, k, opts.init ?? 'kmeans++', rng);
  let labels = assignClusters(points, centroids);
  const history = [{ centroids, inertia: inertia(points, labels, centroids) }];
  const maxIter = opts.maxIter ?? 100;
  let converged = false;
  let it = 0;
  for (; it < maxIter; it++) {
    const next = updateCentroids(points, labels, centroids);
    const nextLabels = assignClusters(points, next);
    const moved = next.some((c, i) => sq(c, centroids[i]) > 1e-18);
    const changed = nextLabels.some((l, i) => l !== labels[i]);
    centroids = next;
    labels = nextLabels;
    history.push({ centroids, inertia: inertia(points, labels, centroids) });
    if (!moved && !changed) {
      converged = true;
      break;
    }
  }
  return { centroids, labels, inertia: inertia(points, labels, centroids), iterations: it, converged, history };
}

/** Elbow curve: best inertia over several k-means++ restarts for k = 1..kMax. */
export function elbowCurve(points: readonly Vec2[], kMax: number, restarts = 5, seed = 7): number[] {
  const out: number[] = [];
  for (let k = 1; k <= Math.min(kMax, points.length); k++) {
    let best = Infinity;
    for (let r = 0; r < restarts; r++) best = Math.min(best, runKMeans(points, k, { seed: seed + 31 * r + k }).inertia);
    out.push(best);
  }
  return out;
}
