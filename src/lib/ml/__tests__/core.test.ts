import { describe, expect, it } from 'vitest';
import { mulberry32, gaussian, shuffle } from '../random';
import { solve, symmetricEigen, covariance, cholesky } from '../linalg';
import { binaryConfusion, binaryScores, rocCurve, regressionScores, confusionMatrix, macroScores } from '../metrics';
import { makeClassification, makeRegression, trainTestSplit } from '../datasets';

describe('random', () => {
  it('is reproducible for a seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });
  it('gaussian has mean≈0, var≈1', () => {
    const r = mulberry32(1);
    const xs = Array.from({ length: 20000 }, () => gaussian(r));
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length;
    expect(Math.abs(m)).toBeLessThan(0.03);
    expect(Math.abs(v - 1)).toBeLessThan(0.05);
  });
  it('shuffle is a permutation', () => {
    const s = shuffle([1, 2, 3, 4, 5], mulberry32(3));
    expect(s.slice().sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('linalg', () => {
  it('solves a linear system', () => {
    const x = solve([[2, 1], [1, 3]], [3, 5])!;
    expect(x[0]).toBeCloseTo(0.8);
    expect(x[1]).toBeCloseTo(1.4);
  });
  it('detects singular systems', () => {
    expect(solve([[1, 2], [2, 4]], [1, 2])).toBeNull();
  });
  it('computes eigenpairs of a symmetric matrix', () => {
    // [[2,1],[1,2]] has eigenvalues 3 and 1 with eigenvectors (1,1)/√2 and (1,−1)/√2.
    const e = symmetricEigen([[2, 1], [1, 2]]);
    expect(e.values[0]).toBeCloseTo(3);
    expect(e.values[1]).toBeCloseTo(1);
    expect(Math.abs(e.vectors[0][0])).toBeCloseTo(Math.SQRT1_2);
    expect(Math.abs(e.vectors[0][1])).toBeCloseTo(Math.SQRT1_2);
  });
  it('eigendecomposition reconstructs a 3×3 matrix', () => {
    const S = [[4, 1, 0.5], [1, 3, 0.2], [0.5, 0.2, 1]];
    const { values, vectors } = symmetricEigen(S);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const r = values.reduce((s, l, k) => s + l * vectors[k][i] * vectors[k][j], 0);
        expect(r).toBeCloseTo(S[i][j], 8);
      }
  });
  it('sample covariance uses n−1', () => {
    const C = covariance([[1, 2], [3, 6], [5, 10]]);
    expect(C[0][0]).toBeCloseTo(4);
    expect(C[0][1]).toBeCloseTo(8);
    expect(C[1][1]).toBeCloseTo(16);
  });
  it('cholesky rejects non-PD matrices', () => {
    expect(cholesky([[1, 2], [2, 1]])).toBeNull();
    expect(cholesky([[4, 2], [2, 3]])).not.toBeNull();
  });
});

describe('metrics', () => {
  it('binary confusion and scores', () => {
    const c = binaryConfusion([1, 1, 1, 0, 0, 0, 0, 1], [1, 1, 0, 0, 0, 1, 0, 1]);
    expect(c).toEqual({ tp: 3, fp: 1, tn: 3, fn: 1 });
    const s = binaryScores(c);
    expect(s.accuracy).toBeCloseTo(0.75);
    expect(s.precision).toBeCloseTo(0.75);
    expect(s.recall).toBeCloseTo(0.75);
    expect(s.f1).toBeCloseTo(0.75);
  });
  it('handles zero division', () => {
    const s = binaryScores(binaryConfusion([0, 0], [0, 0]));
    expect(s.precision).toBe(0);
    expect(s.recall).toBe(0);
    expect(s.accuracy).toBe(1);
  });
  it('ROC AUC matches the known sklearn example (0.75)', () => {
    // sklearn docs: y=[0,0,1,1], scores=[0.1,0.4,0.35,0.8] → AUC 0.75
    expect(rocCurve([0.1, 0.4, 0.35, 0.8], [0, 0, 1, 1]).auc).toBeCloseTo(0.75);
  });
  it('perfect and tied ROC', () => {
    expect(rocCurve([0.9, 0.8, 0.2, 0.1], [1, 1, 0, 0]).auc).toBeCloseTo(1);
    expect(rocCurve([0.5, 0.5, 0.5, 0.5], [1, 0, 1, 0]).auc).toBeCloseTo(0.5);
  });
  it('regression scores', () => {
    // sklearn: y=[3,-0.5,2,7], ŷ=[2.5,0,2,8] → MAE .5, MSE .375, R² ≈ 0.9486
    const r = regressionScores([3, -0.5, 2, 7], [2.5, 0, 2, 8]);
    expect(r.mae).toBeCloseTo(0.5);
    expect(r.mse).toBeCloseTo(0.375);
    expect(r.rmse).toBeCloseTo(Math.sqrt(0.375));
    expect(r.r2).toBeCloseTo(0.9486, 3);
  });
  it('multi-class confusion and macro scores', () => {
    const cm = confusionMatrix([0, 1, 2, 2], [0, 2, 2, 2], 3);
    expect(cm).toEqual([[1, 0, 0], [0, 0, 1], [0, 0, 2]]);
    const m = macroScores(cm);
    expect(m.recall).toBeCloseTo((1 + 0 + 1) / 3);
  });
});

describe('datasets', () => {
  it('are deterministic per seed and sized correctly', () => {
    const a = makeClassification('moons', 40, 5).map((p) => [p.x, p.y, p.label]);
    const b = makeClassification('moons', 40, 5).map((p) => [p.x, p.y, p.label]);
    expect(a).toEqual(b);
    expect(a).toHaveLength(40);
    expect(makeRegression('noisy', 25, 1)).toHaveLength(25);
  });
  it('imbalanced dataset is actually imbalanced', () => {
    const d = makeClassification('imbalanced', 100, 1);
    const pos = d.filter((p) => p.label === 1).length;
    expect(pos).toBeLessThan(20);
  });
  it('train/test split partitions indices', () => {
    const { train, test } = trainTestSplit(50, 0.3, 9);
    expect(test).toHaveLength(15);
    expect(new Set([...train, ...test]).size).toBe(50);
  });
});
