import { describe, expect, it } from 'vitest';
import { assignClusters, updateCentroids, inertia, runKMeans, initCentroids, elbowCurve, type Vec2 } from '../kmeans';
import { fitPCA, pcaTransform, pcaInverse, reconstructionError, varianceAlong, sampleCorrelated } from '../pca';
import { agglomerative, cutAtHeight, cutToK, dendrogramLayout, labelsAfterSteps } from '../hierarchical';
import { mulberry32 } from '../random';
import { makeClusters } from '../datasets';

describe('k-means', () => {
  const pts: Vec2[] = [[0, 0], [0, 1], [1, 0], [10, 10], [10, 11], [11, 10]];
  it('assignment step picks the nearest centroid', () => {
    expect(assignClusters(pts, [[0, 0], [10, 10]])).toEqual([0, 0, 0, 1, 1, 1]);
  });
  it('update step computes means and keeps empty clusters fixed', () => {
    const c = updateCentroids(pts, [0, 0, 0, 1, 1, 1], [[0, 0], [5, 5]]);
    expect(c[0][0]).toBeCloseTo(1 / 3);
    expect(c[1][1]).toBeCloseTo(31 / 3);
    const e = updateCentroids(pts, [0, 0, 0, 0, 0, 0], [[0, 0], [99, 99]]);
    expect(e[1]).toEqual([99, 99]);
  });
  it('converges and inertia never increases', () => {
    const data = makeClusters('blobs3', 90, 4).map((p) => [p.x, p.y] as Vec2);
    const r = runKMeans(data, 3, { seed: 2 });
    expect(r.converged).toBe(true);
    for (let i = 1; i < r.history.length; i++) expect(r.history[i].inertia).toBeLessThanOrEqual(r.history[i - 1].inertia + 1e-9);
  });
  it('finds the obvious two-cluster solution with exact inertia', () => {
    const r = runKMeans(pts, 2, { initial: [[0, 0], [10, 10]] });
    expect(r.inertia).toBeCloseTo(4 * (2 / 3));
  });
  it('k-means++ picks distinct points', () => {
    const c = initCentroids(pts, 3, 'kmeans++', mulberry32(5));
    expect(new Set(c.map((x) => x.join())).size).toBe(3);
  });
  it('elbow curve is non-increasing', () => {
    const data = makeClusters('blobs4', 80, 1).map((p) => [p.x, p.y] as Vec2);
    const e = elbowCurve(data, 6);
    for (let i = 1; i < e.length; i++) expect(e[i]).toBeLessThanOrEqual(e[i - 1] + 1e-9);
    expect(inertia(pts, [0, 0, 0, 0, 0, 0], [[0, 0]])).toBeGreaterThan(0);
  });
});

