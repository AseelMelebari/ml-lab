/**
 * Soft-margin Support Vector Machine trained by Sequential Minimal Optimization (SMO).
 *
 * Dual problem:  min_α ½ Σᵢⱼ αᵢαⱼyᵢyⱼK(xᵢ,xⱼ) − Σᵢ αᵢ   s.t. 0 ≤ αᵢ ≤ C,  Σᵢ αᵢyᵢ = 0.
 * Working-pair selection uses the maximal-violating-pair rule (Keerthi et al. 2001; LIBSVM WSS1),
 * and the two-variable sub-problem is solved analytically (Platt 1998). Training stops when the
 * KKT violation gap falls below `tol`, so the result is a genuine (ε-)optimal solution.
 */

export type KernelType = 'linear' | 'rbf';

export interface SVMParams {
  C: number;
  kernel: KernelType;
  gamma: number;
  tol?: number;
  maxIter?: number;
}

export interface SVMModel {
  X: number[][];
  /** Labels in {−1, +1}. */
  y: number[];
  alpha: number[];
  b: number;
  kernel: KernelType;
  gamma: number;
  C: number;
  supportIdx: number[];
  /** Explicit weight vector (linear kernel only). */
  w: number[] | null;
  iterations: number;
  converged: boolean;
  /** Final KKT violation gap m(α) − M(α). */
  gap: number;
  dualObjective: number;
}

export function kernelFn(type: KernelType, gamma: number) {
  if (type === 'linear') return (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1];
  return (a: readonly number[], b: readonly number[]) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
    return Math.exp(-gamma * s);
  };
}

export function trainSVM(X: number[][], labels01: readonly number[], p: SVMParams): SVMModel {
  const n = X.length;
  const y = labels01.map((l) => (l === 1 ? 1 : -1));
  const C = p.C;
  const tol = p.tol ?? 1e-3;
  const maxIter = p.maxIter ?? Math.max(10000, 100 * n);
  const K = kernelFn(p.kernel, p.gamma);
  const Q: Float64Array[] = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++)
    for (let j = i; j < n; j++) {
      const k = K(X[i], X[j]);
      Q[i][j] = k;
      Q[j][i] = k;
    }
  const alpha = new Array<number>(n).fill(0);
  // g[t] = Σ_k α_k y_k K(x_k, x_t)
  const g = new Float64Array(n);
  const inUp = (t: number) => (y[t] === 1 ? alpha[t] < C - 1e-12 : alpha[t] > 1e-12);
  const inLow = (t: number) => (y[t] === 1 ? alpha[t] > 1e-12 : alpha[t] < C - 1e-12);

  let iter = 0;
  let gap = Infinity;
  let converged = false;
  const hasBoth = y.includes(1) && y.includes(-1);
  while (hasBoth && iter < maxIter) {
    // u_t = y_t − g_t = −y_t ∇f(α)_t
    let i = -1;
    let j = -1;
    let m = -Infinity;
    let M = Infinity;
    for (let t = 0; t < n; t++) {
      const u = y[t] - g[t];
      if (inUp(t) && u > m) {
        m = u;
        i = t;
      }
      if (inLow(t) && u < M) {
        M = u;
        j = t;
      }
    }
    gap = m - M;
    if (i < 0 || j < 0 || gap < tol) {
      converged = true;
      break;
    }
    let eta = Q[i][i] + Q[j][j] - 2 * Q[i][j];
    if (eta <= 1e-12) eta = 1e-12;
    const ai = alpha[i];
    const aj = alpha[j];
    let L: number;
    let H: number;
    if (y[i] !== y[j]) {
      L = Math.max(0, aj - ai);
      H = Math.min(C, C + aj - ai);
    } else {
      L = Math.max(0, ai + aj - C);
      H = Math.min(C, ai + aj);
    }
    // E_i − E_j = (g_i − y_i) − (g_j − y_j)
    const Ei = g[i] - y[i];
    const Ej = g[j] - y[j];
    let ajNew = aj + (y[j] * (Ei - Ej)) / eta;
    ajNew = Math.min(H, Math.max(L, ajNew));
    const aiNew = ai + y[i] * y[j] * (aj - ajNew);
    const di = aiNew - ai;
    const dj = ajNew - aj;
    alpha[i] = aiNew;
    alpha[j] = ajNew;
    for (let t = 0; t < n; t++) g[t] += di * y[i] * Q[i][t] + dj * y[j] * Q[j][t];
    iter++;
  }

  // Bias: average over free support vectors; otherwise midpoint of the feasible interval.
  let bSum = 0;
  let bCount = 0;
  let up = -Infinity;
  let low = Infinity;
  for (let t = 0; t < n; t++) {
    const u = y[t] - g[t];
    if (alpha[t] > 1e-8 && alpha[t] < C - 1e-8) {
      bSum += u;
      bCount++;
    }
    if (inUp(t)) up = Math.max(up, u);
    if (inLow(t)) low = Math.min(low, u);
  }
  let b = 0;
  if (bCount > 0) b = bSum / bCount;
  else if (Number.isFinite(up) && Number.isFinite(low)) b = (up + low) / 2;
  else if (Number.isFinite(up)) b = up;
  else if (Number.isFinite(low)) b = low;

  const supportIdx = alpha.map((a, t) => (a > 1e-7 ? t : -1)).filter((t) => t >= 0);
  let w: number[] | null = null;
  if (p.kernel === 'linear') {
    w = [0, 0];
    for (const t of supportIdx) {
      w[0] += alpha[t] * y[t] * X[t][0];
      w[1] += alpha[t] * y[t] * X[t][1];
    }
  }
  let quad = 0;
  for (let t = 0; t < n; t++) quad += alpha[t] * y[t] * g[t];
  const dualObjective = alpha.reduce((s, a) => s + a, 0) - 0.5 * quad;
  return {
    X,
    y,
    alpha,
    b,
    kernel: p.kernel,
    gamma: p.gamma,
    C,
    supportIdx,
    w,
    iterations: iter,
    converged: converged || !hasBoth,
    gap: hasBoth ? gap : 0,
    dualObjective,
  };
}

/** Decision function f(x) = Σ αᵢyᵢK(xᵢ, x) + b. Class +1 when f(x) ≥ 0. */
export function svmDecision(m: SVMModel, x: readonly number[]): number {
  if (m.w) return m.w[0] * x[0] + m.w[1] * x[1] + m.b;
  const K = kernelFn(m.kernel, m.gamma);
  let s = m.b;
  for (const t of m.supportIdx) s += m.alpha[t] * m.y[t] * K(m.X[t], x);
  return s;
}

export const svmPredict01 = (m: SVMModel, x: readonly number[]) => (svmDecision(m, x) >= 0 ? 1 : 0);

/** Geometric margin width 2/‖w‖ (linear kernel). */
export function marginWidth(m: SVMModel): number | null {
  if (!m.w) return null;
  const norm = Math.hypot(m.w[0], m.w[1]);
  return norm > 0 ? 2 / norm : null;
}
