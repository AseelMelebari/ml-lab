import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
  type ReactNode,
} from 'react';
import type { Domain } from '@/lib/ml/types';

export interface PlotScales {
  domain: Domain;
  W: number;
  H: number;
  m: { top: number; right: number; bottom: number; left: number };
  pw: number;
  ph: number;
  sx: (x: number) => number;
  sy: (y: number) => number;
  /** Convert client (screen) coordinates into data coordinates. */
  toData: (clientX: number, clientY: number) => [number, number] | null;
  svg: SVGSVGElement | null;
}

const PlotContext = createContext<PlotScales | null>(null);
export function usePlot(): PlotScales {
  const c = useContext(PlotContext);
  if (!c) throw new Error('usePlot must be used inside <Plot2D>');
  return c;
}

export function niceTicks(min: number, max: number, count = 6): number[] {
  const span = max - min;
  if (!(span > 0)) return [min];
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Math.abs(v) < 1e-12 ? 0 : +v.toFixed(10));
  return ticks;
}

interface Plot2DProps {
  domain: Domain;
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  ariaLabel: string;
  /** Called on pointer-down over empty plot area (data coordinates). */
  onBackgroundPointer?: (x: number, y: number) => void;
  cursor?: string;
  children?: ReactNode;
  className?: string;
  /** Hide axis tick labels (e.g. for tiny multiples). */
  compact?: boolean;
}

