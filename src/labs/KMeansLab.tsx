import { useMemo, useState } from 'react';
import { DataLine, EditablePoints, Heatmap, Plot2D, usePlot, type EditMode } from '@/components/charts/Plot2D';
import { blendClasses, classVar, usePalette } from '@/components/charts/colors';
import { LineChart } from '@/components/charts/LineChart';
import { Callout, Segmented, Slider, Stat, Toggle } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { CLASS_DOMAIN, makeClusters, type ClusterDatasetId } from '@/lib/ml/datasets';
import { assignClusters, elbowCurve, inertia, initCentroids, updateCentroids, type Vec2 } from '@/lib/ml/kmeans';
import { mulberry32 } from '@/lib/ml/random';
import type { ClassPoint } from '@/lib/ml/types';
import { DatasetPanel, Hint, LabShell, ModePicker, Panel, PlayControls, StatGrid, type LabProps } from './shared/LabUI';
import { labEvent, useLoop, usePointSet, usePresenterKeys } from './shared/hooks';

const LIMIT = 300;
type Init = 'random' | 'kmeans++' | 'manual';
type Phase = 'assign' | 'update';
const CLUSTER_COLORS = 8;
const clusterColor = (c: number) => (c < 4 ? classVar(c) : ['#22d3ee', '#a3e635', '#f87171', '#94a3b8'][c - 4] ?? '#94a3b8');
const clusterRGB = (c: number, rgb: readonly (readonly number[])[]): readonly number[] => (c < 4 ? rgb[c] : [[34, 211, 238], [163, 230, 53], [248, 113, 113], [148, 163, 184]][c - 4]);

interface KState {
  centroids: Vec2[];
  labels: number[] | null;
  phase: Phase;
  iteration: number;
  inertias: number[];
  trails: Vec2[][];
  converged: boolean;
}

const TRUE_K: Partial<Record<ClusterDatasetId, number>> = { blobs3: 3, blobs4: 4, uneven: 3, elongated: 2, rings: 2 };

