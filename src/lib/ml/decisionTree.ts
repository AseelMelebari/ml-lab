/** CART decision tree classifier (binary axis-aligned splits) with Gini or entropy impurity. */
import { sampleWithoutReplacement, type RNG } from './random';

export type Criterion = 'gini' | 'entropy';

export interface TreeNode {
  id: number;
  depth: number;
  samples: number;
  counts: number[];
  impurity: number;
  prediction: number;
  feature?: number;
  threshold?: number;
  gain?: number;
  left?: TreeNode;
  right?: TreeNode;
}

export interface TreeParams {
  maxDepth: number;
  minSamplesSplit: number;
  minSamplesLeaf?: number;
  criterion: Criterion;
  /** Number of features considered at each split (Random Forest). Defaults to all. */
  maxFeatures?: number;
  rng?: RNG;
}

export interface TrainedTree {
  root: TreeNode;
  nodeCount: number;
  leafCount: number;
  depth: number;
  nClasses: number;
  nFeatures: number;
  /** Mean decrease in impurity, normalized to sum to 1 (all zeros for a single leaf). */
  importances: number[];
}

export function gini(counts: readonly number[]): number {
  const n = counts.reduce((a, b) => a + b, 0);
  if (n === 0) return 0;
  let s = 1;
  for (const c of counts) s -= (c / n) ** 2;
  return s;
}

export function entropy(counts: readonly number[]): number {
  const n = counts.reduce((a, b) => a + b, 0);
  if (n === 0) return 0;
  let s = 0;
  for (const c of counts) if (c > 0) s -= (c / n) * Math.log2(c / n);
  return s;
}

export const impurityFn = (c: Criterion) => (c === 'gini' ? gini : entropy);

const argmax = (a: readonly number[]) => a.reduce((bi, v, i) => (v > a[bi] ? i : bi), 0);

interface Split {
  feature: number;
  threshold: number;
  gain: number;
  leftIdx: number[];
  rightIdx: number[];
}

export function bestSplit(
  X: readonly (readonly number[])[],
  y: readonly number[],
  idx: readonly number[],
  nClasses: number,
  criterion: Criterion,
  features: readonly number[],
  minLeaf: number,
): Split | null {
  const imp = impurityFn(criterion);
  const n = idx.length;
  const parentCounts = new Array<number>(nClasses).fill(0);
  for (const i of idx) parentCounts[y[i]]++;
  const parentImp = imp(parentCounts);
  let best: Split | null = null;
  for (const f of features) {
    const sorted = idx.slice().sort((a, b) => X[a][f] - X[b][f]);
    const left = new Array<number>(nClasses).fill(0);
    const right = parentCounts.slice();
    for (let k = 0; k < n - 1; k++) {
      const c = y[sorted[k]];
      left[c]++;
      right[c]--;
      const v = X[sorted[k]][f];
      const vNext = X[sorted[k + 1]][f];
      if (vNext - v < 1e-12) continue;
      const nl = k + 1;
      const nr = n - nl;
      if (nl < minLeaf || nr < minLeaf) continue;
      const gain = parentImp - (nl / n) * imp(left) - (nr / n) * imp(right);
      if (gain > 1e-12 && (!best || gain > best.gain + 1e-12)) {
        best = {
          feature: f,
          threshold: (v + vNext) / 2,
          gain,
          leftIdx: sorted.slice(0, nl),
          rightIdx: sorted.slice(nl),
        };
      }
    }
  }
  return best;
}

export function buildTree(
  X: readonly (readonly number[])[],
  y: readonly number[],
  nClasses: number,
  params: TreeParams,
  sampleIdx?: readonly number[],
): TrainedTree {
  const nFeatures = X[0]?.length ?? 0;
  const imp = impurityFn(params.criterion);
  const importances = new Array<number>(nFeatures).fill(0);
  const minLeaf = Math.max(1, params.minSamplesLeaf ?? 1);
  let nodeCount = 0;
  let leafCount = 0;
  let maxDepthSeen = 0;
  const allFeatures = Array.from({ length: nFeatures }, (_, i) => i);
  const rootIdx = sampleIdx ? sampleIdx.slice() : X.map((_, i) => i);
  const N = rootIdx.length;

  const grow = (idx: number[], depth: number): TreeNode => {
    const counts = new Array<number>(nClasses).fill(0);
    for (const i of idx) counts[y[i]]++;
    const node: TreeNode = {
      id: nodeCount++,
      depth,
      samples: idx.length,
      counts,
      impurity: imp(counts),
      prediction: argmax(counts),
    };
    maxDepthSeen = Math.max(maxDepthSeen, depth);
    const pure = node.impurity < 1e-12;
    if (pure || depth >= params.maxDepth || idx.length < params.minSamplesSplit) {
      leafCount++;
      return node;
    }
    let split: Split | null = null;
    if (params.maxFeatures && params.maxFeatures < nFeatures && params.rng) {
      // Random feature subset, falling back to the remaining features if no valid split is found
      // (mirrors scikit-learn's behaviour).
      const order = sampleWithoutReplacement(nFeatures, nFeatures, params.rng);
      split = bestSplit(X, y, idx, nClasses, params.criterion, order.slice(0, params.maxFeatures), minLeaf);
      if (!split) split = bestSplit(X, y, idx, nClasses, params.criterion, order.slice(params.maxFeatures), minLeaf);
    } else {
      split = bestSplit(X, y, idx, nClasses, params.criterion, allFeatures, minLeaf);
    }
    if (!split) {
      leafCount++;
      return node;
    }
    node.feature = split.feature;
    node.threshold = split.threshold;
    node.gain = split.gain;
    importances[split.feature] += (idx.length / N) * split.gain;
    node.left = grow(split.leftIdx, depth + 1);
    node.right = grow(split.rightIdx, depth + 1);
    return node;
  };

  const root = grow(rootIdx, 0);
  const total = importances.reduce((a, b) => a + b, 0);
  return {
    root,
    nodeCount,
    leafCount,
    depth: maxDepthSeen,
    nClasses,
    nFeatures,
    importances: total > 0 ? importances.map((v) => v / total) : importances,
  };
}

export const isLeaf = (n: TreeNode) => !n.left || !n.right;

/** Follows x from the root to a leaf; returns every node visited. */
export function decisionPath(root: TreeNode, x: readonly number[]): TreeNode[] {
  const path: TreeNode[] = [root];
  let node = root;
  while (!isLeaf(node)) {
    node = x[node.feature!] <= node.threshold! ? node.left! : node.right!;
    path.push(node);
  }
  return path;
}

export function predictLeaf(root: TreeNode, x: readonly number[]): TreeNode {
  let node = root;
  while (!isLeaf(node)) node = x[node.feature!] <= node.threshold! ? node.left! : node.right!;
  return node;
}

export const predictTree = (root: TreeNode, x: readonly number[]) => predictLeaf(root, x).prediction;

/** Class probabilities = class proportions in the leaf. */
export function predictTreeProba(root: TreeNode, x: readonly number[]): number[] {
  const leaf = predictLeaf(root, x);
  return leaf.counts.map((c) => c / leaf.samples);
}

export function collectNodes(root: TreeNode): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (n: TreeNode) => {
    out.push(n);
    if (n.left) walk(n.left);
    if (n.right) walk(n.right);
  };
  walk(root);
  return out;
}
