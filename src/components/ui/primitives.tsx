import { forwardRef, useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-[#04201d] hover:brightness-110 shadow-[0_0_0_1px_rgba(45,212,191,.35),0_8px_24px_-10px_rgba(45,212,191,.6)]',
  secondary: 'bg-surface-2 text-ink border border-line hover:border-accent/60',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
  danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: ReactNode }
>(function Button({ variant = 'secondary', size = 'md', icon, className, children, type = 'button', ...rest }, ref) {
  const sz = size === 'sm' ? 'h-8 px-3 text-xs gap-1.5' : size === 'lg' ? 'h-12 px-6 text-base gap-2.5' : 'h-10 px-4 text-sm gap-2';
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none select-none whitespace-nowrap',
        sz,
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});

export function Card({ className, children, as: As = 'div' }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' }) {
  return <As className={cx('rounded-2xl border border-line bg-surface', className)}>{children}</As>;
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'purple' | 'cyan' | 'warn' | 'success'; className?: string }) {
  const tones = {
    neutral: 'bg-surface-2 text-muted border-line',
    accent: 'bg-accent/10 text-accent-ink border-accent/30',
    purple: 'bg-purple/10 text-purple border-purple/30',
    cyan: 'bg-cyan/10 text-cyan border-cyan/30',
    warn: 'bg-warn/10 text-warn border-warn/30',
    success: 'bg-success/10 text-success border-success/30',
  };
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  hint,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={cx('space-y-1.5', disabled && 'opacity-50')}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm text-muted flex items-center gap-1">
          {label}
          {hint && <InfoTip text={hint} />}
        </label>
        <output htmlFor={id} className="ltr font-mono text-sm text-ink tabular-nums">
          {format ? format(value) : value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="ml-range w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        dir="ltr"
      />
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm text-muted flex items-center gap-1">
        {label}
        {hint && <InfoTip text={hint} />}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full h-10 rounded-xl border border-line bg-surface-2 px-3 text-sm text-ink focus:border-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  size = 'md',
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm text-muted">{label}</div>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-xl bg-surface-2 p-1 border border-line">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex-1 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-1.5',
              size === 'sm' ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm',
              o.value === value ? 'bg-surface text-ink shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-muted flex items-center gap-1 cursor-pointer">
        {label}
        {hint && <InfoTip text={hint} />}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-6 w-11 shrink-0 rounded-full border transition-colors', checked ? 'bg-accent border-accent' : 'bg-surface-2 border-line')}
      >
        <span
          className={cx(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-all',
            checked ? 'start-[22px]' : 'start-0.5',
          )}
        />
      </button>
    </div>
  );
}

export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={text}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-subtle hover:text-accent"
      >
        <Info size={14} aria-hidden />
      </button>
      {open && (
        <span role="tooltip" className="absolute bottom-full start-1/2 z-50 mb-2 w-60 -translate-x-1/2 rtl:translate-x-1/2 rounded-lg border border-line bg-surface p-2.5 text-xs leading-relaxed text-ink shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'tip' | 'danger'; title?: string; children: ReactNode }) {
  const tones = {
    info: 'border-cyan/30 bg-cyan/5',
    tip: 'border-accent/30 bg-accent/5',
    warn: 'border-warn/40 bg-warn/5',
    danger: 'border-danger/40 bg-danger/5',
  };
  return (
    <div className={cx('rounded-xl border p-4 text-sm leading-relaxed', tones[tone])} role={tone === 'danger' || tone === 'warn' ? 'status' : undefined}>
      {title && <div className="mb-1 font-semibold text-ink">{title}</div>}
      <div className="text-muted">{children}</div>
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'accent' | 'warn' | 'danger' }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 px-3 py-2.5 min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-subtle truncate">{label}</div>
      <div
        className={cx(
          'ltr font-mono text-lg font-semibold tabular-nums truncate',
          tone === 'accent' ? 'text-accent' : tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : 'text-ink',
        )}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-muted truncate">{sub}</div>}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, desc, id }: { eyebrow?: string; title: string; desc?: string; id?: string }) {
  return (
    <div className="mb-8 max-w-3xl" id={id}>
      {eyebrow && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</div>}
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{title}</h2>
      {desc && <p className="mt-3 text-muted leading-relaxed">{desc}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, desc, children }: { eyebrow?: string; title: string; desc?: string; children?: ReactNode }) {
  return (
    <header className="relative border-b border-line overflow-hidden">
      <div className="absolute inset-0 bg-grid-faint opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        {eyebrow && <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</div>}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink max-w-4xl">{title}</h1>
        {desc && <p className="mt-4 max-w-3xl text-base sm:text-lg text-muted leading-relaxed">{desc}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="ltr rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">{children}</kbd>;
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden />
      <span className="text-sm">{label ?? t(['Loading…', 'جارٍ التحميل…'])}</span>
    </div>
  );
}
