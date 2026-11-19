import { describe, expect, it } from 'vitest';
import { closedFormLine, gradientStep, lineMSE, fitMultipleLinear, fitPolynomial, lineGradient } from '../linearRegression';
import { sigmoid, trainLogistic, logLoss, logisticGradient, classifyAt } from '../logisticRegression';
import { distance, knnClassify, kNearest, knnRegress, makeTransform } from '../knn';
import { buildTree, gini, entropy, decisionPath, predictTree, bestSplit } from '../decisionTree';
import { trainForest, predictForest } from '../randomForest';
import { trainSVM, svmDecision, marginWidth, svmPredict01 } from '../svm';
import { fitGaussianNB, explainNB, gaussianPdf } from '../naiveBayes';
import { makeClassification } from '../datasets';
import { accuracy } from '../metrics';
import type { ClassPoint, RegPoint } from '../types';

const reg = (xy: number[][]): RegPoint[] => xy.map(([x, y], i) => ({ id: `${i}`, x, y }));

describe('linear regression', () => {
  const pts = reg([[1, 3], [2, 5], [3, 7], [4, 9]]); // y = 2x + 1 exactly
  it('closed form recovers an exact line', () => {
    const m = closedFormLine(pts)!;
    expect(m.w).toBeCloseTo(2);
    expect(m.b).toBeCloseTo(1);
    expect(lineMSE(pts, m)).toBeCloseTo(0);
  });
  it('returns null for vertical data', () => {
    expect(closedFormLine(reg([[1, 1], [1, 2]]))).toBeNull();
  });
  it('analytic gradient matches finite differences', () => {
    const m = { w: 0.3, b: -0.2 };
    const g = lineGradient(pts, m);
    const h = 1e-6;
    expect(g.dw).toBeCloseTo((lineMSE(pts, { w: m.w + h, b: m.b }) - lineMSE(pts, { w: m.w - h, b: m.b })) / (2 * h), 4);
    expect(g.db).toBeCloseTo((lineMSE(pts, { w: m.w, b: m.b + h }) - lineMSE(pts, { w: m.w, b: m.b - h })) / (2 * h), 4);
  });
  it('gradient descent converges to the OLS solution', () => {
    let m = { w: 0, b: 0 };
    for (let i = 0; i < 5000; i++) m = gradientStep(pts, m, 0.05).model;
    expect(m.w).toBeCloseTo(2, 3);
    expect(m.b).toBeCloseTo(1, 3);
  });
  it('flags divergence with a too-large learning rate', () => {
    let r = gradientStep(pts, { w: 0, b: 0 }, 1);
    for (let i = 0; i < 200 && !r.diverged; i++) r = gradientStep(pts, r.model, 1);
    expect(r.diverged).toBe(true);
  });
  it('multiple regression via normal equations', () => {
    // y = 1 + 2a − 3b
    const X = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1]];
    const y = X.map(([a, b]) => 1 + 2 * a - 3 * b);
    const beta = fitMultipleLinear(X, y)!;
    expect(beta[0]).toBeCloseTo(1);
    expect(beta[1]).toBeCloseTo(2);
    expect(beta[2]).toBeCloseTo(-3);
  });
  it('polynomial fit recovers a quadratic', () => {
    const xs = [0, 2, 4, 6, 8, 10];
    const f = fitPolynomial(xs, xs.map((x) => 0.5 * x * x - x + 2), 2)!;
    expect(f(5)).toBeCloseTo(0.5 * 25 - 5 + 2, 4);
  });
});

describe('logistic regression', () => {
  it('sigmoid is stable and symmetric', () => {
    expect(sigmoid(0)).toBe(0.5);
    expect(sigmoid(1000)).toBe(1);
    expect(sigmoid(-1000)).toBe(0);
    expect(sigmoid(2) + sigmoid(-2)).toBeCloseTo(1);
  });
  it('log loss at w=0 equals ln 2', () => {
    const pts = makeClassification('separable', 20, 1);
    expect(logLoss(pts, { w1: 0, w2: 0, b: 0 })).toBeCloseTo(Math.LN2);
  });
  it('gradient matches finite differences', () => {
    const pts = makeClassification('overlap', 30, 2);
    const m = { w1: 0.2, w2: -0.1, b: 0.3 };
    const g = logisticGradient(pts, m, 0.1);
    const h = 1e-6;
    const num = (logLoss(pts, { ...m, w1: m.w1 + h }, 0.1) - logLoss(pts, { ...m, w1: m.w1 - h }, 0.1)) / (2 * h);
    expect(g.g1).toBeCloseTo(num, 5);
  });
  it('training decreases loss and separates separable data', () => {
    const pts = makeClassification('separable', 60, 3);
    const { model, losses } = trainLogistic(pts, { lr: 0.3, iterations: 300 });
    expect(losses[losses.length - 1]).toBeLessThan(losses[0]);
    expect(accuracy(pts.map((p) => p.label), classifyAt(model, pts, 0.5))).toBeGreaterThan(0.95);
  });
  it('threshold 0 predicts everything positive, threshold >1 nothing', () => {
    const pts = makeClassification('overlap', 20, 4);
    const { model } = trainLogistic(pts, { lr: 0.3, iterations: 50 });
    expect(classifyAt(model, pts, 0).every((v) => v === 1)).toBe(true);
    expect(classifyAt(model, pts, 1.01).every((v) => v === 0)).toBe(true);
  });
});

