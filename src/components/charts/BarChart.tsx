import { useState } from 'react';
import { niceTicks } from './Plot2D';

export interface Bar {
  label: string;
  value: number;
  color?: string;
  /** Optional reference marker drawn across the bar (e.g. a hidden true value). */
  marker?: number;
  highlight?: boolean;
}

export function BarChart({
  bars,
  height = 200,
  width = 520,
  yMax,
  yMin = 0,
  format = (v: number) => v.toFixed(2),
  ariaLabel,
  yLabel,
  markerLabel,
  showValues = true,
}: {
  bars: Bar[];
  height?: number;
  width?: number;
  yMax?: number;
  yMin?: number;
  format?: (v: number) => string;
  ariaLabel: string;
  yLabel?: string;
  markerLabel?: string;
  showValues?: boolean;
}) {
  const m = { top: 18, right: 10, bottom: 30, left: 44 };
  const pw = width - m.left - m.right;
  const ph = height - m.top - m.bottom;
  const vals = bars.flatMap((b) => [b.value, b.marker ?? b.value]).filter(Number.isFinite);
  const lo = Math.min(yMin, ...vals);
  const hi = yMax ?? Math.max(lo + 1e-9, ...vals) * 1.12;
  const sy = (v: number) => m.top + (1 - (v - lo) / (hi - lo || 1)) * ph;
  const slot = pw / Math.max(1, bars.length);
  const bw = Math.min(56, slot * 0.62);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block w-full h-auto" role="img" aria-label={ariaLabel} style={{ direction: "ltr" }}>
      {niceTicks(lo, hi, 4).map((v) => (
        <g key={v}>
          <line x1={m.left} x2={m.left + pw} y1={sy(v)} y2={sy(v)} stroke="var(--c-grid)" />
          <text x={m.left - 6} y={sy(v) + 4} fontSize={10.5} textAnchor="end" fill="var(--c-subtle)">
            {format(v)}
          </text>
        </g>
      ))}
      <line x1={m.left} x2={m.left + pw} y1={sy(Math.max(lo, 0))} y2={sy(Math.max(lo, 0))} stroke="var(--c-axis)" />
      {bars.map((b, i) => {
        const x = m.left + slot * i + (slot - bw) / 2;
        const y0 = sy(Math.max(lo, 0));
        const y1 = sy(b.value);
        const top = Math.min(y0, y1);
        const h = Math.max(1, Math.abs(y0 - y1));
        return (
          <g key={i} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <rect x={m.left + slot * i} y={m.top} width={slot} height={ph} fill="transparent" />
            <rect
              x={x}
              y={top}
              width={bw}
              height={h}
              rx={4}
              fill={b.color ?? 'var(--c-accent)'}
              opacity={hover === null || hover === i ? 1 : 0.55}
              stroke={b.highlight ? 'var(--c-text)' : 'none'}
              strokeWidth={b.highlight ? 2 : 0}
            />
            {b.marker !== undefined && (
              <line x1={x - 4} x2={x + bw + 4} y1={sy(b.marker)} y2={sy(b.marker)} stroke="var(--c-text)" strokeWidth={2} strokeDasharray="4 2" />
            )}
            {(showValues || hover === i) && (
              <text x={x + bw / 2} y={top - 5} textAnchor="middle" fontSize={11} fill="var(--c-text)" fontWeight={600}>
                {format(b.value)}
              </text>
            )}
            <text x={x + bw / 2} y={m.top + ph + 16} textAnchor="middle" fontSize={11} fill="var(--c-muted)">
              {b.label}
            </text>
          </g>
        );
      })}
      {yLabel && (
        <text transform={`translate(10 ${m.top + ph / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill="var(--c-muted)">
          {yLabel}
        </text>
      )}
      {markerLabel && bars.some((b) => b.marker !== undefined) && (
        <g>
          <line x1={m.left + pw - 120} x2={m.left + pw - 100} y1={8} y2={8} stroke="var(--c-text)" strokeWidth={2} strokeDasharray="4 2" />
          <text x={m.left + pw - 96} y={12} fontSize={10.5} fill="var(--c-muted)">
            {markerLabel}
          </text>
        </g>
      )}
    </svg>
  );
}
