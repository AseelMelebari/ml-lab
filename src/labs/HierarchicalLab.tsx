import { useEffect, useMemo, useRef, useState } from 'react';
import { DataLine, EditablePoints, Plot2D, usePlot, type EditMode } from '@/components/charts/Plot2D';
import { Callout, Segmented, Slider, Stat } from '@/components/ui/primitives';
import { TeX } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import { CLASS_DOMAIN, makeClusters, type ClusterDatasetId } from '@/lib/ml/datasets';
import { agglomerative, cutToK, dendrogramLayout, euclidean, labelsAfterSteps, type Linkage, type Merge } from '@/lib/ml/hierarchical';
import type { ClassPoint } from '@/lib/ml/types';
import { DatasetPanel, Hint, LabShell, ModePicker, Panel, PlayControls, StatGrid, type LabProps } from './shared/LabUI';
import { labEvent, useLoop, usePointSet, usePresenterKeys } from './shared/hooks';

const LIMIT = 50;
const PALETTE = ['var(--c-class-0)', 'var(--c-class-1)', 'var(--c-class-2)', 'var(--c-class-3)', '#22d3ee', '#a3e635', '#f87171', '#facc15', '#60a5fa', '#c084fc'];
const colorOf = (c: number) => PALETTE[c % PALETTE.length];
const LINKAGES: Linkage[] = ['single', 'complete', 'average', 'ward'];

const membersOf = (id: number, n: number, merges: readonly Merge[]) => (id < n ? [id] : merges[id - n].members);