export function Plot2D({
  domain,
  width = 560,
  height = 420,
  xLabel,
  yLabel,
  ariaLabel,
  onBackgroundPointer,
  cursor,
  children,
  className,
  compact,
}: Plot2DProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [svg, setSvg] = useState<SVGSVGElement | null>(null);
  useEffect(() => setSvg(ref.current), []);
  const m = compact ? { top: 8, right: 8, bottom: 8, left: 8 } : { top: 14, right: 16, bottom: 44, left: 50 };
  const W = width;
  const H = height;
  const pw = W - m.left - m.right;
  const ph = H - m.top - m.bottom;
  const sx = useCallback((x: number) => m.left + ((x - domain.xMin) / (domain.xMax - domain.xMin)) * pw, [domain, pw, m.left]);
  const sy = useCallback((y: number) => m.top + (1 - (y - domain.yMin) / (domain.yMax - domain.yMin)) * ph, [domain, ph, m.top]);
  const toData = useCallback(
    (cxp: number, cyp: number): [number, number] | null => {
      const el = ref.current;
      const ctm = el?.getScreenCTM?.();
      if (!el || !ctm) return null;
      const pt = el.createSVGPoint();
      pt.x = cxp;
      pt.y = cyp;
      const p = pt.matrixTransform(ctm.inverse());
      const x = domain.xMin + ((p.x - m.left) / pw) * (domain.xMax - domain.xMin);
      const y = domain.yMin + (1 - (p.y - m.top) / ph) * (domain.yMax - domain.yMin);
      return [x, y];
    },
    [domain, pw, ph, m.left, m.top],
  );
  const scales = useMemo<PlotScales>(() => ({ domain, W, H, m, pw, ph, sx, sy, toData, svg }), [domain, W, H, m.top, m.left, pw, ph, sx, sy, toData, svg]); // eslint-disable-line react-hooks/exhaustive-deps
  const xt = niceTicks(domain.xMin, domain.xMax);
  const yt = niceTicks(domain.yMin, domain.yMax);
  const clipId = useMemo(() => `clip-${Math.random().toString(36).slice(2, 9)}`, []);

  const onDown = (e: RPointerEvent<SVGRectElement>) => {
    if (!onBackgroundPointer) return;
    const d = toData(e.clientX, e.clientY);
    if (!d) return;
    const [x, y] = d;
    if (x < domain.xMin || x > domain.xMax || y < domain.yMin || y > domain.yMax) return;
    onBackgroundPointer(x, y);
  };

  return (
    <PlotContext.Provider value={scales}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className={`plot-svg block w-full h-auto ${className ?? ''}`}
        role="img"
        aria-label={ariaLabel}
        style={{ direction: 'ltr' }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={m.left} y={m.top} width={pw} height={ph} />
          </clipPath>
        </defs>
        <rect x={m.left} y={m.top} width={pw} height={ph} fill="var(--c-plot)" rx={6} />
        {!compact &&
          xt.map((v) => <line key={`gx${v}`} x1={sx(v)} x2={sx(v)} y1={m.top} y2={m.top + ph} stroke="var(--c-grid)" />)}
        {!compact &&
          yt.map((v) => <line key={`gy${v}`} y1={sy(v)} y2={sy(v)} x1={m.left} x2={m.left + pw} stroke="var(--c-grid)" />)}
        <rect
          x={m.left}
          y={m.top}
          width={pw}
          height={ph}
          fill="transparent"
          onPointerDown={onDown}
          style={{ cursor: cursor ?? (onBackgroundPointer ? 'crosshair' : 'default') }}
          data-testid="plot-area"
        />
        <g clipPath={`url(#${clipId})`}>{children}</g>
        <rect x={m.left} y={m.top} width={pw} height={ph} fill="none" stroke="var(--c-border)" rx={6} pointerEvents="none" />
        {!compact && (
          <g fontSize={11} fill="var(--c-subtle)" pointerEvents="none">
            {xt.map((v) => (
              <text key={`tx${v}`} x={sx(v)} y={m.top + ph + 16} textAnchor="middle">
                {v}
              </text>
            ))}
            {yt.map((v) => (
              <text key={`ty${v}`} x={m.left - 8} y={sy(v) + 4} textAnchor="end">
                {v}
              </text>
            ))}
            {xLabel && (
              <text x={m.left + pw / 2} y={H - 6} textAnchor="middle" fill="var(--c-muted)" fontSize={12}>
                {xLabel}
              </text>
            )}
            {yLabel && (
              <text transform={`translate(13 ${m.top + ph / 2}) rotate(-90)`} textAnchor="middle" fill="var(--c-muted)" fontSize={12}>
                {yLabel}
              </text>
            )}
          </g>
        )}
      </svg>
    </PlotContext.Provider>
  );
}

/** Rasterised background (decision regions / probability maps) computed from a real model. */
export function Heatmap({
  fn,
  res = 90,
  version,
}: {
  /** Returns an RGB colour for a data-space coordinate. */
  fn: (x: number, y: number) => readonly [number, number, number];
  res?: number;
  /** Change this value to recompute. */
  version: unknown;
}) {
  const { domain, sx, sy, pw, ph } = usePlot();
  const [url, setUrl] = useState<string | null>(null);
  const resY = Math.max(10, Math.round((res * ph) / pw));
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = res;
    canvas.height = resY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(res, resY);
    for (let j = 0; j < resY; j++) {
      const y = domain.yMax - ((j + 0.5) / resY) * (domain.yMax - domain.yMin);
      for (let i = 0; i < res; i++) {
        const x = domain.xMin + ((i + 0.5) / res) * (domain.xMax - domain.xMin);
        const [r, g, b] = fn(x, y);
        const o = (j * res + i) * 4;
        img.data[o] = r;
        img.data[o + 1] = g;
        img.data[o + 2] = b;
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    setUrl(canvas.toDataURL());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, res, resY, domain]);
  if (!url) return null;
  return (
    <image
      href={url}
      x={sx(domain.xMin)}
      y={sy(domain.yMax)}
      width={pw}
      height={ph}
      preserveAspectRatio="none"
      pointerEvents="none"
      style={{ imageRendering: 'auto' }}
    />
  );
}

/**
 * Marching-squares iso-contour of f(x, y) = level, returned as an SVG path in data → pixel space.
 * Used to draw exact decision boundaries and SVM margins.
 */
export function Contour({
  fn,
  level = 0,
  res = 70,
  version,
  stroke = 'var(--c-text)',
  width = 2,
  dash,
  opacity = 1,
}: {
  fn: (x: number, y: number) => number;
  level?: number;
  res?: number;
  version: unknown;
  stroke?: string;
  width?: number;
  dash?: string;
  opacity?: number;
}) {
  const { domain, sx, sy, pw, ph } = usePlot();
  const d = useMemo(() => {
    const nx = res;
    const ny = Math.max(10, Math.round((res * ph) / pw));
    const xs = Array.from({ length: nx + 1 }, (_, i) => domain.xMin + (i / nx) * (domain.xMax - domain.xMin));
    const ys = Array.from({ length: ny + 1 }, (_, j) => domain.yMin + (j / ny) * (domain.yMax - domain.yMin));
    const v = ys.map((y) => xs.map((x) => fn(x, y) - level));
    let path = '';
    const lerp = (a: number, b: number, va: number, vb: number) => a + ((b - a) * va) / (va - vb || 1e-12);
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const a = v[j][i];
        const b = v[j][i + 1];
        const c = v[j + 1][i + 1];
        const e = v[j + 1][i];
        const pts: [number, number][] = [];
        if (a > 0 !== b > 0) pts.push([lerp(xs[i], xs[i + 1], a, b), ys[j]]);
        if (b > 0 !== c > 0) pts.push([xs[i + 1], lerp(ys[j], ys[j + 1], b, c)]);
        if (c > 0 !== e > 0) pts.push([lerp(xs[i + 1], xs[i], c, e), ys[j + 1]]);
        if (e > 0 !== a > 0) pts.push([xs[i], lerp(ys[j + 1], ys[j], e, a)]);
        for (let k = 0; k + 1 < pts.length; k += 2)
          path += `M${sx(pts[k][0]).toFixed(1)},${sy(pts[k][1]).toFixed(1)}L${sx(pts[k + 1][0]).toFixed(1)},${sy(pts[k + 1][1]).toFixed(1)}`;
      }
    return path;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, level, res, domain, pw, ph]);
  if (!d) return null;
  return <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" opacity={opacity} pointerEvents="none" />;
}

