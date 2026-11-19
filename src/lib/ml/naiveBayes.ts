/** Gaussian Naive Bayes: P(c | x) ∝ P(c) Πⱼ N(xⱼ; μ_cj, σ²_cj). */

export interface GaussianNBModel {
  nClasses: number;
  nFeatures: number;
  classCounts: number[];
  priors: number[];
  means: number[][];
  variances: number[][];
  epsilon: number;
}

/**
 * Fit with maximum-likelihood means/variances (population variance, like scikit-learn) and
 * variance smoothing ε = varSmoothing · max feature variance added to every variance.
 */
export function fitGaussianNB(
  X: readonly (readonly number[])[],
  y: readonly number[],
  nClasses: number,
  varSmoothing = 1e-9,
): GaussianNBModel {
  const d = X[0]?.length ?? 0;
  const counts = new Array<number>(nClasses).fill(0);
  const means = Array.from({ length: nClasses }, () => new Array<number>(d).fill(0));
  const vars = Array.from({ length: nClasses }, () => new Array<number>(d).fill(0));
  for (let i = 0; i < X.length; i++) {
    counts[y[i]]++;
    for (let j = 0; j < d; j++) means[y[i]][j] += X[i][j];
  }
  for (let c = 0; c < nClasses; c++) for (let j = 0; j < d; j++) means[c][j] /= Math.max(1, counts[c]);
  for (let i = 0; i < X.length; i++) for (let j = 0; j < d; j++) vars[y[i]][j] += (X[i][j] - means[y[i]][j]) ** 2;
  for (let c = 0; c < nClasses; c++) for (let j = 0; j < d; j++) vars[c][j] /= Math.max(1, counts[c]);
  // Global feature variance for smoothing.
  let maxVar = 0;
  for (let j = 0; j < d; j++) {
    const m = X.reduce((s, r) => s + r[j], 0) / Math.max(1, X.length);
    const v = X.reduce((s, r) => s + (r[j] - m) ** 2, 0) / Math.max(1, X.length);
    maxVar = Math.max(maxVar, v);
  }
  const epsilon = varSmoothing * Math.max(maxVar, 1e-12);
  for (let c = 0; c < nClasses; c++) for (let j = 0; j < d; j++) vars[c][j] += epsilon;
  const n = X.length;
  return {
    nClasses,
    nFeatures: d,
    classCounts: counts,
    priors: counts.map((c) => c / Math.max(1, n)),
    means,
    variances: vars,
    epsilon,
  };
}

export function gaussianPdf(x: number, mean: number, variance: number): number {
  return Math.exp(-((x - mean) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance);
}

export function logGaussianPdf(x: number, mean: number, variance: number): number {
  return -0.5 * Math.log(2 * Math.PI * variance) - (x - mean) ** 2 / (2 * variance);
}

export interface NBExplanation {
  /** Per class: prior, per-feature likelihoods, log joint, posterior. */
  classes: {
    prior: number;
    likelihoods: number[];
    logJoint: number;
    posterior: number;
  }[];
  prediction: number;
}

/** Full, step-by-step Bayes computation in log space (log-sum-exp for normalization). */
export function explainNB(m: GaussianNBModel, x: readonly number[]): NBExplanation {
  const classes = m.priors.map((prior, c) => {
    const likelihoods = x.map((v, j) => gaussianPdf(v, m.means[c][j], m.variances[c][j]));
    let logJoint = prior > 0 ? Math.log(prior) : -Infinity;
    for (let j = 0; j < x.length; j++) logJoint += logGaussianPdf(x[j], m.means[c][j], m.variances[c][j]);
    return { prior, likelihoods, logJoint, posterior: 0 };
  });
  const maxLog = Math.max(...classes.map((c) => c.logJoint));
  const sum = classes.reduce((s, c) => s + (Number.isFinite(c.logJoint) ? Math.exp(c.logJoint - maxLog) : 0), 0);
  for (const c of classes) c.posterior = Number.isFinite(c.logJoint) ? Math.exp(c.logJoint - maxLog) / sum : 0;
  let prediction = 0;
  classes.forEach((c, i) => {
    if (c.posterior > classes[prediction].posterior) prediction = i;
  });
  return { classes, prediction };
}

export const predictNB = (m: GaussianNBModel, x: readonly number[]) => explainNB(m, x).prediction;
