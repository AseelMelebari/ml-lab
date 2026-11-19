import { useMemo, useRef, useState } from 'react';
import { niceTicks } from './Plot2D';

export interface Series {
  id: string;
  label: string;
  values: readonly number[];
  color: string;
  dashed?: boolean;
  width?: number;
}

/**
 * Multi-series line chart with a crosshair tooltip. x is the sample index + xStart.
 * A legend is shown whenever there are 2+ series; one series is named by the title.
 */
export function LineChart({
  series,
  height = 230,
  width = 480,
  xLabel,
  yLabel,
  yMin,
  yMax,
  xStart = 0,
  format = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 1 ? v.toFixed(2) : v.toPrecision(3)),
  ariaLabel,
  refLines,
  emptyText,
}: {
  series: Series[];
  height?: number;
  width?: number;
  xLabel?: string;
  yLabel?: string;
  yMin?: number;
  yMax?: number;
  xStart?: number;
  format?: (v: number) => string;
  ariaLabel: string;
  refLines?: { y: number; label: string; color?: string }[];
  emptyText?: string;
}) {
  const m = { top: 12, right: 14, bottom: 34, left: 52 };
  const pw = width - m.left - m.right;
  const ph = height - m.top - m.bottom;
  const n = Math.max(0, ...series.map((s) => s.values.length));
  const finite = series.flatMap((s) => s.values.filter(Number.isFinite));
  const refs = refLines?.map((r) => r.y) ?? [];
  let lo = yMin ?? Math.min(...finite, ...refs);
  let hi = yMax ?? Math.max(...finite, ...refs);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 0;
    hi = 1;
  }
  if (hi - lo < 1e-9) {
    hi += 0.5;
    lo -= 0.5;
  }
  if (yMax === undefined) hi += (hi - lo) * 0.05;
  if (yMin === undefined && lo !== 0) lo -= (hi - lo) * 0.05;
  const xMax = Math.max(1, n - 1);
  const sx = (i: number) => m.left + (i / xMax) * pw;
  const sy = (v: number) => m.top + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * ph;
  const paths = useMemo(
    () =>
      series.map((s) => {
        // Downsample very long series for rendering (every value still feeds the min/max).
        const stride = Math.max(1, Math.floor(s.values.length / 600));
        let d = '';
        let pen = false;
        for (let i = 0; i < s.values.length; i += stride) {
          const v = s.values[i];
          if (!Number.isFinite(v)) {
            pen = false;
            continue;
          }
          d += `${pen ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`;
          pen = true;
        }
        return d;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, lo, hi, n, pw, ph],
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = svgRef.current;
    const ctm = el?.getScreenCTM?.();
    if (!el || !ctm || n === 0) return;
    const pt = el.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    const i = Math.round(((p.x - m.left) / pw) * xMax);
    setHover(i >= 0 && i < n ? i : null);
  };
  const yt = niceTicks(lo, hi, 4);
  const xt = niceTicks(xStart, xStart + xMax, 5).filter((v) => Number.isInteger(v));
  return (
    <figure className="w-full">
      {series.length > 1 && (
        <figcaption className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden>
          {series.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5">
              <svg width="18" height="6">
                <line x1="1" x2="17" y1="3" y2="3" stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dashed ? '4 3' : undefined} strokeLinecap="round" />
              </svg>
              {s.label}
            </span>
          ))}
        </figcaption>
      )}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="block w-full h-auto"
          role="img"
          aria-label={ariaLabel}
          style={{ direction: 'ltr' }}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <rect x={m.left} y={m.top} width={pw} height={ph} fill="var(--c-plot)" rx={6} />
          {yt.map((v) => (
            <g key={v}>
              <line x1={m.left} x2={m.left + pw} y1={sy(v)} y2={sy(v)} stroke="var(--c-grid)" />
              <text x={m.left - 6} y={sy(v) + 4} textAnchor="end" fontSize={11.5} fill="var(--c-subtle)">
                {format(v)}
              </text>
            </g>
          ))}
          {xt.map((v) => (
            <text key={v} x={sx(v - xStart)} y={m.top + ph + 15} textAnchor="middle" fontSize={11.5} fill="var(--c-subtle)">
              {v}
            </text>
          ))}
          {refLines?.map((r) => (
            <g key={r.label}>
              <line x1={m.left} x2={m.left + pw} y1={sy(r.y)} y2={sy(r.y)} stroke={r.color ?? 'var(--c-muted)'} strokeDasharray="5 4" strokeWidth={1.3} />
              <text x={m.left + pw - 4} y={sy(r.y) - 5} textAnchor="end" fontSize={11.5} fill="var(--c-muted)">
                {r.label}
              </text>
            </g>
          ))}
          {series.map((s, i) => (
            <path key={s.id} d={paths[i]} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dashed ? '5 4' : undefined} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={sx(hover)} x2={sx(hover)} y1={m.top} y2={m.top + ph} stroke="var(--c-axis)" strokeDasharray="3 3" />
              {series.map((s) =>
                Number.isFinite(s.values[hover]) ? <circle key={s.id} cx={sx(hover)} cy={sy(s.values[hover])} r={4} fill={s.color} stroke="var(--c-plot)" strokeWidth={2} /> : null,
              )}
            </g>
          )}
          <rect x={m.left} y={m.top} width={pw} height={ph} fill="none" stroke="var(--c-border)" rx={6} />
          {xLabel && (
            <text x={m.left + pw / 2} y={height - 3} textAnchor="middle" fontSize={11} fill="var(--c-muted)">
              {xLabel}
            </text>
          )}
          {yLabel && (
            <text transform={`translate(11 ${m.top + ph / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill="var(--c-muted)">
              {yLabel}
            </text>
          )}
          {n === 0 && emptyText && (
            <text x={m.left + pw / 2} y={m.top + ph / 2} textAnchor="middle" fontSize={12} fill="var(--c-subtle)">
              {emptyText}
            </text>
          )}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur ltr"
            style={{ left: `${Math.min(70, Math.max(8, (sx(hover) / width) * 100))}%` }}
          >
            <div className="font-mono text-subtle">
              {xLabel ?? 'x'} = {hover + xStart}
            </div>
            {series.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 text-ink">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="text-muted">{s.label}:</span>
                <span className="font-mono">{Number.isFinite(s.values[hover]) ? format(s.values[hover]) : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
