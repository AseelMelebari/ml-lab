import { useMemo, useState } from 'react';
import { DataLine, EditablePoints, Heatmap, Plot2D, Probe, usePlot, type EditMode } from '@/components/charts/Plot2D';
import { blendClasses, classVar, usePalette } from '@/components/charts/colors';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { Callout, Segmented, Slider, Stat, Toggle } from '@/components/ui/primitives';
import { TeX } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { CLASS_DOMAIN, makeClassification, type ClassificationDatasetId } from '@/lib/ml/datasets';
import { knnClassify, makeTransform, type DistanceMetric } from '@/lib/ml/knn';
import type { ClassPoint } from '@/lib/ml/types';
import { ClassLegend, ClassPicker, DatasetPanel, Hint, LabShell, ModePicker, Panel, PointsTable, StatGrid, type LabProps } from './shared/LabUI';
import { labEvent, usePointSet } from './shared/hooks';

const LIMIT = 150;

export default function KnnLab({ presentation, preset }: LabProps) {
  const { t, num } = useI18n();
  const { classRGB, plotRGB, regionAlpha } = usePalette();
  const [dataset, setDataset] = useState<ClassificationDatasetId>(preset === 'scaling' ? 'separable' : 'threeBlobs');
  const [seed, setSeed] = useState(3);
  const [n, setN] = useState(60);
  const ps = usePointSet<ClassPoint>(() => makeClassification(preset === 'scaling' ? 'separable' : 'threeBlobs', 60, 3), LIMIT);
  const [mode, setMode] = useState<EditMode>('query');
  const [addClass, setAddClass] = useState(0);
  const [k, setK] = useState(preset === 'k1' ? 1 : 5);
  const [metric, setMetric] = useState<DistanceMetric>('euclidean');
  const [xScale, setXScale] = useState(1);
  const [standardize, setStandardize] = useState(false);
  const [query, setQuery] = useState<[number, number]>([0.4, 0.2]);
  const [showRegions, setShowRegions] = useState(true);
  const points = ps.points;
  const nClasses = Math.max(2, ...points.map((p) => p.label + 1));
  const names = Array.from({ length: nClasses }, (_, c) => `${t(C.class)} ${c}`);

  const tf = useMemo(() => makeTransform(points, { xScale, standardize }), [points, xScale, standardize]);
  const train = useMemo(() => points.map((p) => tf(p.x, p.y)), [points, tf]);
  const labels = useMemo(() => points.map((p) => p.label), [points]);
  const result = points.length > 0 ? knnClassify(train, labels, nClasses, tf(query[0], query[1]), k, metric) : null;

  const looCurve = useMemo(() => {
    if (points.length < 3) return [];
    const out: number[] = [];
    for (let kk = 1; kk <= Math.min(25, points.length - 1); kk++) {
      let ok = 0;
      for (let i = 0; i < points.length; i++) {
        const tr = train.filter((_, j) => j !== i);
        const lb = labels.filter((_, j) => j !== i);
        if (knnClassify(tr, lb, nClasses, train[i], kk, metric).label === labels[i]) ok++;
      }
      out.push(ok / points.length);
    }
    return out;
  }, [train, labels, nClasses, metric, points.length]);

  const version = `${points.map((p) => `${p.x},${p.y},${p.label}`).join(';')}|${k}|${metric}|${xScale}|${standardize}|${classRGB[0][0]}`;
  const regenerate = (d = dataset, s = seed, count = n) => ps.setPoints(makeClassification(d, count, s));
  const plainSpace = xScale === 1 && !standardize;
  const kth = result?.neighbors[result.neighbors.length - 1]?.distance ?? 0;

  return (
    <LabShell
      presentation={presentation}
      viz={
        <>
          <Plot2D
            domain={CLASS_DOMAIN}
            xLabel={xScale === 1 ? 'x₁' : `x₁ (${t(['measured ×', 'مقيسة ×'])}${xScale})`}
            yLabel="x₂"
            ariaLabel={t(['KNN decision regions with the query point and its nearest neighbours', 'مناطق قرار KNN مع نقطة الاستعلام وأقرب جيرانها'])}
            onBackgroundPointer={
              mode === 'add'
                ? (x, y) => ps.add({ x, y, label: addClass })
                : mode === 'query'
                  ? (x, y) => {
                      setQuery([x, y]);
                      labEvent('knn', 'queried');
                    }
                  : undefined
            }
          >
            {showRegions && points.length > 0 && (
              <Heatmap
                version={version}
                res={80}
                fn={(x, y) => {
                  const r = knnClassify(train, labels, nClasses, tf(x, y), k, metric);
                  const w = r.votes.map((v) => v / r.neighbors.length);
                  return blendClasses(w, classRGB, plotRGB, regionAlpha);
                }}
              />
            )}
            {plainSpace && metric === 'euclidean' && result && <NeighborhoodCircle cx={query[0]} cy={query[1]} r={kth} />}
            {result?.neighbors.map((nb) => (
              <DataLine key={nb.index} x1={query[0]} y1={query[1]} x2={points[nb.index].x} y2={points[nb.index].y} stroke="var(--c-text)" strokeWidth={1.3} opacity={0.7} />
            ))}
            <EditablePoints points={points} mode={mode} onMove={ps.move} onRemove={ps.remove} colorOf={(p) => classVar(p.label)} ringIds={new Set(result?.neighbors.map((nb) => points[nb.index].id))} />
            <Probe x={query[0]} y={query[1]} color={result ? classVar(result.label) : 'var(--c-text)'} label={result ? `→ ${t(C.class)} ${result.label}` : undefined} />
          </Plot2D>
          <ClassLegend names={names} extra={<span>◯ {t(['nearest neighbours', 'أقرب الجيران'])}</span>} />
          <Hint>{t(['Query mode: click anywhere to classify a new point. Add mode: click to add training points of the chosen class.', 'وضع الاستعلام: انقر في أي مكان لتصنيف نقطة جديدة. وضع الإضافة: انقر لإضافة نقاط تدريب من الفئة المختارة.'])}</Hint>
        </>
      }
      status={
        <>
          <StatGrid>
            <Stat label="K" value={k} />
            <Stat label={t(C.prediction)} value={result ? `${t(C.class)} ${result.label}` : '—'} tone="accent" />
            <Stat label={t(['Votes', 'الأصوات'])} value={result ? result.votes.join(' : ') : '—'} />
            <Stat label={t(['LOO accuracy', 'دقة الترك-واحد'])} value={looCurve[k - 1] !== undefined ? num(looCurve[k - 1], 3) : '—'} />
          </StatGrid>
          {!plainSpace && (
            <Callout tone="info" title={t(['Feature scaling in action', 'تأثير تحجيم الخصائص'])}>
              {standardize
                ? t(['Standardization rescales each feature to mean 0 and standard deviation 1, so both features contribute fairly to the distance — the result no longer depends on the units of x₁.', 'التوحيد القياسي يعيد تحجيم كل خاصية إلى متوسط 0 وانحراف معياري 1، فتساهم الخاصيتان بعدالة في المسافة — ولا تعود النتيجة معتمدة على وحدة قياس x₁.'])
                : t(['x₁ is now measured in larger units (multiplied by the factor). Its differences dominate the distance, so neighbours are chosen almost only by x₁ — watch the boundaries become vertical stripes. Turn on standardization to fix it.', 'أصبحت x₁ مقيسة بوحدات أكبر (مضروبة في المعامل). فروقها تهيمن على المسافة، فيُختار الجيران تقريبًا وفق x₁ فقط — لاحظ كيف تصبح الحدود أشرطة عمودية. فعّل التوحيد القياسي لإصلاح ذلك.'])}
            </Callout>
          )}
        </>
      }
      below={
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={t(['Distance calculations for the K nearest', 'حسابات المسافة لأقرب K نقاط'])}>
            <p className="text-xs text-muted">
              {metric === 'euclidean' && <TeX tex="d(\mathbf{a},\mathbf{q}) = \sqrt{\textstyle\sum_j (a_j - q_j)^2}" />}
              {metric === 'manhattan' && <TeX tex="d(\mathbf{a},\mathbf{q}) = \textstyle\sum_j |a_j - q_j|" />}
              {metric === 'chebyshev' && <TeX tex="d(\mathbf{a},\mathbf{q}) = \max_j |a_j - q_j|" />}
              {!plainSpace && <span> · {t(['computed in the transformed feature space', 'محسوبة في فضاء الخصائص المحوَّل'])}</span>}
            </p>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-xs">
                <thead className="text-muted">
                  <tr>
                    <th className="py-1 text-start">#</th>
                    <th className="text-start">{t(['point (x₁, x₂)', 'النقطة (x₁, x₂)'])}</th>
                    <th className="text-start">{t(C.class)}</th>
                    <th className="text-end">{t(['distance', 'المسافة'])}</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {result?.neighbors.map((nb, i) => (
                    <tr key={nb.index} className="border-t border-line/60">
                      <td className="py-1">{i + 1}</td>
                      <td className="ltr">({num(points[nb.index].x, 2)}, {num(points[nb.index].y, 2)})</td>
                      <td>
                        <span className="inline-block h-2 w-2 rounded-full me-1" style={{ background: classVar(points[nb.index].label) }} />
                        {points[nb.index].label}
                      </td>
                      <td className="text-end">{num(nb.distance, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title={t(['Neighbour votes', 'أصوات الجيران'])}>
            {result && <BarChart ariaLabel={t(['Votes per class', 'الأصوات لكل فئة'])} bars={result.votes.map((v, c) => ({ label: `${t(C.class)} ${c}`, value: v, color: classVar(c), highlight: c === result.label }))} format={(v) => v.toFixed(0)} />}
            <p className="text-xs text-muted">{t(['Ties are broken in favour of the class whose member is closest to the query.', 'تُحسم حالات التعادل لصالح الفئة التي يكون أحد أفرادها الأقرب إلى نقطة الاستعلام.'])}</p>
          </Panel>
          <Panel title={t(['Effect of K: leave-one-out accuracy', 'أثر K: دقة الترك-واحد'])} className="md:col-span-2">
            <LineChart ariaLabel={t(['Accuracy for each K', 'الدقة لكل قيمة K'])} series={[{ id: 'loo', label: 'LOO', values: looCurve, color: 'var(--c-accent)' }]} xStart={1} xLabel="K" yMin={0} yMax={1} format={(v) => v.toFixed(2)} />
            <p className="text-xs text-muted">{t(['Each point is classified by all the others (leave-one-out). Very small K follows noise; very large K over-smooths toward the majority class.', 'تُصنَّف كل نقطة بواسطة جميع النقاط الأخرى (الترك-واحد). K الصغير جدًا يتبع الضوضاء، وK الكبير جدًا يبالغ في التنعيم نحو فئة الأغلبية.'])}</p>
          </Panel>
          <div className="md:col-span-2">
            <PointsTable points={points} onUpdate={ps.update} onRemove={ps.remove} labelName={t(C.class)} classNames={['0', '1', '2']} />
          </div>
        </div>
      }
      controls={
        <>
          <Panel title={t(C.parameters)}>
            <Slider label={t(['K (number of neighbours)', 'K (عدد الجيران)'])} value={k} min={1} max={Math.max(1, Math.min(31, points.length))} onChange={(v) => { setK(v); labEvent('knn', 'changed-k'); }} />
            <Segmented
              label={t(['Distance metric', 'مقياس المسافة'])}
              value={metric}
              onChange={setMetric}
              size="sm"
              options={[
                { value: 'euclidean', label: t(['Euclidean', 'إقليدية']) },
                { value: 'manhattan', label: t(['Manhattan', 'مانهاتن']) },
                { value: 'chebyshev', label: t(['Chebyshev', 'تشيبيشيف']) },
              ]}
            />
            <Toggle label={t(['Show decision regions', 'إظهار مناطق القرار'])} checked={showRegions} onChange={setShowRegions} />
          </Panel>
          <Panel title={t(['Feature scaling experiment', 'تجربة تحجيم الخصائص'])}>
            <Slider label={t(['Unit factor for x₁', 'معامل وحدة x₁'])} value={xScale} min={1} max={20} onChange={(v) => { setXScale(v); labEvent('knn', 'scaling'); }} format={(v) => `×${v}`} hint={t(['Simulates measuring x₁ in different units (e.g. metres → centimetres).', 'يحاكي قياس x₁ بوحدات مختلفة (مثل الأمتار ← السنتيمترات).'])} />
            <Toggle label={t(['Standardize features (z-score)', 'توحيد الخصائص قياسيًا (z-score)'])} checked={standardize} onChange={setStandardize} />
          </Panel>
          <DatasetPanel
            dataset={dataset}
            options={[
              { value: 'threeBlobs', label: t(['Three classes', 'ثلاث فئات']) },
              { value: 'separable', label: t(['Two separated classes', 'فئتان منفصلتان']) },
              { value: 'overlap', label: t(['Overlapping classes', 'فئات متداخلة']) },
              { value: 'moons', label: t(['Moons', 'أهلّة']) },
              { value: 'xor', label: t(['XOR pattern', 'نمط XOR']) },
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
            nMax={140}
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

function NeighborhoodCircle({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const { sx, sy } = usePlot();
  const rx = Math.abs(sx(cx + r) - sx(cx));
  const ry = Math.abs(sy(cy + r) - sy(cy));
  return <ellipse cx={sx(cx)} cy={sy(cy)} rx={rx} ry={ry} fill="none" stroke="var(--c-text)" strokeDasharray="4 4" strokeWidth={1.2} opacity={0.6} pointerEvents="none" />;
}