export default function HierarchicalLab({ presentation }: LabProps) {
  const { t, num } = useI18n();
  const [dataset, setDataset] = useState<ClusterDatasetId>('blobs3');
  const [seed, setSeed] = useState(6);
  const [n, setN] = useState(24);
  const ps = usePointSet<ClassPoint>(() => makeClusters('blobs3', 24, 6), LIMIT);
  const [mode, setMode] = useState<EditMode>('move');
  const [linkage, setLinkage] = useState<Linkage>('average');
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const points = ps.points;
  const N = points.length;
  const P = useMemo(() => points.map((p) => [p.x, p.y]), [points]);
  const merges = useMemo(() => agglomerative(P, linkage), [P, linkage]);
  useEffect(() => setSteps((s) => Math.min(s, Math.max(0, N - 1))), [N]);
  const labels = useMemo(() => labelsAfterSteps(N, merges, steps), [N, merges, steps]);
  const nClusters = N - steps;
  const last = steps > 0 ? merges[steps - 1] : null;
  const next = steps < merges.length ? merges[steps] : null;
  const cutHeight = last && next ? (last.distance + next.distance) / 2 : last ? last.distance * 1.05 : next ? next.distance / 2 : 0;
  const stepFwd = () => {
    if (steps >= merges.length) return setRunning(false);
    setSteps((s) => s + 1);
    labEvent('hierarchical', 'merged');
    if (steps + 1 >= merges.length) labEvent('hierarchical', 'complete');
  };
  useLoop(running, stepFwd, presentation ? 800 : 500);
  usePresenterKeys(!!presentation, { toggle: () => setRunning((r) => !r), step: stepFwd, reset: () => setSteps(0) });
  const regenerate = (d = dataset, s = seed, count = n) => {
    ps.setPoints(makeClusters(d, count, s));
    setSteps(0);
    setRunning(false);
  };

  // Line illustrating the distance used by the most recent merge.
  const distLine = useMemo(() => {
    if (!last) return null;
    const A = membersOf(last.a, N, merges);
    const B = membersOf(last.b, N, merges);
    if (linkage === 'single' || linkage === 'complete') {
      let best: [number, number] = [A[0], B[0]];
      let bd = linkage === 'single' ? Infinity : -Infinity;
      for (const i of A)
        for (const j of B) {
          const d = euclidean(P[i], P[j]);
          if (linkage === 'single' ? d < bd : d > bd) {
            bd = d;
            best = [i, j];
          }
        }
      return { a: P[best[0]], b: P[best[1]] };
    }
    const mean = (ix: number[]) => [ix.reduce((s, i) => s + P[i][0], 0) / ix.length, ix.reduce((s, i) => s + P[i][1], 0) / ix.length];
    return { a: mean(A), b: mean(B) };
  }, [last, N, merges, P, linkage]);

  const linkName: Record<Linkage, string> = {
    single: t(['Single', 'أحادي']),
    complete: t(['Complete', 'كامل']),
    average: t(['Average', 'متوسط']),
    ward: 'Ward',
  };

  return (
    <LabShell
      presentation={presentation}
      viz={
        <div className="grid gap-3 xl:grid-cols-2">
          <div>
            <Plot2D domain={CLASS_DOMAIN} xLabel="x₁" yLabel="x₂" ariaLabel={t(['Points coloured by their current cluster', 'النقاط ملوّنة حسب عنقودها الحالي'])} onBackgroundPointer={mode === 'add' ? (x, y) => ps.add({ x, y, label: 0 }) : undefined}>
              {distLine && <DataLine x1={distLine.a[0]} y1={distLine.a[1]} x2={distLine.b[0]} y2={distLine.b[1]} stroke="var(--c-warn)" strokeWidth={3} strokeDasharray="6 4" />}
              <EditablePoints points={points} mode={mode} onMove={ps.move} onRemove={ps.remove} colorOf={(p) => colorOf(labels[points.indexOf(p)])} shapeOf={(p) => labels[points.indexOf(p)] % 4} radius={6.5} ringIds={new Set(last ? last.members.map((i) => points[i]?.id) : [])} />
              <PointNumbers points={points} />
            </Plot2D>
            <Hint>{t(['Rings mark the cluster formed by the latest merge; the dashed line shows the distance the linkage rule measured.', 'الحلقات تميّز العنقود الناتج عن آخر دمج، والخط المتقطع يبيّن المسافة التي قاسها معيار الربط.'])}</Hint>
          </div>
          <div>
            <Dendrogram n={N} merges={merges} steps={steps} cut={cutHeight} labels={labels} onCut={(h) => { setSteps(merges.filter((m) => m.distance <= h).length); labEvent('hierarchical', 'cut'); }} />
            <Hint>{t(['Drag the horizontal cut line (or use the slider). Every vertical line it crosses becomes one cluster.', 'اسحب خط القطع الأفقي (أو استخدم المنزلق). كل خط رأسي يقطعه يصبح عنقودًا واحدًا.'])}</Hint>
          </div>
        </div>
      }
      status={
        <>
          <StatGrid>
            <Stat label={t(['Merges done', 'عمليات الدمج المنفّذة'])} value={`${steps} / ${merges.length}`} />
            <Stat label={t(['Clusters', 'العناقيد'])} value={nClusters} tone="accent" />
            <Stat label={t(['Last merge height', 'ارتفاع آخر دمج'])} value={last ? num(last.distance, 3) : '—'} />
            <Stat label={t(['Next merge height', 'ارتفاع الدمج التالي'])} value={next ? num(next.distance, 3) : '—'} />
          </StatGrid>
          {next && last && next.distance > 1.6 * last.distance && nClusters > 1 && (
            <Callout tone="tip" title={t(['A natural place to cut', 'موضع طبيعي للقطع'])}>
              {t(['The next merge happens at a much larger distance than the previous one — a big vertical gap in the dendrogram. Cutting here gives', 'الدمج التالي يحدث عند مسافة أكبر بكثير من السابق — فجوة رأسية كبيرة في المخطط الشجري. القطع هنا يعطي'])} <b>{nClusters}</b> {t(['well-separated clusters.', 'عناقيد منفصلة جيدًا.'])}
            </Callout>
          )}
        </>
      }
      below={
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={t(['Compare linkage strategies at the same number of clusters', 'قارن معايير الربط عند عدد العناقيد نفسه'])} className="md:col-span-2">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {LINKAGES.map((lk) => {
                const m = lk === linkage ? merges : agglomerative(P, lk);
                const lb = cutToK(N, m, Math.max(1, nClusters));
                return (
                  <div key={lk} className={`rounded-xl border p-1 ${lk === linkage ? 'border-accent' : 'border-line'}`}>
                    <div className="px-1 text-xs font-semibold text-ink">{linkName[lk]}</div>
                    <Plot2D domain={CLASS_DOMAIN} compact width={300} height={240} ariaLabel={`${linkName[lk]} linkage`}>
                      <EditablePoints points={points} mode="none" colorOf={(p) => colorOf(lb[points.indexOf(p)])} shapeOf={(p) => lb[points.indexOf(p)] % 4} radius={5} />
                    </Plot2D>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted">{t(['Single linkage chains along nearby points (good for elongated shapes, sensitive to noise); complete and Ward prefer compact, balanced groups.', 'الربط الأحادي يتسلسل عبر النقاط المتجاورة (مناسب للأشكال المستطيلة وحساس للضوضاء)، بينما يفضّل الربط الكامل وWard مجموعات مدمجة ومتوازنة.'])}</p>
          </Panel>
          <Panel title={t(['Merge history (real execution order)', 'سجل الدمج (ترتيب التنفيذ الفعلي)'])}>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-xs font-mono">
                <thead className="font-sans text-muted">
                  <tr>
                    <th className="py-1 text-start">#</th>
                    <th>{t(['merged', 'المدمَجة'])}</th>
                    <th>{t(['distance', 'المسافة'])}</th>
                    <th>{t(['size', 'الحجم'])}</th>
                  </tr>
                </thead>
                <tbody>
                  {merges.map((m, i) => (
                    <tr key={i} className={`border-t border-line/60 text-center ${i < steps ? 'text-ink' : 'text-subtle'} ${i === steps - 1 ? 'bg-warn/10' : ''}`}>
                      <td className="py-0.5 text-start">{i + 1}</td>
                      <td className="ltr">{m.a < N ? `p${m.a + 1}` : `C${m.a - N + 1}`} + {m.b < N ? `p${m.b + 1}` : `C${m.b - N + 1}`} → C{i + 1}</td>
                      <td>{num(m.distance, 3)}</td>
                      <td>{m.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title={t(['How the linkage measures cluster distance', 'كيف يقيس معيار الربط المسافة بين العناقيد'])}>
            {linkage === 'single' && <TeX display tex="d(A,B) = \min_{a\in A,\, b\in B} \lVert a-b \rVert" />}
            {linkage === 'complete' && <TeX display tex="d(A,B) = \max_{a\in A,\, b\in B} \lVert a-b \rVert" />}
            {linkage === 'average' && <TeX display tex="d(A,B) = \frac{1}{|A||B|}\sum_{a\in A}\sum_{b\in B} \lVert a-b \rVert" />}
            {linkage === 'ward' && <TeX display tex="d(A,B) = \sqrt{\tfrac{2|A||B|}{|A|+|B|}}\;\lVert \bar a - \bar b \rVert" />}
            <p className="text-sm text-muted">
              {linkage === 'ward'
                ? t(['Ward merges the pair that increases the total within-cluster variance the least (SciPy convention for the height).', 'يدمج Ward الزوج الذي يزيد مجموع التباين داخل العناقيد بأقل قدر (باصطلاح SciPy للارتفاع).'])
                : t(['Distances between clusters are updated after every merge with the Lance–Williams formula, exactly as library implementations do.', 'تُحدَّث المسافات بين العناقيد بعد كل دمج باستخدام صيغة لانس–ويليامز، تمامًا كما تفعل المكتبات البرمجية.'])}
            </p>
          </Panel>
        </div>
      }
      controls={
        <>
          <Panel title={t(['Agglomerative clustering', 'التجميع التكتلي'])}>
            <PlayControls running={running} onToggle={() => setRunning((r) => !r)} onStep={stepFwd} onReset={() => { setSteps(0); setRunning(false); }} disabled={N < 2} stepLabel={t(['Merge', 'ادمج'])} />
            <Segmented label={t(['Linkage', 'معيار الربط'])} value={linkage} onChange={(l) => { setLinkage(l); labEvent('hierarchical', `linkage-${l}`); }} size="sm" options={LINKAGES.map((l) => ({ value: l, label: linkName[l] }))} />
            <Slider label={t(['Number of clusters (cut)', 'عدد العناقيد (القطع)'])} value={Math.max(1, nClusters)} min={1} max={Math.max(1, N)} onChange={(k) => setSteps(Math.max(0, N - k))} />
          </Panel>
          <DatasetPanel
            dataset={dataset}
            options={[
              { value: 'blobs3', label: t(['Three blobs', 'ثلاث كتل']) },
              { value: 'blobs4', label: t(['Four blobs', 'أربع كتل']) },
              { value: 'elongated', label: t(['Elongated groups', 'مجموعات مستطيلة']) },
              { value: 'uneven', label: t(['Uneven sizes', 'أحجام متفاوتة']) },
              { value: 'uniform', label: t(['No structure', 'بلا بنية']) },
            ]}
            onDataset={(d) => {
              setDataset(d);
              regenerate(d);
            }}
            n={n}
            nMin={4}
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
            count={N}
            limit={LIMIT}
          >
            <ModePicker mode={mode} onMode={setMode} />
            <p className="text-[11px] text-subtle">{t(['Hierarchical clustering is O(n³) here, so the lab is limited to 50 points.', 'التجميع الهرمي هنا من رتبة O(n³)، لذا يقتصر المختبر على 50 نقطة.'])}</p>
          </DatasetPanel>
        </>
      }
    />
  );
}

function PointNumbers({ points }: { points: ClassPoint[] }) {
  const { sx, sy } = usePlot();
  return (
    <g pointerEvents="none">
      {points.map((p, i) => (
        <text key={p.id} x={sx(p.x) + 8} y={sy(p.y) - 7} fontSize={10} fill="var(--c-muted)">
          {i + 1}
        </text>
      ))}
    </g>
  );
}

function Dendrogram({ n, merges, steps, cut, labels, onCut }: { n: number; merges: Merge[]; steps: number; cut: number; labels: number[]; onCut: (h: number) => void }) {
  const { t } = useI18n();
  const W = 560;
  const H = 420;
  const m = { top: 16, right: 14, bottom: 34, left: 50 };
  const pw = W - m.left - m.right;
  const ph = H - m.top - m.bottom;
  const { order, pos } = useMemo(() => dendrogramLayout(n, merges), [n, merges]);
  const maxH = Math.max(1e-6, ...merges.map((x) => x.distance)) * 1.08;
  const sx = (x: number) => m.left + ((x + 0.5) / Math.max(1, n)) * pw;
  const sy = (h: number) => m.top + (1 - h / maxH) * ph;
  const ref = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState(false);
  const toH = (clientY: number) => {
    const el = ref.current;
    const ctm = el?.getScreenCTM?.();
    if (!el || !ctm) return null;
    const pt = el.createSVGPoint();
    pt.x = 0;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return Math.max(0, Math.min(maxH, (1 - (p.y - m.top) / ph) * maxH));
  };
  useEffect(() => {
    if (!drag) return;
    const mv = (e: PointerEvent) => {
      const h = toH(e.clientY);
      if (h !== null) onCut(h);
    };
    const up = () => setDrag(false);
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
    };
  });
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxH);
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="plot-svg block w-full h-auto" role="img" aria-label={t(['Dendrogram of the merge sequence', 'المخطط الشجري لتسلسل الدمج'])} style={{ direction: 'ltr' }}>
      <rect x={m.left} y={m.top} width={pw} height={ph} fill="var(--c-plot)" rx={6} />
      {ticks.map((h) => (
        <g key={h}>
          <line x1={m.left} x2={m.left + pw} y1={sy(h)} y2={sy(h)} stroke="var(--c-grid)" />
          <text x={m.left - 6} y={sy(h) + 4} textAnchor="end" fontSize={11} fill="var(--c-subtle)">
            {h.toFixed(1)}
          </text>
        </g>
      ))}
      <text transform={`translate(13 ${m.top + ph / 2}) rotate(-90)`} textAnchor="middle" fontSize={12} fill="var(--c-muted)">
        {t(['merge distance', 'مسافة الدمج'])}
      </text>
      {merges.map((mg, i) => {
        const a = pos.get(mg.a)!;
        const b = pos.get(mg.b)!;
        const done = i < steps;
        const col = done ? colorOf(labels[mg.members[0]]) : 'var(--c-subtle)';
        return (
          <path
            key={i}
            d={`M${sx(a.x)},${sy(a.height)}V${sy(mg.distance)}H${sx(b.x)}V${sy(b.height)}`}
            fill="none"
            stroke={col}
            strokeWidth={done ? 2.4 : 1.2}
            opacity={done ? 1 : 0.5}
          />
        );
      })}
      {order.map((leaf) => (
        <text key={leaf} x={sx(pos.get(leaf)!.x)} y={m.top + ph + 14} textAnchor="middle" fontSize={n > 30 ? 7.5 : 9.5} fill={colorOf(labels[leaf])}>
          {leaf + 1}
        </text>
      ))}
      {merges.length > 0 && (
        <g style={{ cursor: 'ns-resize' }} onPointerDown={(e) => { e.preventDefault(); setDrag(true); }}>
          <rect x={m.left} y={sy(cut) - 9} width={pw} height={18} fill="transparent" />
          <line x1={m.left} x2={m.left + pw} y1={sy(cut)} y2={sy(cut)} stroke="var(--c-warn)" strokeWidth={2.5} strokeDasharray="8 5" />
          <rect x={m.left + pw - 64} y={sy(cut) - 22} width={60} height={18} rx={5} fill="var(--c-warn)" />
          <text x={m.left + pw - 34} y={sy(cut) - 9} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1a1204">
            cut ⇕
          </text>
        </g>
      )}
      <text x={m.left + pw / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="var(--c-muted)">
        {t(['point number (leaf order)', 'رقم النقطة (ترتيب الأوراق)'])}
      </text>
    </svg>
  );
}