/** Shape-coded markers so class identity never relies on colour alone. */
export function Marker({
  shape,
  x,
  y,
  r = 6,
  fill,
  stroke = 'var(--c-plot)',
  strokeWidth = 1.5,
  opacity = 1,
}: {
  shape: number;
  x: number;
  y: number;
  r?: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}) {
  const s = ((shape % 4) + 4) % 4;
  const common = { fill, stroke, strokeWidth, opacity };
  if (s === 0) return <circle cx={x} cy={y} r={r} {...common} />;
  if (s === 1) return <rect x={x - r * 0.88} y={y - r * 0.88} width={r * 1.76} height={r * 1.76} rx={1.5} {...common} />;
  if (s === 2) {
    const h = r * 1.15;
    return <polygon points={`${x},${y - h} ${x + h},${y + h * 0.75} ${x - h},${y + h * 0.75}`} {...common} />;
  }
  const h = r * 1.2;
  return <polygon points={`${x},${y - h} ${x + h},${y} ${x},${y + h} ${x - h},${y}`} {...common} />;
}

export interface EditablePoint {
  id: string;
  x: number;
  y: number;
  label?: number;
}

export type EditMode = 'add' | 'move' | 'remove' | 'query' | 'none';

/**
 * Renders points and implements drag-to-move and click-to-remove. Adding is handled by the
 * parent through Plot2D's `onBackgroundPointer`.
 */
