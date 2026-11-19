import { useEffect, useMemo, useState } from 'react';
import { EditablePoints, Heatmap, Plot2D, Probe, type EditMode } from '@/components/charts/Plot2D';
import { blendClasses, classVar, usePalette } from '@/components/charts/colors';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { TreeDiagram } from '@/components/charts/TreeDiagram';
import { Callout, Segmented, Slider, Stat, Toggle } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { CLASS_DOMAIN, makeClassification, type ClassificationDatasetId } from '@/lib/ml/datasets';
import { buildTree, predictTree, predictTreeProba } from '@/lib/ml/decisionTree';
import { predictForest, trainForest } from '@/lib/ml/randomForest';
import { accuracy } from '@/lib/ml/metrics';
import type { ClassPoint } from '@/lib/ml/types';
import { ClassLegend, ClassPicker, DatasetPanel, Hint, LabShell, ModePicker, Panel, StatGrid, type LabProps } from './shared/LabUI';
import { labEvent, usePointSet } from './shared/hooks';
import { SplitLines, useTrainTest } from './DecisionTreeLab';

const LIMIT = 200;
type View = 'forest' | 'tree' | 'compare';

export default function RandomForestLab({ presentation, preset }: LabProps) {
  const { t, num } = useI18n();
  const { classRGB, plotRGB, regionAlpha } = usePalette();
  const initDs: ClassificationDatasetId = preset === 'compare' ? 'moons' : 'overlap';
  const initSeed = preset === 'compare' ? 3 : 2;
  const [dataset, setDataset] = useState<ClassificationDatasetId>(initDs);
  const [seed, setSeed] = useState(initSeed);
  const [n, setN] = useState(140);
  const ps = usePointSet<ClassPoint>(() => makeClassification(initDs, 140, initSeed), LIMIT);
  const [mode, setMode] = useState<EditMode>('query');
  const [addClass, setAddClass] = useState(0);
  const [nTrees, setNTrees] = useState(25);
  const [maxDepth, setMaxDepth] = useState(8);
  const [maxFeatures, setMaxFeatures] = useState<'sqrt' | 'all'>('sqrt');
  const [bootstrap, setBootstrap] = useState(true);
  const [forestSeed, setForestSeed] = useState(1);
  const [view, setView] = useState<View>(preset === 'compare' ? 'compare' : 'forest');
  const [treeIdx, setTreeIdx] = useState(0);
  const [query, setQuery] = useState<[number, number]>([0.3, 0.2]);
  const [showDiagram, setShowDiagram] = useState(false);
  const points = ps.points;
  const { train, test, isTest } = useTrainTest(points, 0.3, seed);
  const nClasses = Math.max(2, ...points.map((p) => p.label + 1));
  const X = useMemo(() => train.map((p) => [p.x, p.y]), [train]);
  const y = useMemo(() => train.map((p) => p.label), [train]);

  const forest = useMemo(
    () => (X.length > 1 ? trainForest(X, y, nClasses, { nTrees, maxDepth, minSamplesSplit: 2, criterion: 'gini', maxFeatures, bootstrap, seed: forestSeed }) : null),
    [X, y, nClasses, nTrees, maxDepth, maxFeatures, bootstrap, forestSeed],
  );
  const single = useMemo(() => (X.length > 1 ? buildTree(X, y, nClasses, { maxDepth, minSamplesSplit: 2, criterion: 'gini' }) : null), [X, y, nClasses, maxDepth]);
  useEffect(() => {
    if (forest) labEvent('random-forest', 'trained');
  }, [forest]);
  const ti = Math.min(treeIdx, nTrees - 1);
  const chosen = forest?.trees[ti];

  const testY = test.map((p) => p.label);
  const forestTest = forest && test.length ? accuracy(testY, test.map((p) => predictForest(forest, [p.x, p.y]).label)) : NaN;
  const forestTrain = forest ? accuracy(y, X.map((x) => predictForest(forest, x).label)) : NaN;
  const singleTest = single && test.length ? accuracy(testY, test.map((p) => predictTree(single.root, [p.x, p.y]))) : NaN;
  const singleTrain = single ? accuracy(y, X.map((x) => predictTree(single.root, x))) : NaN;

  const byTrees = useMemo(() => {
    if (!forest || test.length === 0) return [];
    const acc: number[] = [];
    const sums = test.map(() => new Array<number>(nClasses).fill(0));
    forest.trees.forEach((tr) => {
      test.forEach((p, i) => predictTreeProba(tr.tree.root, [p.x, p.y]).forEach((v, c) => (sums[i][c] += v)));
      acc.push(accuracy(testY, sums.map((s) => s.indexOf(Math.max(...s)))));
    });
    return acc;
  }, [forest, test]); // eslint-disable-line react-hooks/exhaustive-deps

  const qPred = forest ? predictForest(forest, query) : null;
  const voteCounts = qPred ? Array.from({ length: nClasses }, (_, c) => qPred.treeVotes.filter((v) => v === c).length) : [];
  const regenerate = (d = dataset, s = seed, count = n) => ps.setPoints(makeClassification(d, count, s));
  const vKey = `${points.length}|${points.reduce((a, p) => a + p.x * 3 + p.y + p.label, 0)}|${nTrees}|${maxDepth}|${maxFeatures}|${bootstrap}|${forestSeed}|${classRGB[0][0]}`;
  const inBag = chosen ? new Set(chosen.sample.map((i) => train[i].id)) : new Set<string>();

  const forestPlot = (compact?: boolean) => (
    <Plot2D
      domain={CLASS_DOMAIN}
      xLabel="x₁"
      yLabel="x₂"
      compact={compact}
      ariaLabel={t(['Random forest decision regions', 'مناطق قرار الغابة العشوائية'])}
      onBackgroundPointer={mode === 'add' ? (x, yy) => ps.add({ x, y: yy, label: addClass }) : mode === 'query' ? (x, yy) => setQuery([x, yy]) : undefined}
    >
      {forest && <Heatmap version={`f${vKey}`} res={compact ? 70 : 85} fn={(x, yy) => blendClasses(predictForest(forest, [x, yy]).proba, classRGB, plotRGB, regionAlpha)} />}
      <EditablePoints points={points} mode={mode} onMove={ps.move} onRemove={ps.remove} colorOf={(p) => classVar(p.label)} opacityOf={(p) => (isTest.has(p.id) ? 0.4 : 1)} radius={compact ? 4.5 : 6} />
      {qPred && <Probe x={query[0]} y={query[1]} color={classVar(qPred.label)} />}
    </Plot2D>
  );

  return (
    <LabShell
      presentation={presentation}
      viz={
        <>
          <div className="mb-2 px-1">
            <Segmented
              label={t(['View', 'العرض'])}
              value={view}
              onChange={(v) => {
                setView(v);
                if (v === 'compare') labEvent('random-forest', 'compared');
              }}
              size="sm"
              options={[
                { value: 'forest', label: t(['Whole forest', 'الغابة كاملة']) },
                { value: 'tree', label: t(['One tree', 'شجرة واحدة']) },
                { value: 'compare', label: t(['Forest vs single tree', 'الغابة مقابل شجرة واحدة']) },
              ]}
            />
          </div>
          {view === 'forest' && forestPlot()}
          {view === 'tree' && chosen && (
            <Plot2D domain={CLASS_DOMAIN} xLabel="x₁" yLabel="x₂" ariaLabel={t(['One tree of the forest', 'شجرة واحدة من الغابة'])} onBackgroundPointer={mode === 'query' ? (x, yy) => setQuery([x, yy]) : undefined}>
              <Heatmap version={`t${ti}${vKey}`} fn={(x, yy) => blendClasses(predictTreeProba(chosen.tree.root, [x, yy]), classRGB, plotRGB, regionAlpha)} />
              <SplitLines node={chosen.tree.root} box={CLASS_DOMAIN} />
              <EditablePoints points={train} mode="none" colorOf={(p) => classVar(p.label)} opacityOf={(p) => (inBag.has(p.id) ? 1 : 0.2)} />
              <Probe x={query[0]} y={query[1]} color={classVar(predictTree(chosen.tree.root, query))} />
            </Plot2D>
          )}
          {view === 'compare' && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="px-2 pb-1 text-sm font-semibold text-ink">
                  {t(['Random forest', 'الغابة العشوائية'])} · {nTrees} {t(['trees', 'شجرة'])}
                </div>
                {forestPlot(true)}
                <div className="px-2 pt-1 text-xs text-muted ltr font-mono">test acc = {num(forestTest, 3)}</div>
              </div>
              <div>
                <div className="px-2 pb-1 text-sm font-semibold text-ink">{t(['Single decision tree', 'شجرة قرار واحدة'])}</div>
                <Plot2D domain={CLASS_DOMAIN} compact ariaLabel={t(['Single decision tree regions', 'مناطق شجرة قرار واحدة'])}>
                  {single && <Heatmap version={`s${vKey}`} res={70} fn={(x, yy) => blendClasses(predictTreeProba(single.root, [x, yy]), classRGB, plotRGB, regionAlpha)} />}
                  <EditablePoints points={points} mode="none" colorOf={(p) => classVar(p.label)} opacityOf={(p) => (isTest.has(p.id) ? 0.4 : 1)} radius={4.5} />
                </Plot2D>
                <div className="px-2 pt-1 text-xs text-muted ltr font-mono">test acc = {num(singleTest, 3)}</div>
              </div>
            </div>
          )}
          <ClassLegend
            names={Array.from({ length: nClasses }, (_, c) => `${t(C.class)} ${c}`)}
            extra={<span>{view === 'tree' ? t(['faded = out-of-bag (not drawn for this tree)', 'الباهتة = خارج الحقيبة (لم تُسحب لهذه الشجرة)']) : t(['faded = test points', 'الباهتة = نقاط الاختبار'])}</span>}
          />
          <Hint>{t(['Soft colours show the averaged class probability; the forest boundary is smoother than any single tree.', 'تُظهر الألوان الناعمة متوسط احتمال الفئة؛ حدود الغابة أنعم من أي شجرة منفردة.'])}</Hint>
        </>
      }
      status={
        <>
          <StatGrid>
            <Stat label={t(['Forest test acc.', 'دقة اختبار الغابة'])} value={num(forestTest, 3)} tone="accent" />
            <Stat label={t(['Single tree test acc.', 'دقة اختبار الشجرة الواحدة'])} value={num(singleTest, 3)} />
            <Stat label={t(['OOB score', 'درجة خارج الحقيبة'])} value={forest?.oobScore != null ? num(forest.oobScore, 3) : '—'} sub={t(['free validation', 'تحقق مجاني'])} />
            <Stat label={t(['Train acc. (forest / tree)', 'دقة التدريب (غابة / شجرة)'])} value={`${num(forestTrain, 2)} / ${num(singleTrain, 2)}`} />
          </StatGrid>
          {Number.isFinite(forestTest) && Number.isFinite(singleTest) && forestTest > singleTest + 0.02 && (
            <Callout tone="tip">{t(['Averaging many de-correlated trees reduces variance: the forest generalizes better than one deep tree trained on the same data.', 'متوسط العديد من الأشجار غير المترابطة يقلل التباين: الغابة تعمّم أفضل من شجرة عميقة واحدة مدرَّبة على البيانات نفسها.'])}</Callout>
          )}
          {Number.isFinite(forestTest) && Number.isFinite(singleTest) && forestTest < singleTest && (
            <Callout tone="info" title={t(['Results vary from split to split', 'النتائج تختلف من تقسيم لآخر'])}>
              {t(['On this particular train/test split the single tree scored higher. A test set of ~40 points is small, so scores are noisy. Try other seeds: averaged over many splits, forests usually generalize better.', 'في هذا التقسيم تحديدًا حققت الشجرة الواحدة نتيجة أعلى. بيانات اختبار من نحو 40 نقطة صغيرة، فتكون النتائج مشوّشة. جرّب بذورًا أخرى: في المتوسط عبر تقسيمات كثيرة تعمّم الغابات عادةً بشكل أفضل.'])}
            </Callout>
          )}
        </>
      }
      below={
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={t(['How the trees voted for the query point', 'كيف صوّتت الأشجار لنقطة الاستعلام'])}>
            {qPred && (
              <>
                <BarChart ariaLabel={t(['Tree votes per class', 'أصوات الأشجار لكل فئة'])} bars={voteCounts.map((v, c) => ({ label: `${t(C.class)} ${c}`, value: v, color: classVar(c), highlight: c === qPred.label }))} format={(v) => v.toFixed(0)} />
                <div className="flex flex-wrap gap-1" aria-label={t(['Each tree’s vote', 'صوت كل شجرة'])}>
                  {qPred.treeVotes.map((v, i) => (
                    <button key={i} type="button" onClick={() => { setTreeIdx(i); setView('tree'); }} title={`tree ${i + 1}: class ${v}`} className="h-5 w-5 rounded text-[9px] font-mono text-white ring-1 ring-black/10" style={{ background: classVar(v) }}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted ltr font-mono">p = [{qPred.proba.map((p) => p.toFixed(2)).join(', ')}] → class {qPred.label}</p>
              </>
            )}
          </Panel>
          <Panel title={t(['Test accuracy vs number of trees', 'دقة الاختبار مقابل عدد الأشجار'])}>
            <LineChart ariaLabel={t(['Accuracy as trees are added', 'الدقة مع إضافة الأشجار'])} series={[{ id: 'acc', label: 'test', values: byTrees, color: 'var(--c-accent)' }]} refLines={Number.isFinite(singleTest) ? [{ y: singleTest, label: t(['single tree', 'شجرة واحدة']), color: 'var(--c-class-1)' }] : undefined} xStart={1} xLabel={t(['trees', 'الأشجار'])} format={(v) => v.toFixed(2)} />
          </Panel>
          <Panel title={t(['Feature importance (mean impurity decrease)', 'أهمية الخصائص (متوسط انخفاض عدم النقاء)'])}>
            {forest && single && (
              <BarChart
                ariaLabel={t(['Feature importances', 'أهمية الخصائص'])}
                bars={[
                  { label: 'x₁ · forest', value: forest.importances[0], color: 'var(--c-accent)' },
                  { label: 'x₂ · forest', value: forest.importances[1], color: 'var(--c-accent)' },
                  { label: 'x₁ · tree', value: single.importances[0], color: 'var(--c-purple)' },
                  { label: 'x₂ · tree', value: single.importances[1], color: 'var(--c-purple)' },
                ]}
                yMax={1}
              />
            )}
          </Panel>
          <Panel title={`${t(['Inspect tree', 'افحص الشجرة'])} #${ti + 1}`}>
            <Slider label={t(['Tree index', 'رقم الشجرة'])} value={ti + 1} min={1} max={nTrees} onChange={(v) => { setTreeIdx(v - 1); setView('tree'); }} />
            {chosen && (
              <p className="text-xs text-muted">
                {t(['Bootstrap sample: drawn', 'عينة bootstrap: سُحبت'])} <span className="ltr font-mono">{chosen.sample.length}</span> {t(['times with replacement →', 'مرة مع الإرجاع ←'])} <span className="ltr font-mono">{new Set(chosen.sample).size}</span> {t(['unique points;', 'نقطة فريدة؛'])} <span className="ltr font-mono">{chosen.oob.length}</span> {t(['out-of-bag.', 'خارج الحقيبة.'])} {t(['Depth', 'العمق'])} <span className="ltr font-mono">{chosen.tree.depth}</span>, {t(['leaves', 'الأوراق'])} <span className="ltr font-mono">{chosen.tree.leafCount}</span>.
              </p>
            )}
            <Toggle label={t(['Show this tree’s diagram', 'إظهار مخطط هذه الشجرة'])} checked={showDiagram} onChange={setShowDiagram} />
          </Panel>
          {showDiagram && chosen && (
            <Panel className="md:col-span-2">
              <TreeDiagram root={chosen.tree.root} ariaLabel={t(['Selected tree diagram', 'مخطط الشجرة المختارة'])} />
            </Panel>
          )}
        </div>
      }
      controls={
        <>
          <Panel title={t(['Forest parameters', 'معاملات الغابة'])}>
            <Slider label={t(['Number of trees', 'عدد الأشجار'])} value={nTrees} min={1} max={60} onChange={setNTrees} />
            <Slider label={t(['Max depth per tree', 'أقصى عمق لكل شجرة'])} value={maxDepth} min={1} max={12} onChange={setMaxDepth} />
            <Segmented
              label={t(['Features tried per split', 'الخصائص المجرَّبة لكل تقسيم'])}
              value={maxFeatures}
              onChange={setMaxFeatures}
              size="sm"
              options={[
                { value: 'sqrt', label: t(['√d = 1 (random)', '√d = 1 (عشوائي)']) },
                { value: 'all', label: t(['all (2)', 'الكل (2)']) },
              ]}
            />
            <Toggle label={t(['Bootstrap sampling', 'المعاينة bootstrap'])} checked={bootstrap} onChange={setBootstrap} hint={t(['Each tree trains on n points drawn with replacement.', 'تتدرب كل شجرة على n نقطة مسحوبة مع الإرجاع.'])} />
            <Slider label={t(['Forest random seed', 'بذرة الغابة العشوائية'])} value={forestSeed} min={1} max={50} onChange={setForestSeed} />
            {!bootstrap && maxFeatures === 'all' && <p className="text-xs text-warn">{t(['With no bootstrap and all features, every tree is identical — there is no randomness to average out.', 'بدون bootstrap ومع كل الخصائص تصبح جميع الأشجار متطابقة — لا توجد عشوائية لأخذ متوسطها.'])}</p>}
          </Panel>
          <DatasetPanel
            dataset={dataset}
            options={[
              { value: 'overlap', label: t(['Overlapping (noisy)', 'متداخلة (ضوضاء)']) },
              { value: 'moons', label: t(['Moons', 'أهلّة']) },
              { value: 'xor', label: t(['XOR pattern', 'نمط XOR']) },
              { value: 'circles', label: t(['Circles', 'دوائر']) },
              { value: 'threeBlobs', label: t(['Three classes', 'ثلاث فئات']) },
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
