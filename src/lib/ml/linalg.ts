/** Small dense linear-algebra helpers (educational sizes only). */
export type Matrix = number[][];

export function zeros(r: number, c: number): Matrix {
  return Array.from({ length: r }, () => new Array<number>(c).fill(0));
}

export function identity(n: number): Matrix {
  const m = zeros(n, n);
  for (let i = 0; i < n; i++) m[i][i] = 1;
  return m;
}

export function transpose(a: Matrix): Matrix {
  if (a.length === 0) return [];
  return a[0].map((_, j) => a.map((row) => row[j]));
}

export function matMul(a: Matrix, b: Matrix): Matrix {
  const n = a.length;
  const m = b[0]?.length ?? 0;
  const k = b.length;
  const out = zeros(n, m);
  for (let i = 0; i < n; i++)
    for (let p = 0; p < k; p++) {
      const aip = a[i][p];
      if (aip === 0) continue;
      for (let j = 0; j < m; j++) out[i][j] += aip * b[p][j];
    }
  return out;
}

export function matVec(a: Matrix, v: number[]): number[] {
  return a.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
}

export function dot(a: readonly number[], b: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/**
 * Solve A x = b with Gaussian elimination and partial pivoting.
 * Returns null when the system is (numerically) singular.
 */
export function solve(A: Matrix, b: number[]): number[] | null {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-12) return null;
    [M[col], M[piv]] = [M[piv], M[col]];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c];
    x[r] = s / M[r][r];
  }
  return x;
}

export function columnMeans(X: Matrix): number[] {
  const d = X[0]?.length ?? 0;
  const m = new Array<number>(d).fill(0);
  for (const row of X) for (let j = 0; j < d; j++) m[j] += row[j];
  return m.map((v) => v / Math.max(1, X.length));
}

/** Sample standard deviation per column (denominator n - 1). */
export function columnStds(X: Matrix, means = columnMeans(X)): number[] {
  const d = means.length;
  const s = new Array<number>(d).fill(0);
  for (const row of X) for (let j = 0; j < d; j++) s[j] += (row[j] - means[j]) ** 2;
  return s.map((v) => Math.sqrt(v / Math.max(1, X.length - 1)));
}

/** Sample covariance matrix (denominator n - 1). */
export function covariance(X: Matrix): Matrix {
  const n = X.length;
  const mu = columnMeans(X);
  const d = mu.length;
  const C = zeros(d, d);
  for (const row of X)
    for (let i = 0; i < d; i++) {
      const di = row[i] - mu[i];
      for (let j = i; j < d; j++) C[i][j] += di * (row[j] - mu[j]);
    }
  for (let i = 0; i < d; i++)
    for (let j = i; j < d; j++) {
      C[i][j] /= Math.max(1, n - 1);
      C[j][i] = C[i][j];
    }
  return C;
}

export interface EigenResult {
  /** Eigenvalues sorted in descending order. */
  values: number[];
  /** Eigenvectors as rows, matching `values`. Each has unit length. */
  vectors: number[][];
}

/**
 * Cyclic Jacobi eigenvalue algorithm for real symmetric matrices.
 * Robust and exact enough for the small matrices used in the labs.
 */
export function symmetricEigen(S: Matrix, maxSweeps = 100, tol = 1e-12): EigenResult {
  const n = S.length;
  const A = S.map((r) => r.slice());
  const V = identity(n);
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] ** 2;
    if (off < tol) break;
    for (let p = 0; p < n; p++)
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k][p];
          const akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k];
          const aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p];
          const vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
  }
  const pairs = Array.from({ length: n }, (_, i) => ({
    value: A[i][i],
    vector: V.map((row) => row[i]),
  }));
  pairs.sort((a, b) => b.value - a.value);
  return { values: pairs.map((p) => p.value), vectors: pairs.map((p) => p.vector) };
}

/** Cholesky decomposition of a symmetric positive-definite matrix; null if not PD. */
export function cholesky(A: Matrix): Matrix | null {
  const n = A.length;
  const L = zeros(n, n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (s <= 1e-12) return null;
        L[i][i] = Math.sqrt(s);
      } else L[i][j] = s / L[j][j];
    }
  return L;
}
