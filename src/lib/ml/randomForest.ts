/** Random Forest classifier: bootstrap aggregation of CART trees with random feature subsets. */
import { buildTree, predictTree, predictTreeProba, type Criterion, type TrainedTree } from './decisionTree';
import { mulberry32, randInt } from './random';

export interface ForestParams {
  nTrees: number;
  maxDepth: number;
  minSamplesSplit: number;
  criterion: Criterion;
  /** Features considered per split; 'sqrt' = round(√d) like scikit-learn. */
  maxFeatures: number | 'sqrt' | 'all';
  bootstrap: boolean;
  seed: number;
}

export interface ForestTree {
  tree: TrainedTree;
  /** Indices drawn (with replacement) for this tree. */
  sample: number[];
  /** Indices never drawn: the out-of-bag set. */
  oob: number[];
}

export interface TrainedForest {
  trees: ForestTree[];
  nClasses: number;
  importances: number[];
  /** Out-of-bag accuracy, or null if unavailable. */
  oobScore: number | null;
}

export function resolveMaxFeatures(mf: ForestParams['maxFeatures'], d: number): number {
  if (mf === 'all') return d;
  if (mf === 'sqrt') return Math.max(1, Math.round(Math.sqrt(d)));
  return Math.max(1, Math.min(d, mf));
}

export function trainForest(
  X: readonly (readonly number[])[],
  y: readonly number[],
  nClasses: number,
  p: ForestParams,
): TrainedForest {
  const rng = mulberry32(p.seed);
  const n = X.length;
  const d = X[0]?.length ?? 0;
  const mf = resolveMaxFeatures(p.maxFeatures, d);
  const trees: ForestTree[] = [];
  for (let t = 0; t < p.nTrees; t++) {
    const sample = p.bootstrap ? Array.from({ length: n }, () => randInt(rng, n)) : X.map((_, i) => i);
    const inBag = new Set(sample);
    const oob = X.map((_, i) => i).filter((i) => !inBag.has(i));
    const tree = buildTree(
      X,
      y,
      nClasses,
      { maxDepth: p.maxDepth, minSamplesSplit: p.minSamplesSplit, criterion: p.criterion, maxFeatures: mf, rng },
      sample,
    );
    trees.push({ tree, sample, oob });
  }
  const importances = new Array<number>(d).fill(0);
  for (const t of trees) t.tree.importances.forEach((v, j) => (importances[j] += v / trees.length));

  // OOB accuracy: each sample is predicted only by trees that did not see it.
  let correct = 0;
  let counted = 0;
  if (p.bootstrap) {
    const oobSets = trees.map((t) => new Set(t.oob));
    for (let i = 0; i < n; i++) {
      const proba = new Array<number>(nClasses).fill(0);
      let used = 0;
      trees.forEach((t, ti) => {
        if (!oobSets[ti].has(i)) return;
        predictTreeProba(t.tree.root, X[i]).forEach((v, c) => (proba[c] += v));
        used++;
      });
      if (used === 0) continue;
      counted++;
      if (proba.indexOf(Math.max(...proba)) === y[i]) correct++;
    }
  }
  return { trees, nClasses, importances, oobScore: counted > 0 ? correct / counted : null };
}

export interface ForestPrediction {
  label: number;
  /** Mean of the trees' leaf class proportions (soft voting, as scikit-learn does). */
  proba: number[];
  /** Hard vote of each tree. */
  treeVotes: number[];
}

export function predictForest(forest: TrainedForest, x: readonly number[]): ForestPrediction {
  const proba = new Array<number>(forest.nClasses).fill(0);
  const treeVotes: number[] = [];
  for (const t of forest.trees) {
    predictTreeProba(t.tree.root, x).forEach((v, c) => (proba[c] += v / forest.trees.length));
    treeVotes.push(predictTree(t.tree.root, x));
  }
  let label = 0;
  for (let c = 1; c < proba.length; c++) if (proba[c] > proba[label] + 1e-12) label = c;
  return { label, proba, treeVotes };
}
