/** k-Nearest Neighbors for classification and regression with selectable distance metrics and scaling. */
import type { ClassPoint } from './types';

export type DistanceMetric = 'euclidean' | 'manhattan' | 'chebyshev';

export function distance(a: readonly number[], b: readonly number[], metric: DistanceMetric): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    if (metric === 'euclidean') s += d * d;
    else if (metric === 'manhattan') s += d;
    else s = Math.max(s, d);
  }
  return metric === 'euclidean' ? Math.sqrt(s) : s;
}

/** Maps raw features to the space where distances are measured. */
export interface FeatureTransform {
  /** Multiplies feature 1 (simulates measuring it in different units). */
  xScale: number;
  /** Z-score standardization using the training-set mean and std. */
  standardize: boolean;
}

export function makeTransform(points: readonly ClassPoint[], t: FeatureTransform) {
  const xs = points.map((p) => p.x * t.xScale);
  const ys = points.map((p) => p.y);
  const stats = (v: number[]) => {
    const m = v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, v.length)) || 1;
    return { m, sd };
  };
  const sx = stats(xs);
  const sy = stats(ys);
  return (x: number, y: number): [number, number] => {
    const fx = x * t.xScale;
    return t.standardize ? [(fx - sx.m) / sx.sd, (y - sy.m) / sy.sd] : [fx, y];
  };
}

export interface Neighbor {
  index: number;
  distance: number;
}

/** Returns the k nearest training points, sorted by distance (stable on ties: lower index first). */
export function kNearest(
  train: readonly (readonly number[])[],
  query: readonly number[],
  k: number,
  metric: DistanceMetric,
): Neighbor[] {
  const all = train.map((p, index) => ({ index, distance: distance(p, query, metric) }));
  all.sort((a, b) => a.distance - b.distance || a.index - b.index);
  return all.slice(0, Math.max(1, Math.min(k, all.length)));
}

export interface KnnVote {
  label: number;
  votes: number[];
  neighbors: Neighbor[];
}

/**
 * Majority vote among neighbors. Ties are broken in favour of the tied class
 * whose nearest member is closest to the query (a common, deterministic rule).
 */
export function knnClassify(
  train: readonly (readonly number[])[],
  labels: readonly number[],
  nClasses: number,
  query: readonly number[],
  k: number,
  metric: DistanceMetric,
): KnnVote {
  const neighbors = kNearest(train, query, k, metric);
  const votes = new Array<number>(nClasses).fill(0);
  for (const nb of neighbors) votes[labels[nb.index]]++;
  const best = Math.max(...votes);
  let label = -1;
  for (const nb of neighbors) {
    const l = labels[nb.index];
    if (votes[l] === best) {
      label = l;
      break;
    }
  }
  return { label, votes, neighbors };
}

/** k-NN regression: mean target of the k nearest neighbors. */
export function knnRegress(
  train: readonly (readonly number[])[],
  targets: readonly number[],
  query: readonly number[],
  k: number,
  metric: DistanceMetric = 'euclidean',
): number {
  const nb = kNearest(train, query, k, metric);
  return nb.reduce((s, n) => s + targets[n.index], 0) / nb.length;
}
