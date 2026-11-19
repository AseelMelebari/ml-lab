import { useState, type ReactNode } from 'react';
import { MousePointer2, Move, Pause, Play, Plus, RotateCcw, SkipForward, Trash2, Crosshair, Table2, Shuffle, Undo2 } from 'lucide-react';
import { Button, Segmented, Select, Slider, cx } from '@/components/ui/primitives';
import { Marker, type EditMode } from '@/components/charts/Plot2D';
import { classVar } from '@/components/charts/colors';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import type { Text } from '@/i18n/types';

export interface LabProps {
  /** Large, simplified presentation layout (Instructor Mode). */
  presentation?: boolean;
  /** Named preset configuration used by Instructor Mode demos. */
  preset?: string;
}

export function LabShell({
  presentation,
  viz,
  controls,
  below,
  status,
}: {
  presentation?: boolean;
  viz: ReactNode;
  controls: ReactNode;
  below?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <div className={cx('grid gap-4', presentation ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : 'lg:grid-cols-[minmax(0,1fr)_320px]')}>
      <div className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-line bg-surface p-2 sm:p-3">{viz}</div>
        {status}
        {below}
      </div>
      <aside className="space-y-4 min-w-0" aria-label="Lab controls">
        {controls}
      </aside>
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cx('rounded-2xl border border-line bg-surface p-4', className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function PlayControls({
  running,
  onToggle,
  onStep,
  onReset,
  disabled,
  stepLabel,
}: {
  running: boolean;
  onToggle: () => void;
  onStep?: () => void;
  onReset: () => void;
  disabled?: boolean;
  stepLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="primary" onClick={onToggle} disabled={disabled} icon={running ? <Pause size={16} /> : <Play size={16} />} aria-pressed={running}>
        {t(running ? C.pause : C.play)}
      </Button>
      {onStep && (
        <Button onClick={onStep} disabled={disabled || running} icon={<SkipForward size={16} className="rtl:-scale-x-100" />}>
          {stepLabel ?? t(C.step)}
        </Button>
      )}
      <Button variant="ghost" onClick={onReset} icon={<RotateCcw size={16} />}>
        {t(C.reset)}
      </Button>
    </div>
  );
}

export function ModePicker({ mode, onMode, modes = ['add', 'move', 'remove'] }: { mode: EditMode; onMode: (m: EditMode) => void; modes?: EditMode[] }) {
  const { t } = useI18n();
  const meta: Record<string, { icon: ReactNode; label: Text }> = {
    add: { icon: <Plus size={14} />, label: C.add },
    move: { icon: <Move size={14} />, label: C.move },
    remove: { icon: <Trash2 size={14} />, label: C.remove },
    query: { icon: <Crosshair size={14} />, label: C.query },
    none: { icon: <MousePointer2 size={14} />, label: ['View', 'عرض'] },
  };
  return (
    <Segmented
      label={t(C.editMode)}
      value={mode}
      size="sm"
      onChange={onMode}
      options={modes.map((m) => ({ value: m, label: <>{meta[m].icon}<span>{t(meta[m].label)}</span></> }))}
    />
  );
}

export function ClassPicker({ value, onChange, nClasses, names }: { value: number; onChange: (c: number) => void; nClasses: number; names?: string[] }) {
  const { t } = useI18n();
  return (
    <Segmented
      label={t(C.addClass)}
      value={value}
      size="sm"
      onChange={onChange}
      options={Array.from({ length: nClasses }, (_, c) => ({
        value: c,
        label: (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <Marker shape={c} x={7} y={7} r={4.5} fill={classVar(c)} stroke="none" />
            </svg>
            {names?.[c] ?? `${t(C.class)} ${c}`}
          </>
        ),
      }))}
    />
  );
}

export function DatasetPanel<D extends string>({
  dataset,
  options,
  onDataset,
  n,
  onN,
  nMin = 10,
  nMax,
  seed,
  onSeed,
  onRegenerate,
  children,
  count,
  limit,
}: {
  dataset: D;
  options: { value: D; label: string }[];
  onDataset: (d: D) => void;
  n?: number;
  onN?: (n: number) => void;
  nMin?: number;
  nMax?: number;
  seed: number;
  onSeed: (s: number) => void;
  onRegenerate: () => void;
  children?: ReactNode;
  count: number;
  limit: number;
}) {
  const { t } = useI18n();
  return (
    <Panel
      title={t(C.dataset)}
      actions={
        <span className={cx('ltr font-mono text-xs', count >= limit ? 'text-warn' : 'text-subtle')} title={t(['Maximum points for this lab', 'الحد الأقصى للنقاط في هذا المختبر'])}>
          {count}/{limit}
        </span>
      }
    >
      <Select label={t(C.dataset)} value={dataset} options={options} onChange={onDataset} />
      {n !== undefined && onN && nMax && <Slider label={t(C.samples)} value={n} min={nMin} max={nMax} onChange={onN} />}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Slider label={t(C.seed)} value={seed} min={1} max={99} onChange={onSeed} />
        </div>
        <Button size="sm" onClick={() => onSeed(1 + Math.floor(Math.random() * 99))} aria-label={t(['Random seed', 'بذرة عشوائية'])} icon={<Shuffle size={14} />} />
      </div>
      <Button className="w-full" onClick={onRegenerate} icon={<Undo2 size={15} />}>
        {t(C.resetData)}
      </Button>
      {children}
      {count >= limit && <p className="text-xs text-warn">{t(['Point limit reached — remove points to add new ones.', 'تم بلوغ الحد الأقصى للنقاط — احذف نقاطًا لإضافة جديدة.'])}</p>}
      <p className="text-[11px] text-subtle">{t(C.synthetic)}</p>
    </Panel>
  );
}

/** Accessible alternative to pointer editing: view and edit coordinates with the keyboard. */
export function PointsTable<P extends { id: string; x: number; y: number; label?: number }>({
  points,
  onUpdate,
  onRemove,
  xName = 'x₁',
  yName = 'x₂',
  labelName,
  classNames,
  extraColumns,
}: {
  points: readonly P[];
  onUpdate: (id: string, patch: Partial<P>) => void;
  onRemove: (id: string) => void;
  xName?: string;
  yName?: string;
  labelName?: string;
  classNames?: string[];
  extraColumns?: { header: string; value: (p: P) => ReactNode }[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const num = (v: string, fallback: number) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : fallback;
  };
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-3 text-sm text-muted hover:text-ink">
        <Table2 size={16} />
        {t(open ? C.hideTable : C.showTable)} <span className="ltr font-mono text-xs">({points.length})</span>
      </button>
      {open && (
        <div className="max-h-72 overflow-auto border-t border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-2 text-xs text-muted">
              <tr>
                <th className="px-3 py-2 text-start">#</th>
                <th className="px-3 py-2 text-start ltr">{xName}</th>
                <th className="px-3 py-2 text-start ltr">{yName}</th>
                {labelName && <th className="px-3 py-2 text-start">{labelName}</th>}
                {extraColumns?.map((c) => (
                  <th key={c.header} className="px-3 py-2 text-start">
                    {c.header}
                  </th>
                ))}
                <th className="px-3 py-2">
                  <span className="sr-only">{t(C.remove)}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={p.id} className="border-t border-line/60">
                  <td className="px-3 py-1 text-subtle font-mono text-xs">{i + 1}</td>
                  <td className="px-2 py-1">
                    <input aria-label={`${xName} #${i + 1}`} type="number" step="0.1" className="ltr w-20 rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-xs" value={+p.x.toFixed(2)} onChange={(e) => onUpdate(p.id, { x: num(e.target.value, p.x) } as Partial<P>)} />
                  </td>
                  <td className="px-2 py-1">
                    <input aria-label={`${yName} #${i + 1}`} type="number" step="0.1" className="ltr w-20 rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-xs" value={+p.y.toFixed(2)} onChange={(e) => onUpdate(p.id, { y: num(e.target.value, p.y) } as Partial<P>)} />
                  </td>
                  {labelName && classNames && (
                    <td className="px-2 py-1">
                      <select aria-label={`${labelName} #${i + 1}`} className="rounded-md border border-line bg-surface-2 px-2 py-1 text-xs" value={p.label} onChange={(e) => onUpdate(p.id, { label: Number(e.target.value) } as Partial<P>)}>
                        {classNames.map((n, c) => (
                          <option key={c} value={c}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {extraColumns?.map((c) => (
                    <td key={c.header} className="px-3 py-1 ltr font-mono text-xs">
                      {c.value(p)}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-end">
                    <button type="button" onClick={() => onRemove(p.id)} className="rounded p-1 text-subtle hover:text-danger" aria-label={`${t(C.remove)} #${i + 1}`}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{children}</div>;
}

export function ClassLegend({ names, extra }: { names: string[]; extra?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 pt-1 text-xs text-muted">
      {names.map((n, c) => (
        <span key={c} className="inline-flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <Marker shape={c} x={7} y={7} r={4.5} fill={classVar(c)} stroke="none" />
          </svg>
          {n}
        </span>
      ))}
      {extra}
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="px-2 pt-1 text-xs text-subtle">{children}</p>;
}
