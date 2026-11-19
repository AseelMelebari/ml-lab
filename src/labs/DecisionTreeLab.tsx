import { useEffect, useMemo, useState } from 'react';
import { EditablePoints, Heatmap, Plot2D, Probe, usePlot, type EditMode } from '@/components/charts/Plot2D';
import { blendClasses, classVar, usePalette } from '@/components/charts/colors';
import { LineChart } from '@/components/charts/LineChart';
import { TreeDiagram } from '@/components/charts/TreeDiagram';
import { Button, Callout, Segmented, Slider, Stat, Toggle } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { CLASS_DOMAIN, makeClassification, trainTestSplit, type ClassificationDatasetId } from '@/lib/ml/datasets';
import { buildTree, decisionPath, isLeaf, predictTree, predictTreeProba, type Criterion, type TreeNode } from '@/lib/ml/decisionTree';
import { accuracy } from '@/lib/ml/metrics';
import type { ClassPoint, Domain } from '@/lib/ml/types';
import { ClassLegend, ClassPicker, DatasetPanel, Hint, LabShell, ModePicker, Panel, PointsTable, StatGrid, type LabProps } from './shared/LabUI';
import { labEvent, useLoop, usePointSet } from './shared/hooks';
import { Sprout } from 'lucide-react';

const LIMIT = 200;

export function useTrainTest(points: ClassPoint[], testFrac: number, seed: number) {
  return useMemo(() => {
    const { train, test } = trainTestSplit(points.length, testFrac, seed + 1000);
    const isTest = new Set(test.map((i) => points[i].id));
    return { train: train.map((i) => points[i]), test: test.map((i) => points[i]), isTest };
  }, [points, testFrac, seed]);
}