export function EditablePoints<P extends EditablePoint>({
  points,
  mode,
  onMove,
  onRemove,
  onDragEnd,
  colorOf,
  shapeOf,
  radius = 6,
  opacityOf,
  ringIds,
}: {
  points: readonly P[];
  mode: EditMode;
  onMove?: (id: string, x: number, y: number) => void;
  onRemove?: (id: string) => void;
  onDragEnd?: () => void;
  colorOf: (p: P) => string;
  shapeOf?: (p: P) => number;
  radius?: number;
  opacityOf?: (p: P) => number;
  /** Points to emphasise with a ring (e.g. support vectors, neighbours). */
  ringIds?: ReadonlySet<string>;
}) {
  const { sx, sy, toData, domain } = usePlot();
  const [dragging, setDragging] = useState<string | null>(null);
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const d = toData(e.clientX, e.clientY);
      if (!d || !onMove) return;
      const x = Math.min(domain.xMax, Math.max(domain.xMin, d[0]));
      const y = Math.min(domain.yMax, Math.max(domain.yMin, d[1]));
      onMove(dragging, x, y);
    };
    const up = () => {
      setDragging(null);
      onDragEnd?.();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [dragging, toData, onMove, onDragEnd, domain]);
  const interactive = mode === 'move' || mode === 'remove';
  return (
    <g>
      {ringIds &&
        points
          .filter((p) => ringIds.has(p.id))
          .map((p) => (
            <circle key={`ring-${p.id}`} cx={sx(p.x)} cy={sy(p.y)} r={radius + 5} fill="none" stroke="var(--c-text)" strokeWidth={1.6} pointerEvents="none" />
          ))}
      {points.map((p) => (
        <g
          key={p.id}
          data-point-id={p.id}
          style={{ cursor: mode === 'move' ? (dragging === p.id ? 'grabbing' : 'grab') : mode === 'remove' ? 'not-allowed' : undefined }}
          pointerEvents={interactive ? 'all' : 'none'}
          onPointerDown={(e) => {
            if (mode === 'move') {
              e.stopPropagation();
              e.preventDefault();
              setDragging(p.id);
            } else if (mode === 'remove') {
              e.stopPropagation();
              onRemove?.(p.id);
            }
          }}
        >
          {interactive && <circle cx={sx(p.x)} cy={sy(p.y)} r={radius + 7} fill="transparent" />}
          <Marker
            shape={shapeOf ? shapeOf(p) : (p.label ?? 0)}
            x={sx(p.x)}
            y={sy(p.y)}
            r={dragging === p.id ? radius + 2 : radius}
            fill={colorOf(p)}
            opacity={opacityOf ? opacityOf(p) : 1}
          />
        </g>
      ))}
    </g>
  );
}

export function DataLine({ x1, y1, x2, y2, ...rest }: { x1: number; y1: number; x2: number; y2: number; stroke?: string; strokeWidth?: number; strokeDasharray?: string; opacity?: number }) {
  const { sx, sy } = usePlot();
  return <line x1={sx(x1)} y1={sy(y1)} x2={sx(x2)} y2={sy(y2)} pointerEvents="none" strokeLinecap="round" {...rest} />;
}

/** Polyline through data-space points. */
export function CurvePath({ pts, stroke = 'var(--c-accent)', width = 2.5, dash, opacity = 1 }: { pts: readonly (readonly [number, number])[]; stroke?: string; width?: number; dash?: string; opacity?: number }) {
  const { sx, sy } = usePlot();
  if (pts.length < 2) return null;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join('');
  return <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeDasharray={dash} opacity={opacity} strokeLinejoin="round" pointerEvents="none" />;
}

/** A crosshair-style probe used for "query" points. */
export function Probe({ x, y, label, color = 'var(--c-text)' }: { x: number; y: number; label?: string; color?: string }) {
  const { sx, sy } = usePlot();
  const px = sx(x);
  const py = sy(y);
  return (
    <g pointerEvents="none">
      <circle cx={px} cy={py} r={11} fill="none" stroke={color} strokeWidth={2} />
      <line x1={px - 16} x2={px - 6} y1={py} y2={py} stroke={color} strokeWidth={2} />
      <line x1={px + 6} x2={px + 16} y1={py} y2={py} stroke={color} strokeWidth={2} />
      <line x1={px} x2={px} y1={py - 16} y2={py - 6} stroke={color} strokeWidth={2} />
      <line x1={px} x2={px} y1={py + 6} y2={py + 16} stroke={color} strokeWidth={2} />
      {label && (
        <g>
          <rect x={px + 14} y={py - 30} width={label.length * 7 + 12} height={20} rx={5} fill="var(--c-surface)" stroke="var(--c-border)" />
          <text x={px + 20} y={py - 16} fontSize={12} fill="var(--c-text)" fontFamily="JetBrains Mono Variable, monospace">
            {label}
          </text>
        </g>
      )}
    </g>
  );
}
