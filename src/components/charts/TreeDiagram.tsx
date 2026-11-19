import { useMemo } from 'react';
import { isLeaf, type TreeNode } from '@/lib/ml/decisionTree';
import { classVar } from './colors';

const FEATURE_NAMES = ['x₁', 'x₂'];

/** Node-link diagram of a trained decision tree. Highlights an optional decision path. */
export function TreeDiagram({
  root,
  highlight,
  featureNames = FEATURE_NAMES,
  criterionLabel = 'gini',
  ariaLabel,
}: {
  root: TreeNode;
  highlight?: ReadonlySet<number>;
  featureNames?: string[];
  criterionLabel?: string;
  ariaLabel: string;
}) {
  const layout = useMemo(() => {
    const nodes: { node: TreeNode; x: number; y: number; parent?: { x: number; y: number } }[] = [];
    let leafIdx = 0;
    let maxDepth = 0;
    const place = (n: TreeNode): number => {
      maxDepth = Math.max(maxDepth, n.depth);
      if (isLeaf(n)) {
        const x = leafIdx++;
        nodes.push({ node: n, x, y: n.depth });
        return x;
      }
      const lx = place(n.left!);
      const rx = place(n.right!);
      const x = (lx + rx) / 2;
      nodes.push({ node: n, x, y: n.depth });
      return x;
    };
    place(root);
    const byId = new Map(nodes.map((p) => [p.node.id, p]));
    const edges: { from: (typeof nodes)[number]; to: (typeof nodes)[number]; left: boolean }[] = [];
    for (const p of nodes)
      if (!isLeaf(p.node)) {
        edges.push({ from: p, to: byId.get(p.node.left!.id)!, left: true });
        edges.push({ from: p, to: byId.get(p.node.right!.id)!, left: false });
      }
    return { nodes, edges, leaves: leafIdx, depth: maxDepth };
  }, [root]);

  const NW = 92;
  const NH = 50;
  const GX = 104;
  const GY = 86;
  const W = Math.max(320, layout.leaves * GX + 20);
  const H = (layout.depth + 1) * GY + 10;
  const px = (x: number) => 10 + x * GX + GX / 2;
  const py = (y: number) => 10 + y * GY;
  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} style={{ direction: 'ltr', minWidth: Math.min(W, 320) }} className="mx-auto block">
        {layout.edges.map((e, i) => {
          const on = highlight?.has(e.from.node.id) && highlight?.has(e.to.node.id);
          const x1 = px(e.from.x);
          const y1 = py(e.from.y) + NH;
          const x2 = px(e.to.x);
          const y2 = py(e.to.y);
          return (
            <g key={i}>
              <path d={`M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`} fill="none" stroke={on ? 'var(--c-warn)' : 'var(--c-border)'} strokeWidth={on ? 3 : 1.5} />
              <text x={(x1 + x2) / 2 + (e.left ? -6 : 6)} y={(y1 + y2) / 2} fontSize={10} textAnchor={e.left ? 'end' : 'start'} fill="var(--c-subtle)">
                {e.left ? 'yes' : 'no'}
              </text>
            </g>
          );
        })}
        {layout.nodes.map(({ node, x, y }) => {
          const on = highlight?.has(node.id);
          const leaf = isLeaf(node);
          const total = node.samples || 1;
          let acc = 0;
          return (
            <g key={node.id} transform={`translate(${px(x) - NW / 2} ${py(y)})`}>
              <rect width={NW} height={NH} rx={9} fill={leaf ? `color-mix(in oklab, ${classVar(node.prediction)} 22%, var(--c-surface))` : 'var(--c-surface)'} stroke={on ? 'var(--c-warn)' : leaf ? classVar(node.prediction) : 'var(--c-border)'} strokeWidth={on ? 2.5 : 1.2} />
              <text x={NW / 2} y={16} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="var(--c-text)" fontFamily="JetBrains Mono Variable, monospace">
                {leaf ? `→ class ${node.prediction}` : `${featureNames[node.feature!]} ≤ ${node.threshold!.toFixed(2)}`}
              </text>
              <text x={NW / 2} y={30} textAnchor="middle" fontSize={9.5} fill="var(--c-muted)" fontFamily="JetBrains Mono Variable, monospace">
                {criterionLabel}={node.impurity.toFixed(3)} n={node.samples}
              </text>
              <g transform="translate(8 37)">
                {node.counts.map((c, k) => {
                  const w = ((NW - 16) * c) / total;
                  const r = <rect key={k} x={acc} y={0} width={w} height={6} fill={classVar(k)} />;
                  acc += w;
                  return r;
                })}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
