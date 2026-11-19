import { useEffect, useMemo, useState } from 'react';
import { DataLine, EditablePoints, Heatmap, Plot2D, Probe, usePlot } from '@/components/charts/Plot2D';
import { blendClasses, classVar, usePalette } from '@/components/charts/colors';
import { CLASS_DOMAIN, makeClassification } from '@/lib/ml/datasets';
import { knnClassify } from '@/lib/ml/knn';
import { useI18n } from '@/i18n/I18nProvider';
import { usePrefersReducedMotion } from '@/labs/shared/hooks';

/** A live, real KNN classifier: move the pointer over the plot and the query point is classified instantly. */
export function HeroPreview() {
  const { t } = useI18n();
  const { classRGB, plotRGB, regionAlpha } = usePalette();
  const pts = useMemo(() => makeClassification('threeBlobs', 45, 11), []);
  const X = useMemo(() => pts.map((p) => [p.x, p.y]), [pts]);
  const y = useMemo(() => pts.map((p) => p.label), [pts]);
  const [q, setQ] = useState<[number, number]>([0.4, 0.1]);
  const [interacted, setInteracted] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (interacted || reduced) return;
    let t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const a = (now - t0) / 2600;
      setQ([2.6 * Math.cos(a), 2.2 * Math.sin(a * 1.3)]);
      raf = requestAnimationFrame(tick);
    };
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [interacted, reduced]);
  const r = knnClassify(X, y, 3, q, 5, 'euclidean');
  return (
    <div className="relative">
      <Plot2D domain={CLASS_DOMAIN} width={520} height={440} compact ariaLabel={t(['Live K-nearest-neighbours classifier preview', 'معاينة حية لمصنِّف أقرب الجيران'])}>
        <Heatmap version={`hero${classRGB[0][0]}`} res={70} fn={(a, b) => { const v = knnClassify(X, y, 3, [a, b], 5, 'euclidean'); return blendClasses(v.votes.map((c) => c / 5), classRGB, plotRGB, regionAlpha); }} />
        {r.neighbors.map((nb) => (
          <DataLine key={nb.index} x1={q[0]} y1={q[1]} x2={pts[nb.index].x} y2={pts[nb.index].y} stroke="var(--c-text)" strokeWidth={1.4} opacity={0.65} />
        ))}
        <EditablePoints points={pts} mode="none" colorOf={(p) => classVar(p.label)} ringIds={new Set(r.neighbors.map((nb) => pts[nb.index].id))} radius={5.5} />
        <Probe x={q[0]} y={q[1]} color={classVar(r.label)} label={`${t(['class', 'الفئة'])} ${r.label}`} />
        <PointerTracker onMove={(x, yy) => { setInteracted(true); setQ([x, yy]); }} />
      </Plot2D>
      <div className="pointer-events-none absolute bottom-3 start-3 rounded-lg border border-line bg-surface/90 px-2.5 py-1.5 text-xs text-muted backdrop-blur">
        {t(['Live KNN (K = 5) — move your pointer over the plot', 'KNN حي (K = 5) — حرّك المؤشر فوق الرسم'])}
      </div>
    </div>
  );
}

function PointerTracker({ onMove }: { onMove: (x: number, y: number) => void }) {
  const { toData, sx, sy, domain } = usePlot();
  return (
    <rect
      x={sx(domain.xMin)}
      y={sy(domain.yMax)}
      width={sx(domain.xMax) - sx(domain.xMin)}
      height={sy(domain.yMin) - sy(domain.yMax)}
      fill="transparent"
      onPointerMove={(e) => {
        const d = toData(e.clientX, e.clientY);
        if (d) onMove(d[0], d[1]);
      }}
      style={{ cursor: 'crosshair' }}
    />
  );
}
