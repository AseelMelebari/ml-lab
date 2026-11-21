import clsx from 'clsx';
import { Loader2, Minus, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatSAR } from '../../shared/money';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('animate-spin', className ?? 'h-5 w-5')} aria-hidden="true" />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-cocoa" role="status">
      <Spinner className="h-7 w-7" />
      <span className="text-sm text-espresso/60">جارٍ التحميل…</span>
    </div>
  );
}

export function Price({ value, compareAt, from, className, size = 'md' }: { value: number; compareAt?: number | null; from?: boolean; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' };
  return (
    <span className={clsx('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      {from && <span className="text-xs text-espresso/55">يبدأ من</span>}
      <span className={clsx('font-display font-semibold text-cocoa', sizes[size])}>{formatSAR(value)}</span>
      {compareAt ? <s className="text-sm text-espresso/40">{formatSAR(compareAt)}</s> : null}
    </span>
  );
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md' }: { value: number; onChange: (n: number) => void; min?: number; max?: number; size?: 'sm' | 'md' }) {
  const btn = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  return (
    <div className="inline-flex items-center rounded-full border border-cocoa/15 bg-white">
      <button type="button" className={clsx(btn, 'grid place-items-center rounded-full text-cocoa transition hover:bg-cream-200 disabled:opacity-30')} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="زيادة الكمية">
        <Plus className="h-4 w-4" />
      </button>
      <span className={clsx('min-w-8 text-center font-semibold tabular-nums', size === 'sm' ? 'text-sm' : 'text-base')} aria-live="polite">
        {value}
      </span>
      <button type="button" className={clsx(btn, 'grid place-items-center rounded-full text-cocoa transition hover:bg-cream-200 disabled:opacity-30')} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="إنقاص الكمية">
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center', action }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; align?: 'center' | 'start'; action?: ReactNode }) {
  return (
    <div className={clsx('mb-10 flex flex-col gap-3 sm:mb-12', align === 'center' ? 'items-center text-center' : 'items-start sm:flex-row sm:items-end sm:justify-between')}>
      <div className={clsx(align === 'center' && 'flex flex-col items-center')}>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 max-w-xl text-balance leading-relaxed text-espresso/65">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-cocoa/15 bg-cream-100/60 px-6 py-14 text-center">
      {icon && <div className="mb-4 text-caramel">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-sm leading-relaxed text-espresso/60">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="skeleton aspect-[4/5] rounded-3xl" />
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-4 w-1/3" />
    </div>
  );
}

export function Field({ label, error, hint, children, required, htmlFor }: { label: string; error?: string | null; hint?: string; children: ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required && <span className="text-caramel-dark"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="hint">{hint}</p>
      ) : null}
    </div>
  );
}
