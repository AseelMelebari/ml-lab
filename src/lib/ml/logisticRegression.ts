/** Binary logistic regression on two features trained with batch gradient descent on the log loss. */
import type { ClassPoint } from './types';

export interface LogisticModel {
  w1: number;
  w2: number;
  b: number;
}

/** Numerically stable sigmoid. */
export function sigmoid(z: number): number {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}

export const logit = (p: number) => Math.log(p / (1 - p));

export const linearScore = (m: LogisticModel, x: number, y: number) => m.w1 * x + m.w2 * y + m.b;
export const predictProba = (m: LogisticModel, x: number, y: number) => sigmoid(linearScore(m, x, y));

const EPS = 1e-12;

/** Mean binary cross-entropy (log loss) plus optional L2 penalty (λ/2)·‖w‖². */
export function logLoss(points: readonly ClassPoint[], m: LogisticModel, l2 = 0): number {
  if (points.length === 0) return 0;
  let s = 0;
  for (const p of points) {
    const q = Math.min(1 - EPS, Math.max(EPS, predictProba(m, p.x, p.y)));
    s += -(p.label * Math.log(q) + (1 - p.label) * Math.log(1 - q));
  }
  return s / points.length + (l2 / 2) * (m.w1 * m.w1 + m.w2 * m.w2);
}

/** Gradient of the mean log loss: (1/n) Σ (σ(z) − y)·x (+ λw). */
export function logisticGradient(points: readonly ClassPoint[], m: LogisticModel, l2 = 0) {
  const n = Math.max(1, points.length);
  let g1 = 0;
  let g2 = 0;
  let gb = 0;
  for (const p of points) {
    const e = predictProba(m, p.x, p.y) - p.label;
    g1 += e * p.x;
    g2 += e * p.y;
    gb += e;
  }
  return { g1: g1 / n + l2 * m.w1, g2: g2 / n + l2 * m.w2, gb: gb / n };
}

export function logisticStep(points: readonly ClassPoint[], m: LogisticModel, lr: number, l2 = 0): LogisticModel {
  const g = logisticGradient(points, m, l2);
  return { w1: m.w1 - lr * g.g1, w2: m.w2 - lr * g.g2, b: m.b - lr * g.gb };
}

export function trainLogistic(
  points: readonly ClassPoint[],
  opts: { lr: number; iterations: number; l2?: number; init?: LogisticModel },
): { model: LogisticModel; losses: number[] } {
  let m = opts.init ?? { w1: 0, w2: 0, b: 0 };
  const losses: number[] = [logLoss(points, m, opts.l2)];
  for (let i = 0; i < opts.iterations; i++) {
    m = logisticStep(points, m, opts.lr, opts.l2);
    losses.push(logLoss(points, m, opts.l2));
  }
  return { model: m, losses };
}

export function classifyAt(m: LogisticModel, points: readonly ClassPoint[], threshold: number): number[] {
  return points.map((p) => (predictProba(m, p.x, p.y) >= threshold ? 1 : 0));
}
