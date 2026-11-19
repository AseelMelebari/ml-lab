/** Simple and multiple linear regression: gradient descent and closed-form (OLS) solutions. */
import { solve, transpose, matMul, matVec } from './linalg';
import type { RegPoint } from './types';

export interface LineModel {
  w: number;
  b: number;
}

export const predictLine = (m: LineModel, x: number) => m.w * x + m.b;

/** Mean squared error J(w, b) = (1/n) Σ (ŷ − y)². */
export function lineMSE(points: readonly RegPoint[], m: LineModel): number {
  if (points.length === 0) return 0;
  let s = 0;
  for (const p of points) s += (predictLine(m, p.x) - p.y) ** 2;
  return s / points.length;
}

/** Gradient of the MSE with respect to w and b. */
export function lineGradient(points: readonly RegPoint[], m: LineModel): { dw: number; db: number } {
  const n = points.length;
  if (n === 0) return { dw: 0, db: 0 };
  let dw = 0;
  let db = 0;
  for (const p of points) {
    const e = predictLine(m, p.x) - p.y;
    dw += e * p.x;
    db += e;
  }
  return { dw: (2 / n) * dw, db: (2 / n) * db };
}

export interface GDStepResult {
  model: LineModel;
  loss: number;
  gradient: { dw: number; db: number };
  diverged: boolean;
}

/** One batch gradient-descent step: θ ← θ − α ∇J(θ). */
export function gradientStep(points: readonly RegPoint[], m: LineModel, learningRate: number): GDStepResult {
  const g = lineGradient(points, m);
  const model = { w: m.w - learningRate * g.dw, b: m.b - learningRate * g.db };
  const loss = lineMSE(points, model);
  const diverged = !Number.isFinite(loss) || !Number.isFinite(model.w) || Math.abs(model.w) > 1e8 || loss > 1e12;
  return { model, loss, gradient: g, diverged };
}

/** Closed-form least squares for one feature. Returns null if all x are identical. */
export function closedFormLine(points: readonly RegPoint[]): LineModel | null {
  const n = points.length;
  if (n < 2) return null;
  let mx = 0;
  let my = 0;
  for (const p of points) {
    mx += p.x;
    my += p.y;
  }
  mx /= n;
  my /= n;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  if (sxx < 1e-12) return null;
  const w = sxy / sxx;
  return { w, b: my - w * mx };
}

/**
 * Multiple linear regression via the normal equations (XᵀX)β = Xᵀy.
 * Returns [intercept, ...coefficients] or null when XᵀX is singular.
 */
export function fitMultipleLinear(X: number[][], y: number[]): number[] | null {
  const Xb = X.map((row) => [1, ...row]);
  const Xt = transpose(Xb);
  return solve(matMul(Xt, Xb), matVec(Xt, y));
}

/**
 * Polynomial least squares (used by the bias–variance demo). x is rescaled to [-1, 1] internally
 * for numerical stability; a tiny ridge term keeps high degrees well-conditioned.
 */
export function fitPolynomial(
  xs: readonly number[],
  ys: readonly number[],
  degree: number,
  ridge = 1e-8,
  range: [number, number] = [0, 10],
): ((x: number) => number) | null {
  const [lo, hi] = range;
  const scale = (x: number) => (2 * (x - lo)) / (hi - lo) - 1;
  const d = degree + 1;
  const A = Array.from({ length: d }, () => new Array<number>(d).fill(0));
  const b = new Array<number>(d).fill(0);
  for (let i = 0; i < xs.length; i++) {
    const t = scale(xs[i]);
    const pow = [1];
    for (let k = 1; k < d; k++) pow.push(pow[k - 1] * t);
    for (let r = 0; r < d; r++) {
      b[r] += pow[r] * ys[i];
      for (let c = 0; c < d; c++) A[r][c] += pow[r] * pow[c];
    }
  }
  for (let r = 1; r < d; r++) A[r][r] += ridge;
  const coef = solve(A, b);
  if (!coef) return null;
  return (x: number) => {
    const t = scale(x);
    let s = 0;
    let p = 1;
    for (let k = 0; k < d; k++) {
      s += coef[k] * p;
      p *= t;
    }
    return s;
  };
}
