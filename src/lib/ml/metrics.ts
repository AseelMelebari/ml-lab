/** Evaluation metrics. All functions are pure and handle degenerate cases explicitly. */

export interface BinaryConfusion {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export function binaryConfusion(yTrue: readonly number[], yPred: readonly number[]): BinaryConfusion {
  const c = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (let i = 0; i < yTrue.length; i++) {
    const t = yTrue[i] === 1;
    const p = yPred[i] === 1;
    if (t && p) c.tp++;
    else if (!t && p) c.fp++;
    else if (!t && !p) c.tn++;
    else c.fn++;
  }
  return c;
}

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);

export interface ClassificationScores {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  specificity: number;
}

/** Binary metrics with the positive class = 1. Zero-division yields 0 (scikit-learn's default warning case). */
export function binaryScores(c: BinaryConfusion): ClassificationScores {
  const total = c.tp + c.fp + c.tn + c.fn;
  const precision = safeDiv(c.tp, c.tp + c.fp);
  const recall = safeDiv(c.tp, c.tp + c.fn);
  return {
    accuracy: safeDiv(c.tp + c.tn, total),
    precision,
    recall,
    f1: safeDiv(2 * precision * recall, precision + recall),
    specificity: safeDiv(c.tn, c.tn + c.fp),
  };
}

export function confusionMatrix(yTrue: readonly number[], yPred: readonly number[], nClasses: number): number[][] {
  const m = Array.from({ length: nClasses }, () => new Array<number>(nClasses).fill(0));
  for (let i = 0; i < yTrue.length; i++) m[yTrue[i]][yPred[i]]++;
  return m;
}

export function accuracy(yTrue: readonly number[], yPred: readonly number[]): number {
  if (yTrue.length === 0) return 0;
  let ok = 0;
  for (let i = 0; i < yTrue.length; i++) if (yTrue[i] === yPred[i]) ok++;
  return ok / yTrue.length;
}

/** Macro-averaged precision/recall/F1 for multi-class problems. */
export function macroScores(cm: number[][]): { precision: number; recall: number; f1: number } {
  const k = cm.length;
  let p = 0;
  let r = 0;
  let f = 0;
  for (let c = 0; c < k; c++) {
    const tp = cm[c][c];
    let colSum = 0;
    let rowSum = 0;
    for (let j = 0; j < k; j++) {
      colSum += cm[j][c];
      rowSum += cm[c][j];
    }
    const pc = safeDiv(tp, colSum);
    const rc = safeDiv(tp, rowSum);
    p += pc;
    r += rc;
    f += safeDiv(2 * pc * rc, pc + rc);
  }
  return { precision: p / k, recall: r / k, f1: f / k };
}

export interface RocPoint {
  threshold: number;
  fpr: number;
  tpr: number;
}

/** ROC curve from scores (higher = more positive). Tied scores are handled as a single step. */
export function rocCurve(scores: readonly number[], labels: readonly number[]): { points: RocPoint[]; auc: number } {
  const P = labels.filter((l) => l === 1).length;
  const N = labels.length - P;
  const order = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
  const points: RocPoint[] = [{ threshold: Infinity, fpr: 0, tpr: 0 }];
  let tp = 0;
  let fp = 0;
  let i = 0;
  while (i < order.length) {
    const s = scores[order[i]];
    while (i < order.length && scores[order[i]] === s) {
      if (labels[order[i]] === 1) tp++;
      else fp++;
      i++;
    }
    points.push({ threshold: s, fpr: safeDiv(fp, N), tpr: safeDiv(tp, P) });
  }
  let auc = 0;
  for (let k = 1; k < points.length; k++) {
    auc += (points[k].fpr - points[k - 1].fpr) * (points[k].tpr + points[k - 1].tpr) / 2;
  }
  return { points, auc: P === 0 || N === 0 ? NaN : auc };
}

export interface RegressionScores {
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
}

export function regressionScores(yTrue: readonly number[], yPred: readonly number[]): RegressionScores {
  const n = yTrue.length;
  if (n === 0) return { mae: 0, mse: 0, rmse: 0, r2: 0 };
  let ae = 0;
  let se = 0;
  let mean = 0;
  for (const y of yTrue) mean += y;
  mean /= n;
  let ss = 0;
  for (let i = 0; i < n; i++) {
    const e = yTrue[i] - yPred[i];
    ae += Math.abs(e);
    se += e * e;
    ss += (yTrue[i] - mean) ** 2;
  }
  const mse = se / n;
  return { mae: ae / n, mse, rmse: Math.sqrt(mse), r2: ss === 0 ? 0 : 1 - se / ss };
}
