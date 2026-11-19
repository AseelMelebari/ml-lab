/** Principal Component Analysis via eigendecomposition of the sample covariance matrix. */
import { cholesky, columnMeans, columnStds, covariance, symmetricEigen, type Matrix } from './linalg';
import { gaussian, mulberry32 } from './random';

export interface PCAResult {
  mean: number[];
  /** Per-feature scale used (1 when not standardized). */
  scale: number[];
  covariance: Matrix;
  /** Principal axes as unit row vectors, ordered by decreasing variance. */
  components: number[][];
  /** Variance along each component (eigenvalues of the covariance matrix). */
  explainedVariance: number[];
  explainedVarianceRatio: number[];
}

export function fitPCA(X: Matrix, standardize = false): PCAResult {
  const mean = columnMeans(X);
  const std = columnStds(X, mean);
  const scale = standardize ? std.map((s) => (s > 1e-12 ? s : 1)) : mean.map(() => 1);
  const Z = X.map((r) => r.map((v, j) => (v - mean[j]) / scale[j]));
  const C = covariance(Z);
  const eig = symmetricEigen(C);
  const values = eig.values.map((v) => Math.max(0, v));
  // Deterministic sign: make the largest-magnitude entry of each component positive.
  const components = eig.vectors.map((v) => {
    let k = 0;
    v.forEach((x, i) => {
      if (Math.abs(x) > Math.abs(v[k])) k = i;
    });
    return v[k] < 0 ? v.map((x) => -x) : v;
  });
  const total = values.reduce((a, b) => a + b, 0);
  return {
    mean,
    scale,
    covariance: C,
    components,
    explainedVariance: values,
    explainedVarianceRatio: values.map((v) => (total > 0 ? v / total : 0)),
  };
}

/** Project data onto the first k components (scores). */
export function pcaTransform(p: PCAResult, X: Matrix, k: number): Matrix {
  return X.map((r) => {
    const z = r.map((v, j) => (v - p.mean[j]) / p.scale[j]);
    return p.components.slice(0, k).map((c) => c.reduce((s, cj, j) => s + cj * z[j], 0));
  });
}

/** Map k-dimensional scores back to the original feature space. */
export function pcaInverse(p: PCAResult, scores: Matrix): Matrix {
  return scores.map((s) =>
    p.mean.map((m, j) => m + p.scale[j] * s.reduce((acc, sk, k) => acc + sk * p.components[k][j], 0)),
  );
}

/** Mean squared reconstruction error when keeping k components. */
export function reconstructionError(p: PCAResult, X: Matrix, k: number): number {
  const R = pcaInverse(p, pcaTransform(p, X, k));
  let s = 0;
  X.forEach((r, i) => r.forEach((v, j) => (s += (v - R[i][j]) ** 2)));
  return s / Math.max(1, X.length);
}

/** Variance of the data projected on an arbitrary unit direction (for the manual-axis demo). */
export function varianceAlong(X: Matrix, dir: number[]): number {
  const norm = Math.hypot(...dir) || 1;
  const u = dir.map((d) => d / norm);
  const proj = X.map((r) => r.reduce((s, v, j) => s + v * u[j], 0));
  const m = proj.reduce((a, b) => a + b, 0) / Math.max(1, proj.length);
  return proj.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, proj.length - 1);
}

/**
 * Draw n samples from a multivariate normal with the given std devs and correlation matrix.
 * Returns null when the correlation matrix is not positive definite.
 */
export function sampleCorrelated(
  n: number,
  means: number[],
  stds: number[],
  corr: Matrix,
  seed: number,
): Matrix | null {
  const d = means.length;
  const cov = corr.map((row, i) => row.map((r, j) => r * stds[i] * stds[j]));
  const L = cholesky(cov);
  if (!L) return null;
  const rng = mulberry32(seed);
  const out: Matrix = [];
  for (let s = 0; s < n; s++) {
    const z = Array.from({ length: d }, () => gaussian(rng));
    out.push(means.map((m, i) => m + L[i].reduce((acc, l, k) => acc + l * z[k], 0)));
  }
  return out;
}