describe('PCA', () => {
  it('first component of perfectly correlated data is the diagonal', () => {
    const X = [[1, 1], [2, 2], [3, 3], [4, 4]];
    const p = fitPCA(X);
    expect(p.components[0][0]).toBeCloseTo(Math.SQRT1_2);
    expect(p.components[0][1]).toBeCloseTo(Math.SQRT1_2);
    expect(p.explainedVarianceRatio[0]).toBeCloseTo(1);
  });
  it('explained variance equals variance of the projections', () => {
    const X = sampleCorrelated(200, [0, 0], [2, 1], [[1, 0.7], [0.7, 1]], 3)!;
    const p = fitPCA(X);
    const Z = pcaTransform(p, X, 2);
    const v0 = Z.reduce((s, z) => s + z[0] ** 2, 0) / (Z.length - 1);
    expect(v0).toBeCloseTo(p.explainedVariance[0], 8);
    // PC1 maximises variance over any direction.
    for (let a = 0; a < Math.PI; a += 0.1) expect(varianceAlong(X, [Math.cos(a), Math.sin(a)])).toBeLessThanOrEqual(p.explainedVariance[0] + 1e-9);
  });
  it('components are orthonormal and ratios sum to 1', () => {
    const X = sampleCorrelated(150, [0, 0, 0], [1, 2, 0.5], [[1, 0.5, 0.2], [0.5, 1, 0.3], [0.2, 0.3, 1]], 7)!;
    const p = fitPCA(X, true);
    const [a, b] = p.components;
    expect(a.reduce((s, v, i) => s + v * b[i], 0)).toBeCloseTo(0, 8);
    expect(Math.hypot(...a)).toBeCloseTo(1, 8);
    expect(p.explainedVarianceRatio.reduce((x, y) => x + y, 0)).toBeCloseTo(1);
  });
  it('full reconstruction is exact; error decreases as k grows', () => {
    const X = sampleCorrelated(80, [1, 2, 3], [1, 1, 1], [[1, 0.8, 0.1], [0.8, 1, 0.2], [0.1, 0.2, 1]], 2)!;
    const p = fitPCA(X);
    const R = pcaInverse(p, pcaTransform(p, X, 3));
    expect(R[5][1]).toBeCloseTo(X[5][1], 8);
    expect(reconstructionError(p, X, 1)).toBeGreaterThan(reconstructionError(p, X, 2));
    expect(reconstructionError(p, X, 3)).toBeCloseTo(0, 8);
  });
  it('rejects an invalid correlation matrix', () => {
    expect(sampleCorrelated(10, [0, 0, 0], [1, 1, 1], [[1, 0.9, -0.9], [0.9, 1, 0.9], [-0.9, 0.9, 1]], 1)).toBeNull();
  });
});

describe('hierarchical clustering', () => {
  const line = [[0], [1], [3], [7]];
  it('single linkage merge heights', () => {
    expect(agglomerative(line, 'single').map((m) => m.distance)).toEqual([1, 2, 4]);
  });
  it('complete linkage merge heights', () => {
    expect(agglomerative(line, 'complete').map((m) => m.distance)).toEqual([1, 3, 7]);
  });
  it('average linkage merge heights', () => {
    const d = agglomerative(line, 'average').map((m) => m.distance);
    expect(d[0]).toBeCloseTo(1);
    expect(d[1]).toBeCloseTo(2.5);
    expect(d[2]).toBeCloseTo(17 / 3);
  });
  it('ward linkage matches SciPy (√(2·ΔESS))', () => {
    const d = agglomerative(line, 'ward').map((m) => m.distance);
    expect(d[0]).toBeCloseTo(1);
    expect(d[1]).toBeCloseTo(Math.sqrt(25 / 3), 6);
    // Final merge: {0,1,3} (mean 4/3) with {7}: ΔESS = (3·1/4)(7−4/3)² ; height = √(2ΔESS)
    expect(d[2]).toBeCloseTo(Math.sqrt(2 * 0.75 * (7 - 4 / 3) ** 2), 6);
  });
  it('uses SciPy cluster ids', () => {
    const m = agglomerative(line, 'single');
    expect([m[0].a, m[0].b]).toEqual([0, 1]);
    expect([m[1].a, m[1].b]).toEqual([2, 4]);
    expect(m[2].size).toBe(4);
  });
  it('cutting produces the right number of clusters', () => {
    const pts = makeClusters('blobs3', 30, 3).map((p) => [p.x, p.y]);
    const m = agglomerative(pts, 'ward');
    expect(new Set(cutToK(30, m, 3)).size).toBe(3);
    expect(new Set(cutAtHeight(30, m, -1)).size).toBe(30);
    expect(new Set(cutAtHeight(30, m, Infinity)).size).toBe(1);
    expect(new Set(labelsAfterSteps(30, m, 10)).size).toBe(20);
    for (let i = 1; i < m.length; i++) expect(m[i].distance).toBeGreaterThanOrEqual(m[i - 1].distance - 1e-9);
  });
  it('dendrogram layout includes every leaf once', () => {
    const m = agglomerative(line, 'average');
    const { order } = dendrogramLayout(4, m);
    expect(order.slice().sort()).toEqual([0, 1, 2, 3]);
  });
});