export default function KMeansLab({ presentation }: LabProps) {
  const { t, num } = useI18n();
  const { classRGB, plotRGB, regionAlpha } = usePalette();
  const [dataset, setDataset] = useState<ClusterDatasetId>('blobs3');
  const [seed, setSeed] = useState(4);
  const [n, setN] = useState(150);
  const ps = usePointSet<ClassPoint>(() => makeClusters('blobs3', 150, 4), LIMIT);
  const [mode, setMode] = useState<EditMode>('add');
  const [k, setK] = useState(3);
  const [init, setInit] = useState<Init>('random');
  const [initSeed, setInitSeed] = useState(3);
  const [st, setSt] = useState<KState | null>(null);
  const [running, setRunning] = useState(false);
  const [showRegions, setShowRegions] = useState(true);
  const [showLinks, setShowLinks] = useState(false);
  const [picks, setPicks] = useState<Vec2[]>([]);
  const points = ps.points;
  const P = useMemo(() => points.map((p) => [p.x, p.y] as Vec2), [points]);

  const reset = () => {
    setRunning(false);
    setSt(null);
    setPicks([]);
  };
  const initialize = (manual?: Vec2[]): KState | null => {
    if (P.length === 0) return null;
    const centroids = manual ?? initCentroids(P, k, init === 'manual' ? 'random' : init, mulberry32(initSeed));
    return { centroids, labels: null, phase: 'assign', iteration: 0, inertias: [], trails: centroids.map((c) => [c]), converged: false };
  };
  const step = () => {
    let s = st ?? initialize();
    if (!s || s.converged) {
      setRunning(false);
      return;
    }
    if (st === null) {
      setSt(s);
      return;
    }
    if (s.phase === 'assign') {
      const labels = assignClusters(P, s.centroids);
      const changed = !s.labels || s.labels.length !== labels.length || labels.some((l, i) => l !== s!.labels![i]);
      const conv = !changed && s.iteration > 0;
      s = { ...s, labels, phase: 'update', inertias: [...s.inertias, inertia(P, labels, s.centroids)], converged: conv };
      if (conv) {
        setRunning(false);
        labEvent('k-means', 'converged');
      }
    } else {
      const centroids = updateCentroids(P, s.labels!, s.centroids);
      s = { ...s, centroids, phase: 'assign', iteration: s.iteration + 1, trails: s.trails.map((tr, i) => [...tr, centroids[i]]), inertias: [...s.inertias, inertia(P, s.labels!, centroids)] };
    }
    labEvent('k-means', 'stepped');
    setSt(s);
  };
  useLoop(running, step, presentation ? 900 : 650);
  usePresenterKeys(!!presentation, { toggle: () => setRunning((r) => !r), step, reset });

  const elbow = useMemo(() => (P.length >= 2 ? elbowCurve(P, 8, 4) : []), [P]);
  const regenerate = (d = dataset, s = seed, count = n) => {
    ps.setPoints(makeClusters(d, count, s));
    reset();
  };
  const labels = st?.labels && st.labels.length === points.length ? st.labels : null;
  const curInertia = st && labels ? inertia(P, labels, st.centroids) : NaN;
  const vKey = `${st?.centroids.map((c) => c.join()).join(';')}|${classRGB[0][0]}`;
  const trueK = TRUE_K[dataset];
  const nextText = !st
    ? t(['Next: initialize centroids', 'التالي: تهيئة المراكز'])
    : st.converged
      ? t(['Converged — assignments no longer change.', 'تقارب — لم تعد التعيينات تتغير.'])
      : st.phase === 'assign'
        ? t(['Next: assignment step — each point joins its nearest centroid.', 'التالي: خطوة التعيين — تنضم كل نقطة إلى أقرب مركز.'])
        : t(['Next: update step — each centroid moves to the mean of its points.', 'التالي: خطوة التحديث — ينتقل كل مركز إلى متوسط نقاطه.']);

  return (
    <LabShell
      presentation={presentation}
      viz={
        <>
          <Plot2D
            domain={CLASS_DOMAIN}
            xLabel="x₁"
            yLabel="x₂"
            ariaLabel={t(['K-Means clustering: points, centroids and their paths', 'التجميع بخوارزمية K-Means: النقاط والمراكز ومساراتها'])}
            onBackgroundPointer={
              init === 'manual' && !st
                ? (x, y) => {
                    const next = [...picks, [x, y] as Vec2];
                    if (next.length >= k) {
                      setSt(initialize(next));
                      setPicks([]);
                    } else setPicks(next);
                  }
                : mode === 'add'
                  ? (x, y) => ps.add({ x, y, label: 0 })
                  : undefined
            }
          >
            {st && showRegions && (
              <Heatmap
                version={vKey}
                res={70}
                fn={(x, y) => {
                  const c = assignClusters([[x, y]], st.centroids)[0];
                  return blendClasses([1], [clusterRGB(c, classRGB)], plotRGB, regionAlpha * 0.7);
                }}
              />
            )}
            {st && labels && showLinks && points.map((p, i) => <DataLine key={p.id} x1={p.x} y1={p.y} x2={st.centroids[labels[i]][0]} y2={st.centroids[labels[i]][1]} stroke={clusterColor(labels[i])} strokeWidth={0.8} opacity={0.5} />)}
            <EditablePoints points={points} mode={mode} onMove={ps.move} onRemove={ps.remove} colorOf={(p) => (labels ? clusterColor(labels[points.indexOf(p)]) : 'var(--c-subtle)')} shapeOf={(p) => (labels ? labels[points.indexOf(p)] % 4 : 0)} radius={5} />
            {st && <Centroids st={st} />}
            {!st && picks.length > 0 && <Centroids st={{ centroids: picks, labels: null, phase: 'assign', iteration: 0, inertias: [], trails: [], converged: false }} />}
          </Plot2D>
          {init === 'manual' && !st && (
            <p className="mx-2 mt-2 rounded-lg border border-cyan/30 bg-cyan/5 px-3 py-2 text-sm text-ink">
              {t(['Click on the plot to place centroid', 'انقر على الرسم لوضع المركز'])} <span className="ltr font-mono">{picks.length + 1} / {k}</span>
            </p>
          )}
          <Hint>{nextText}</Hint>
        </>
      }
      status={
        <>
          <StatGrid>
            <Stat label="K" value={k} />
            <Stat label={t(C.iteration)} value={st?.iteration ?? 0} />
            <Stat label={t(['Inertia (WCSS)', 'القصور الذاتي (WCSS)'])} value={Number.isFinite(curInertia) ? num(curInertia, 2) : '—'} tone="accent" />
            <Stat label={t(C.status)} value={st?.converged ? t(C.converged) : st ? t(st.phase === 'assign' ? ['assign next', 'التعيين تاليًا'] : ['update next', 'التحديث تاليًا']) : t(['not started', 'لم يبدأ'])} />
          </StatGrid>
          {trueK && k !== trueK && st?.converged && (
            <Callout tone="warn" title={t(['Is K right?', 'هل K صحيح؟'])}>
              {k < trueK
                ? t(['K is smaller than the number of natural groups, so K-Means is forced to merge separate groups.', 'K أصغر من عدد المجموعات الطبيعية، لذا تُجبر K-Means على دمج مجموعات منفصلة.'])
                : t(['K is larger than the number of natural groups, so K-Means splits real groups apart. Inertia still decreases — it always does as K grows — which is why the elbow method looks for diminishing returns.', 'K أكبر من عدد المجموعات الطبيعية، لذا تقسم K-Means مجموعات حقيقية. ومع ذلك ينخفض القصور الذاتي — فهو ينخفض دائمًا مع زيادة K — ولهذا تبحث طريقة المرفق عن نقطة تناقص العائد.'])}
            </Callout>
          )}
          {(dataset === 'rings' || dataset === 'elongated') && st?.converged && (
            <Callout tone="info" title={t(['A limitation of K-Means', 'أحد قيود K-Means'])}>
              {t(['K-Means assumes compact, roughly round clusters of similar size. Rings and long thin groups are split along straight Voronoi borders instead of following their shape.', 'تفترض K-Means عناقيد مدمجة مستديرة تقريبًا ومتقاربة الحجم. لذلك تُقسَّم الحلقات والمجموعات الطويلة الرفيعة بحدود ڤورونوي مستقيمة بدل أن تتبع شكلها.'])}
            </Callout>
          )}
        </>
      }
      below={
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={t(['Inertia over steps', 'القصور الذاتي عبر الخطوات'])}>
            <LineChart ariaLabel={t(['Inertia after each half-step', 'القصور الذاتي بعد كل نصف خطوة'])} series={[{ id: 'in', label: 'inertia', values: st?.inertias ?? [], color: 'var(--c-accent)' }]} xStart={1} xLabel={t(['half-step', 'نصف خطوة'])} emptyText={t(['Step through the algorithm to record inertia', 'نفّذ الخوارزمية خطوة بخطوة لتسجيل القصور الذاتي'])} />
            <p className="text-xs text-muted">{t(['Both the assignment and the update step can only lower (or keep) the inertia — that is why K-Means always converges.', 'كل من خطوتي التعيين والتحديث يمكنها فقط خفض القصور الذاتي (أو إبقاؤه) — ولهذا تتقارب K-Means دائمًا.'])}</p>
          </Panel>
          <Panel title={t(['Elbow method: best inertia for K = 1…8', 'طريقة المرفق: أفضل قصور ذاتي لـ K = 1…8'])}>
            <LineChart ariaLabel={t(['Inertia for each K', 'القصور الذاتي لكل K'])} series={[{ id: 'el', label: 'inertia', values: elbow, color: 'var(--c-purple)' }]} xStart={1} xLabel="K" yMin={0} />
            <p className="text-xs text-muted">{t(['Computed with 4 k-means++ restarts per K. Look for the “elbow” where adding clusters stops helping much.', 'محسوبة بأربع إعادات تشغيل k-means++ لكل K. ابحث عن «المرفق» حيث تتوقف إضافة العناقيد عن تقديم فائدة كبيرة.'])}</p>
          </Panel>
          {st && labels && (
            <Panel title={t(['Cluster summary', 'ملخص العناقيد'])} className="md:col-span-2">
              <div className="grid gap-2 sm:grid-cols-4">
                {st.centroids.map((c, i) => {
                  const size = labels.filter((l) => l === i).length;
                  return (
                    <div key={i} className="rounded-xl border border-line px-3 py-2 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-ink">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: clusterColor(i) }} />
                        {t(['Cluster', 'العنقود'])} {i + 1}
                      </div>
                      <div className="ltr font-mono text-muted">μ = ({num(c[0], 2)}, {num(c[1], 2)})</div>
                      <div className="text-muted">
                        {t(['size', 'الحجم'])}: <span className="font-mono">{size}</span>
                        {size === 0 && <span className="text-warn"> · {t(['empty', 'فارغ'])}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>
      }
      controls={
        <>
          <Panel title={t(['Run K-Means', 'تشغيل K-Means'])}>
            <PlayControls running={running} onToggle={() => setRunning((r) => !r)} onStep={step} onReset={reset} disabled={points.length < 1 || (init === 'manual' && !st)} stepLabel={t(['Half-step', 'نصف خطوة'])} />
            <Slider label={t(['Number of clusters K', 'عدد العناقيد K'])} value={k} min={1} max={CLUSTER_COLORS} onChange={(v) => { setK(v); reset(); }} />
            <Segmented
              label={t(['Initialization', 'التهيئة'])}
              value={init}
              onChange={(v) => { setInit(v); reset(); }}
              size="sm"
              options={[
                { value: 'random', label: t(['Random', 'عشوائية']) },
                { value: 'kmeans++', label: 'k-means++' },
                { value: 'manual', label: t(['Click', 'بالنقر']) },
              ]}
            />
            {init !== 'manual' && <Slider label={t(['Initialization seed', 'بذرة التهيئة'])} value={initSeed} min={1} max={50} onChange={(v) => { setInitSeed(v); reset(); }} hint={t(['Different starting centroids can lead to different final clusterings (local minima).', 'المراكز الابتدائية المختلفة قد تقود إلى تجميعات نهائية مختلفة (قيم دنيا محلية).'])} />}
            <Toggle label={t(['Show Voronoi regions', 'إظهار مناطق ڤورونوي'])} checked={showRegions} onChange={setShowRegions} />
            <Toggle label={t(['Show point–centroid links', 'إظهار روابط النقطة بالمركز'])} checked={showLinks} onChange={setShowLinks} />
          </Panel>
          <DatasetPanel
            dataset={dataset}
            options={[
              { value: 'blobs3', label: t(['Three blobs', 'ثلاث كتل']) },
              { value: 'blobs4', label: t(['Four blobs', 'أربع كتل']) },
              { value: 'uneven', label: t(['Uneven sizes', 'أحجام متفاوتة']) },
              { value: 'elongated', label: t(['Elongated groups', 'مجموعات مستطيلة']) },
              { value: 'rings', label: t(['Rings', 'حلقات']) },
              { value: 'uniform', label: t(['No structure (uniform)', 'بلا بنية (منتظمة)']) },
            ]}
            onDataset={(d) => {
              setDataset(d);
              regenerate(d);
              if (TRUE_K[d]) setK(TRUE_K[d]!);
            }}
            n={n}
            onN={(v) => {
              setN(v);
              regenerate(dataset, seed, v);
            }}
            nMax={LIMIT}
            seed={seed}
            onSeed={(s) => {
              setSeed(s);
              regenerate(dataset, s);
            }}
            onRegenerate={() => regenerate()}
            count={points.length}
            limit={LIMIT}
          >
            <ModePicker mode={mode} onMode={setMode} />
          </DatasetPanel>
        </>
      }
    />
  );
}

function Centroids({ st }: { st: KState }) {
  const { sx, sy } = usePlot();
  return (
    <g pointerEvents="none">
      {st.trails.map((tr, i) => (
        <polyline key={`t${i}`} points={tr.map((c) => `${sx(c[0])},${sy(c[1])}`).join(' ')} fill="none" stroke="var(--c-text)" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
      ))}
      {st.centroids.map((c, i) => (
        <g key={i} transform={`translate(${sx(c[0])} ${sy(c[1])})`} style={{ transition: 'transform 400ms ease' }}>
          <circle r={13} fill={clusterColor(i)} stroke="var(--c-text)" strokeWidth={2.5} />
          <text y={4.5} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">
            {i + 1}
          </text>
        </g>
      ))}
    </g>
  );
}