describe('k-nearest neighbors', () => {
  it('distance metrics', () => {
    expect(distance([0, 0], [3, 4], 'euclidean')).toBe(5);
    expect(distance([0, 0], [3, 4], 'manhattan')).toBe(7);
    expect(distance([0, 0], [3, 4], 'chebyshev')).toBe(4);
  });
  const train = [[0, 0], [1, 0], [0, 1], [5, 5], [6, 5]];
  const labels = [0, 0, 0, 1, 1];
  it('selects true nearest neighbours', () => {
    const nb = kNearest(train, [5.2, 5], 2, 'euclidean');
    expect(nb.map((n) => n.index)).toEqual([3, 4]);
  });
  it('majority vote', () => {
    expect(knnClassify(train, labels, 2, [0.2, 0.2], 3, 'euclidean').label).toBe(0);
    expect(knnClassify(train, labels, 2, [5.5, 5], 1, 'euclidean').label).toBe(1);
    // k = 5 → 3 votes for class 0 regardless of query.
    expect(knnClassify(train, labels, 2, [5.5, 5], 5, 'euclidean').label).toBe(0);
  });
  it('tie broken by nearest neighbour', () => {
    const r = knnClassify([[0, 0], [3, 0]], [0, 1], 2, [2, 0], 2, 'euclidean');
    expect(r.votes).toEqual([1, 1]);
    expect(r.label).toBe(1);
  });
  it('regression averages neighbours', () => {
    expect(knnRegress([[0], [1], [10]], [1, 3, 100], [0.4], 2)).toBe(2);
  });
  it('feature scaling changes neighbours; standardization removes unit effects', () => {
    const pts: ClassPoint[] = [
      { id: 'a', x: 0, y: 0, label: 0 },
      { id: 'b', x: 1, y: 3, label: 1 },
      { id: 'c', x: 2, y: 0, label: 0 },
    ];
    const tf = makeTransform(pts, { xScale: 100, standardize: true });
    const tf2 = makeTransform(pts, { xScale: 1, standardize: true });
    expect(tf(1, 3)[0]).toBeCloseTo(tf2(1, 3)[0]);
  });
});