export default function DecisionTreeLab({ presentation, preset }: LabProps) {
  const { t, num } = useI18n();
  const { classRGB, plotRGB, regionAlpha } = usePalette();
  const initDs: ClassificationDatasetId = preset === 'overfit' ? 'overlap' : 'moons';
  const [dataset, setDataset] = useState<ClassificationDatasetId>(initDs);
  const [seed, setSeed] = useState(8);
  const [n, setN] = useState(120);
  const ps = usePointSet<ClassPoint>(() => makeClassification(initDs, 120, 8), LIMIT);
  const [mode, setMode] = useState<EditMode>('query');
  const [addClass, setAddClass] = useState(0);
  const [maxDepth, setMaxDepth] = useState(preset === 'overfit' ? 1 : 3);
  const [minSplit, setMinSplit] = useState(2);
  const [criterion, setCriterion] = useState<Criterion>('gini');
  const [testFrac, setTestFrac] = useState(0.3);
  const [showSplits, setShowSplits] = useState(true);
  const [query, setQuery] = useState<[number, number]>([0.5, 0.5]);
  const [growing, setGrowing] = useState(false);
  const [growTarget, setGrowTarget] = useState(10);
  const points = ps.points;
  const { train, test, isTest } = useTrainTest(points, testFrac, seed);
  const nClasses = Math.max(2, ...points.map((p) => p.label + 1));

  const fit = (depth: number) => buildTree(train.map((p) => [p.x, p.y]), train.map((p) => p.label), nClasses, { maxDepth: depth, minSamplesSplit: minSplit, criterion });
  const tree = useMemo(() => (train.length > 0 ? fit(maxDepth) : null), [train, maxDepth, minSplit, criterion, nClasses]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tree) labEvent('decision-tree', 'trained');
    if (tree && tree.depth >= 6) labEvent('decision-tree', 'deep');
  }, [tree]);

  const curve = useMemo(() => {
    const tr: number[] = [];
    const te: number[] = [];
    if (train.length === 0) return { tr, te };
    for (let d = 1; d <= 12; d++) {
      const tt = fit(d);
      tr.push(accuracy(train.map((p) => p.label), train.map((p) => predictTree(tt.root, [p.x, p.y]))));
      te.push(test.length ? accuracy(test.map((p) => p.label), test.map((p) => predictTree(tt.root, [p.x, p.y]))) : NaN);
    }
    return { tr, te };
  }, [train, test, minSplit, criterion, nClasses]); // eslint-disable-line react-hooks/exhaustive-deps

  useLoop(
    growing,
    () => {
      if (maxDepth >= growTarget) setGrowing(false);
      else setMaxDepth((d) => d + 1);
    },
    900,
  );

  const path = tree ? decisionPath(tree.root, query) : [];
  const pathIds = new Set(path.map((p) => p.id));
  const trainAcc = tree ? accuracy(train.map((p) => p.label), train.map((p) => predictTree(tree.root, [p.x, p.y]))) : 0;
  const testAcc = tree && test.length ? accuracy(test.map((p) => p.label), test.map((p) => predictTree(tree.root, [p.x, p.y]))) : NaN;
  const regenerate = (d = dataset, s = seed, count = n) => ps.setPoints(makeClassification(d, count, s));
  const version = `${tree?.nodeCount}|${maxDepth}|${minSplit}|${criterion}|${points.length}|${points.map((p) => p.x + p.y + p.label).reduce((a, b) => a + b, 0)}|${classRGB[0][0]}|${testFrac}`;
  const fNames = ['x₁', 'x₂'];
  const overfit = tree && Number.isFinite(testAcc) && trainAcc - testAcc > 0.08 && tree.depth >= 5;

  return (
    <LabShell
      presentation={presentation}
      viz={
        <>
          <Plot2D
            domain={CLASS_DOMAIN}
            xLabel="x₁"
            yLabel="x₂"
            ariaLabel={t(['Decision regions of the trained tree', 'مناطق القرار للشجرة المدرَّبة'])}
            onBackgroundPointer={mode === 'add' ? (x, y) => ps.add({ x, y, label: addClass }) : mode === 'query' ? (x, y) => setQuery([x, y]) : undefined}
          >
            {tree && <Heatmap version={version} fn={(x, y) => blendClasses(predictTreeProba(tree.root, [x, y]), classRGB, plotRGB, regionAlpha)} />}
            {tree && showSplits && <SplitLines node={tree.root} box={CLASS_DOMAIN} highlight={pathIds} />}
            <EditablePoints points={points} mode={mode} onMove={ps.move} onRemove={ps.remove} colorOf={(p) => classVar(p.label)} opacityOf={(p) => (isTest.has(p.id) ? 0.4 : 1)} />
            {tree && <Probe x={query[0]} y={query[1]} label={`→ ${predictTree(tree.root, query)}`} color={classVar(predictTree(tree.root, query))} />}
          </Plot2D>
          <ClassLegend names={Array.from({ length: nClasses }, (_, c) => `${t(C.class)} ${c}`)} extra={<span>{t(['faded = test points (not used for training)', 'الباهتة = نقاط اختبار (لا تُستخدم في التدريب)'])}</span>} />
          <Hint>{t(['Query mode: click to follow a prediction through the tree. Lines show each split; highlighted lines are the ones the query point passes through.', 'وضع الاستعلام: انقر لتتبّع التنبؤ عبر الشجرة. الخطوط تمثل التقسيمات، والمميَّزة منها هي التي تمر بها نقطة الاستعلام.'])}</Hint>
        </>
      }
      status={
        <>
          <StatGrid>
            <Stat label={t(['Train accuracy', 'دقة التدريب'])} value={num(trainAcc, 3)} tone="accent" />
            <Stat label={t(['Test accuracy', 'دقة الاختبار'])} value={Number.isFinite(testAcc) ? num(testAcc, 3) : '—'} tone={overfit ? 'warn' : undefined} />
            <Stat label={t(['Depth / leaves', 'العمق / الأوراق'])} value={tree ? `${tree.depth} / ${tree.leafCount}` : '—'} />
            <Stat label={t(['Nodes', 'العُقد'])} value={tree?.nodeCount ?? '—'} />
          </StatGrid>
          {overfit && (
            <Callout tone="warn" title={t(['Overfitting', 'فرط الملاءمة'])}>
              {t(['The tree fits training points almost perfectly, but test accuracy is clearly lower. Its many small regions memorise noise instead of the true pattern.', 'تلائم الشجرة نقاط التدريب بشكل شبه تام، لكن دقة الاختبار أقل بوضوح. مناطقها الصغيرة الكثيرة تحفظ الضوضاء بدل النمط الحقيقي.'])}
            </Callout>
          )}
        </>
      }
      below={
        <div className="grid gap-4">
          <Panel title={t(['Tree structure', 'بنية الشجرة'])}>{tree && <TreeDiagram root={tree.root} highlight={pathIds} criterionLabel={criterion === 'gini' ? 'gini' : 'H'} ariaLabel={t(['Diagram of the trained decision tree', 'مخطط شجرة القرار المدرَّبة'])} />}</Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title={t(['Following the query point', 'تتبّع نقطة الاستعلام'])}>
              <ol className="space-y-1.5 text-sm">
                {path.map((node, i) =>
                  isLeaf(node) ? (
                    <li key={node.id} className="rounded-lg bg-surface-2 px-3 py-2">
                      <span className="font-semibold text-ink">{t(['Leaf', 'ورقة'])}:</span> {t(['predict', 'التنبؤ'])} <b>{t(C.class)} {node.prediction}</b>{' '}
                      <span className="ltr font-mono text-xs text-muted">[{node.counts.join(', ')}]</span>
                    </li>
                  ) : (
                    <li key={node.id} className="ltr font-mono text-xs text-muted">
                      {i + 1}. {fNames[node.feature!]} = {query[node.feature!].toFixed(2)} ≤ {node.threshold!.toFixed(2)} ? → <b className="text-ink">{query[node.feature!] <= node.threshold! ? 'yes (left)' : 'no (right)'}</b>
                    </li>
                  ),
                )}
              </ol>
            </Panel>
            <Panel title={t(['Train vs test accuracy by depth', 'دقة التدريب مقابل الاختبار حسب العمق'])}>
              <LineChart
                ariaLabel={t(['Accuracy as a function of maximum depth', 'الدقة بدلالة أقصى عمق'])}
                series={[
                  { id: 'tr', label: t(['train', 'التدريب']), values: curve.tr, color: 'var(--c-accent)' },
                  { id: 'te', label: t(['test', 'الاختبار']), values: curve.te, color: 'var(--c-class-1)', dashed: true },
                ]}
                xStart={1}
                xLabel={t(['max depth', 'أقصى عمق'])}
                format={(v) => v.toFixed(2)}
              />
            </Panel>
          </div>
          <PointsTable points={points} onUpdate={ps.update} onRemove={ps.remove} labelName={t(C.class)} classNames={['0', '1', '2']} extraColumns={[{ header: t(['set', 'المجموعة']), value: (p) => (isTest.has(p.id) ? 'test' : 'train') }]} />
        </div>
      }
      controls={
        <>
          <Panel title={t(C.parameters)}>
            <Slider label={t(['Max depth', 'أقصى عمق'])} value={maxDepth} min={1} max={12} onChange={setMaxDepth} />
            <Slider label={t(['Min samples to split', 'أدنى عدد عينات للتقسيم'])} value={minSplit} min={2} max={40} onChange={setMinSplit} hint={t(['A node with fewer samples becomes a leaf.', 'العقدة التي تحتوي عينات أقل تصبح ورقة.'])} />
            <Segmented label={t(['Split criterion', 'معيار التقسيم'])} value={criterion} onChange={setCriterion} size="sm" options={[{ value: 'gini', label: 'Gini' }, { value: 'entropy', label: t(['Entropy', 'الإنتروبيا']) }]} />
            <Slider label={t(['Test fraction', 'نسبة الاختبار'])} value={testFrac} min={0} max={0.5} step={0.05} onChange={setTestFrac} format={(v) => `${Math.round(v * 100)}%`} />
            <Toggle label={t(['Show split lines', 'إظهار خطوط التقسيم'])} checked={showSplits} onChange={setShowSplits} />
            <Button
              className="w-full"
              variant="primary"
              icon={<Sprout size={16} />}
              onClick={() => {
                if (growing) return setGrowing(false);
                setGrowTarget(Math.max(maxDepth > 1 ? maxDepth : 10, 2));
                setMaxDepth(1);
                setGrowing(true);
              }}
            >
              {growing ? t(C.pause) : t(['Grow level by level', 'نمِّ الشجرة مستوى بمستوى'])}
            </Button>
          </Panel>
          <DatasetPanel
            dataset={dataset}
            options={[
              { value: 'moons', label: t(['Moons', 'أهلّة']) },
              { value: 'xor', label: t(['XOR pattern', 'نمط XOR']) },
              { value: 'threeBlobs', label: t(['Three classes', 'ثلاث فئات']) },
              { value: 'overlap', label: t(['Overlapping (noisy)', 'متداخلة (ضوضاء)']) },
              { value: 'circles', label: t(['Circles', 'دوائر']) },
            ]}
            onDataset={(d) => {
              setDataset(d);
              regenerate(d);
            }}
            n={n}
            onN={(v) => {
              setN(v);
              regenerate(dataset, seed, v);
            }}
            nMax={200}
            seed={seed}
            onSeed={(s) => {
              setSeed(s);
              regenerate(dataset, s);
            }}
            onRegenerate={() => regenerate()}
            count={points.length}
            limit={LIMIT}
          >
            <ModePicker mode={mode} onMode={setMode} modes={['query', 'add', 'move', 'remove']} />
            {mode === 'add' && <ClassPicker value={addClass} onChange={setAddClass} nClasses={3} names={['0', '1', '2']} />}
          </DatasetPanel>
        </>
      }
    />
  );
}

