/**
 * Agglomerative hierarchical clustering with Lance–Williams distance updates.
 * Cluster ids follow SciPy: leaves are 0..n−1, the i-th merge creates cluster n+i.
 */

export type Linkage = 'single' | 'complete' | 'average' | 'ward';

export interface Merge {
  a: number;
  b: number;
  distance: number;
  size: number;
  /** Original point indices contained in the new cluster. */
  members: number[];
}

export function euclidean(a: readonly number[], b: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

export function agglomerative(points: readonly (readonly number[])[], linkage: Linkage): Merge[] {
  const n = points.length;
  if (n < 2) return [];
  // Active cluster slots: D[i][j] = distance between active clusters in slots i and j.
  const D: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : euclidean(points[i], points[j]))),
  );
  const active = new Array<boolean>(n).fill(true);
  const size = new Array<number>(n).fill(1);
  const clusterId = Array.from({ length: n }, (_, i) => i);
  const members: number[][] = Array.from({ length: n }, (_, i) => [i]);
  const merges: Merge[] = [];

  for (let step = 0; step < n - 1; step++) {
    let bi = -1;
    let bj = -1;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      if (!active[i]) continue;
      for (let j = i + 1; j < n; j++) {
        if (!active[j]) continue;
        if (D[i][j] < bd - 1e-12) {
          bd = D[i][j];
          bi = i;
          bj = j;
        }
      }
    }
    const si = size[bi];
    const sj = size[bj];
    // Lance–Williams update of the distance from the merged cluster (stored in slot bi) to every k.
    for (let k = 0; k < n; k++) {
      if (!active[k] || k === bi || k === bj) continue;
      const dik = D[bi][k];
      const djk = D[bj][k];
      let d: number;
      switch (linkage) {
        case 'single':
          d = Math.min(dik, djk);
          break;
        case 'complete':
          d = Math.max(dik, djk);
          break;
        case 'average':
          d = (si * dik + sj * djk) / (si + sj);
          break;
        case 'ward': {
          const sk = size[k];
          const T = si + sj + sk;
          d = Math.sqrt(Math.max(0, ((si + sk) / T) * dik * dik + ((sj + sk) / T) * djk * djk - (sk / T) * bd * bd));
          break;
        }
      }
      D[bi][k] = d;
      D[k][bi] = d;
    }
    const merged = [...members[bi], ...members[bj]];
    merges.push({
      a: Math.min(clusterId[bi], clusterId[bj]),
      b: Math.max(clusterId[bi], clusterId[bj]),
      distance: bd,
      size: si + sj,
      members: merged,
    });
    active[bj] = false;
    size[bi] = si + sj;
    members[bi] = merged;
    clusterId[bi] = n + step;
  }
  return merges;
}

/** Apply the first `steps` merges and return a cluster label (0..k−1) per point. */
export function labelsAfterSteps(n: number, merges: readonly Merge[], steps: number): number[] {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (let s = 0; s < Math.min(steps, merges.length); s++) {
    const m = merges[s].members;
    for (let k = 1; k < m.length; k++) {
      const ra = find(m[0]);
      const rb = find(m[k]);
      if (ra !== rb) parent[rb] = ra;
    }
  }
  const map = new Map<number, number>();
  return Array.from({ length: n }, (_, i) => {
    const r = find(i);
    if (!map.has(r)) map.set(r, map.size);
    return map.get(r)!;
  });
}

/** Cut the dendrogram at a height: merges with distance ≤ threshold are applied. */
export function cutAtHeight(n: number, merges: readonly Merge[], threshold: number): number[] {
  let steps = 0;
  while (steps < merges.length && merges[steps].distance <= threshold) steps++;
  return labelsAfterSteps(n, merges, steps);
}

/** Cut to obtain exactly k clusters. */
export const cutToK = (n: number, merges: readonly Merge[], k: number) =>
  labelsAfterSteps(n, merges, Math.max(0, n - Math.max(1, Math.min(n, k))));

export interface DendroNode {
  id: number;
  x: number;
  height: number;
}

/** Layout: leaf order from a depth-first traversal so that branches never cross. */
export function dendrogramLayout(n: number, merges: readonly Merge[]) {
  const children = new Map<number, [number, number]>();
  merges.forEach((m, i) => children.set(n + i, [m.a, m.b]));
  const rootId = n + merges.length - 1;
  const order: number[] = [];
  const walk = (id: number) => {
    const c = children.get(id);
    if (!c) order.push(id);
    else {
      walk(c[0]);
      walk(c[1]);
    }
  };
  if (merges.length > 0) walk(rootId);
  else for (let i = 0; i < n; i++) order.push(i);
  const pos = new Map<number, DendroNode>();
  order.forEach((leaf, i) => pos.set(leaf, { id: leaf, x: i, height: 0 }));
  merges.forEach((m, i) => {
    const a = pos.get(m.a)!;
    const b = pos.get(m.b)!;
    pos.set(n + i, { id: n + i, x: (a.x + b.x) / 2, height: m.distance });
  });
  return { order, pos };
}