describe('decision tree', () => {
  it('impurity measures', () => {
    expect(gini([5, 5])).toBeCloseTo(0.5);
    expect(gini([10, 0])).toBe(0);
    expect(entropy([5, 5])).toBeCloseTo(1);
    expect(entropy([4, 0])).toBe(0);
  });
  it('finds the optimal threshold and gain', () => {
    const X = [[1], [2], [3], [10], [11], [12]];
    const y = [0, 0, 0, 1, 1, 1];
    const s = bestSplit(X, y, [0, 1, 2, 3, 4, 5], 2, 'gini', [0], 1)!;
    expect(s.threshold).toBeCloseTo(6.5);
    expect(s.gain).toBeCloseTo(0.5);
  });
  it('fits XOR perfectly with depth 2 but not depth 1', () => {
    const X = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const y = [0, 1, 1, 0];
    // A single axis split cannot reduce impurity on XOR, so the root stays a leaf.
    expect(buildTree(X, y, 2, { maxDepth: 1, minSamplesSplit: 2, criterion: 'gini' }).nodeCount).toBe(1);
  });
  it('deep tree memorises training data; depth limit is respected', () => {
    const pts = makeClassification('moons', 80, 2);
    const X = pts.map((p) => [p.x, p.y]);
    const y = pts.map((p) => p.label);
    const deep = buildTree(X, y, 2, { maxDepth: 30, minSamplesSplit: 2, criterion: 'gini' });
    expect(accuracy(y, X.map((x) => predictTree(deep.root, x)))).toBe(1);
    const shallow = buildTree(X, y, 2, { maxDepth: 2, minSamplesSplit: 2, criterion: 'entropy' });
    expect(shallow.depth).toBeLessThanOrEqual(2);
    expect(shallow.leafCount).toBeLessThanOrEqual(4);
  });
  it('min samples split stops growth', () => {
    const pts = makeClassification('overlap', 40, 2);
    const t = buildTree(pts.map((p) => [p.x, p.y]), pts.map((p) => p.label), 2, { maxDepth: 20, minSamplesSplit: 41, criterion: 'gini' });
    expect(t.nodeCount).toBe(1);
  });
  it('decision path ends at the predicting leaf and importances sum to 1', () => {
    const pts = makeClassification('separable', 40, 6);
    const X = pts.map((p) => [p.x, p.y]);
    const t = buildTree(X, pts.map((p) => p.label), 2, { maxDepth: 4, minSamplesSplit: 2, criterion: 'gini' });
    const path = decisionPath(t.root, X[0]);
    expect(path[0]).toBe(t.root);
    expect(path[path.length - 1].prediction).toBe(predictTree(t.root, X[0]));
    expect(t.importances.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});

describe('random forest', () => {
  const pts = makeClassification('moons', 100, 11);
  const X = pts.map((p) => [p.x, p.y]);
  const y = pts.map((p) => p.label);
  const params = { nTrees: 25, maxDepth: 6, minSamplesSplit: 2, criterion: 'gini' as const, maxFeatures: 'sqrt' as const, bootstrap: true, seed: 3 };
  it('is reproducible with a seed', () => {
    const a = trainForest(X, y, 2, params);
    const b = trainForest(X, y, 2, params);
    expect(a.trees.map((t) => t.tree.nodeCount)).toEqual(b.trees.map((t) => t.tree.nodeCount));
  });
  it('bootstrap samples have size n and OOB sets are disjoint from them', () => {
    const f = trainForest(X, y, 2, params);
    for (const t of f.trees) {
      expect(t.sample).toHaveLength(100);
      const s = new Set(t.sample);
      expect(t.oob.every((i) => !s.has(i))).toBe(true);
    }
    // ≈ 36.8% of samples are out-of-bag on average.
    const meanOob = f.trees.reduce((a, t) => a + t.oob.length, 0) / f.trees.length / 100;
    expect(meanOob).toBeGreaterThan(0.25);
    expect(meanOob).toBeLessThan(0.48);
  });
  it('aggregates trees: proba is the mean of tree probabilities', () => {
    const f = trainForest(X, y, 2, params);
    const pred = predictForest(f, [0, 0]);
    expect(pred.proba.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(pred.treeVotes).toHaveLength(25);
  });
  it('generalizes well on moons', () => {
    const f = trainForest(X, y, 2, params);
    const test = makeClassification('moons', 100, 99);
    const acc = accuracy(test.map((p) => p.label), test.map((p) => predictForest(f, [p.x, p.y]).label));
    expect(acc).toBeGreaterThan(0.85);
    expect(f.oobScore).not.toBeNull();
    expect(f.importances.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});

describe('SVM (SMO)', () => {
  it('recovers the analytic hard-margin solution for two points', () => {
    // x₁=(−1,0) y=−1, x₂=(1,0) y=+1 → w=(1,0), b=0, margin 2, α=(0.5,0.5).
    const m = trainSVM([[-1, 0], [1, 0]], [0, 1], { C: 100, kernel: 'linear', gamma: 1, tol: 1e-6 });
    expect(m.converged).toBe(true);
    expect(m.w![0]).toBeCloseTo(1, 4);
    expect(m.w![1]).toBeCloseTo(0, 4);
    expect(m.b).toBeCloseTo(0, 4);
    expect(m.alpha[0]).toBeCloseTo(0.5, 4);
    expect(marginWidth(m)).toBeCloseTo(2, 3);
  });
  it('analytic 4-point example: support vectors lie on the margin', () => {
    const X = [[0, 0], [1, 1], [2, 0], [3, 1]];
    const y = [0, 0, 1, 1];
    const m = trainSVM(X, y, { C: 1000, kernel: 'linear', gamma: 1, tol: 1e-7 });
    for (const t of m.supportIdx) expect(Math.abs(svmDecision(m, X[t]))).toBeCloseTo(1, 3);
    X.forEach((x, i) => expect(svmPredict01(m, x)).toBe(y[i]));
    // Σ αᵢyᵢ = 0 (dual equality constraint)
    expect(m.alpha.reduce((s, a, i) => s + a * m.y[i], 0)).toBeCloseTo(0, 8);
  });
  it('KKT conditions hold on noisy data', () => {
    const pts = makeClassification('overlap', 60, 4);
    const X = pts.map((p) => [p.x, p.y]);
    const C = 1;
    const m = trainSVM(X, pts.map((p) => p.label), { C, kernel: 'linear', gamma: 1, tol: 1e-4 });
    expect(m.converged).toBe(true);
    X.forEach((x, i) => {
      const yf = m.y[i] * svmDecision(m, x);
      if (m.alpha[i] < 1e-6) expect(yf).toBeGreaterThan(1 - 1e-2);
      else if (m.alpha[i] > C - 1e-6) expect(yf).toBeLessThan(1 + 1e-2);
      else expect(yf).toBeCloseTo(1, 1);
      expect(m.alpha[i]).toBeGreaterThanOrEqual(-1e-12);
      expect(m.alpha[i]).toBeLessThanOrEqual(C + 1e-12);
    });
  });
  it('smaller C widens the margin', () => {
    const pts = makeClassification('overlap', 60, 4);
    const X = pts.map((p) => [p.x, p.y]);
    const y = pts.map((p) => p.label);
    const narrow = marginWidth(trainSVM(X, y, { C: 100, kernel: 'linear', gamma: 1 }))!;
    const wide = marginWidth(trainSVM(X, y, { C: 0.01, kernel: 'linear', gamma: 1 }))!;
    expect(wide).toBeGreaterThan(narrow);
  });
  it('RBF kernel solves circles where linear cannot', () => {
    const pts = makeClassification('circles', 80, 5);
    const X = pts.map((p) => [p.x, p.y]);
    const y = pts.map((p) => p.label);
    const rbf = trainSVM(X, y, { C: 10, kernel: 'rbf', gamma: 0.5 });
    const lin = trainSVM(X, y, { C: 10, kernel: 'linear', gamma: 1 });
    expect(accuracy(y, X.map((x) => svmPredict01(rbf, x)))).toBeGreaterThan(0.95);
    expect(accuracy(y, X.map((x) => svmPredict01(lin, x)))).toBeLessThan(0.8);
  });
});

describe('Gaussian naive Bayes', () => {
  const X = [[1, 2], [2, 3], [3, 4], [6, 7], [7, 8], [8, 9]];
  const y = [0, 0, 0, 1, 1, 1];
  it('estimates priors, means and population variances', () => {
    const m = fitGaussianNB(X, y, 2, 0);
    expect(m.priors).toEqual([0.5, 0.5]);
    expect(m.means[0]).toEqual([2, 3]);
    expect(m.variances[0][0]).toBeCloseTo(2 / 3);
  });
  it('posteriors sum to 1 and match a hand computation', () => {
    const m = fitGaussianNB(X, y, 2, 0);
    const e = explainNB(m, [4, 5]);
    expect(e.classes[0].posterior + e.classes[1].posterior).toBeCloseTo(1);
    const p0 = 0.5 * gaussianPdf(4, 2, 2 / 3) * gaussianPdf(5, 3, 2 / 3);
    const p1 = 0.5 * gaussianPdf(4, 7, 2 / 3) * gaussianPdf(5, 8, 2 / 3);
    expect(e.classes[0].posterior).toBeCloseTo(p0 / (p0 + p1), 10);
    expect(e.prediction).toBe(0);
  });
  it('priors shift the decision at the midpoint', () => {
    const Xi = [[0], [0.5], [1], [9], [10]];
    const yi = [0, 0, 0, 1, 1];
    const m = fitGaussianNB(Xi, yi, 2);
    expect(m.priors[0]).toBeCloseTo(0.6);
  });
  it('is stable far from the data (log-space)', () => {
    const m = fitGaussianNB(X, y, 2);
    const e = explainNB(m, [1000, -1000]);
    expect(Number.isFinite(e.classes[0].posterior)).toBe(true);
    expect(e.classes[0].posterior + e.classes[1].posterior).toBeCloseTo(1);
  });
  it('uses variance smoothing like scikit-learn', () => {
    const m = fitGaussianNB([[1], [1], [2]], [0, 0, 1], 2, 1e-9);
    expect(m.variances[0][0]).toBeGreaterThan(0);
  });
});