/** Draws each internal node's split as a line segment clipped to that node's region. */
export function SplitLines({ node, box, highlight }: { node: TreeNode; box: Domain; highlight?: ReadonlySet<number> }) {
  const { sx, sy } = usePlot();
  const segs: { x1: number; y1: number; x2: number; y2: number; on: boolean; depth: number }[] = [];
  const walk = (n: TreeNode, b: Domain) => {
    if (isLeaf(n)) return;
    const th = n.threshold!;
    const on = !!highlight?.has(n.id);
    if (n.feature === 0) {
      segs.push({ x1: th, y1: b.yMin, x2: th, y2: b.yMax, on, depth: n.depth });
      walk(n.left!, { ...b, xMax: th });
      walk(n.right!, { ...b, xMin: th });
    } else {
      segs.push({ x1: b.xMin, y1: th, x2: b.xMax, y2: th, on, depth: n.depth });
      walk(n.left!, { ...b, yMax: th });
      walk(n.right!, { ...b, yMin: th });
    }
  };
  walk(node, box);
  return (
    <g pointerEvents="none">
      {segs.map((s, i) => (
        <line key={i} x1={sx(s.x1)} y1={sy(s.y1)} x2={sx(s.x2)} y2={sy(s.y2)} stroke={s.on ? 'var(--c-warn)' : 'var(--c-text)'} strokeWidth={s.on ? 2.6 : Math.max(0.7, 2 - s.depth * 0.3)} opacity={s.on ? 1 : 0.45} />
      ))}
    </g>
  );
}
