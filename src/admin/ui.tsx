import clsx from 'clsx';
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { OrderStatus, PaymentStatus } from '../../shared/labels';
import { ORDER_STATUS_AR, PAYMENT_STATUS_AR, EMAIL_STATUS_AR } from '../../shared/labels';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-espresso/55">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, actions, children, className, padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={clsx('rounded-3xl border border-cocoa/10 bg-white shadow-soft', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cocoa/10 px-5 py-4">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {actions}
        </header>
      )}
      <div className={clsx(padded && 'p-5')}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }: { label: string; value: ReactNode; hint?: ReactNode; icon?: React.ComponentType<{ className?: string }>; tone?: 'default' | 'accent' | 'warn' }) {
  return (
    <div className={clsx('rounded-3xl border p-5 shadow-soft', tone === 'accent' ? 'border-cocoa bg-cocoa text-cream-50' : tone === 'warn' ? 'border-caramel/40 bg-caramel/10' : 'border-cocoa/10 bg-white')}>
      <div className="flex items-start justify-between gap-2">
        <p className={clsx('text-sm', tone === 'accent' ? 'text-cream-200/80' : 'text-espresso/60')}>{label}</p>
        {Icon && <Icon className={clsx('h-5 w-5', tone === 'accent' ? 'text-caramel-light' : 'text-caramel')} />}
      </div>
      <p className={clsx('mt-2 font-display text-2xl font-semibold tabular-nums sm:text-[26px]', tone === 'accent' ? 'text-cream-50' : 'text-espresso')}>{value}</p>
      {hint && <p className={clsx('mt-1 text-xs', tone === 'accent' ? 'text-cream-200/70' : 'text-espresso/50')}>{hint}</p>}
    </div>
  );
}

const STATUS_TONE: Record<OrderStatus, string> = {
  pending_confirmation: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-sky-100 text-sky-900',
  preparing: 'bg-violet-100 text-violet-900',
  ready: 'bg-teal-100 text-teal-900',
  out_for_delivery: 'bg-indigo-100 text-indigo-900',
  delivered: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-stone-200 text-stone-700 line-through decoration-stone-400',
};
const PAY_TONE: Record<PaymentStatus, string> = {
  pending_payment: 'bg-orange-100 text-orange-900',
  paid: 'bg-emerald-100 text-emerald-900',
  partially_paid: 'bg-yellow-100 text-yellow-900',
  refunded: 'bg-stone-200 text-stone-700',
};
export const StatusBadge = ({ status }: { status: OrderStatus }) => <span className={clsx('chip', STATUS_TONE[status])}>{ORDER_STATUS_AR[status]}</span>;
export const PaymentBadge = ({ status }: { status: PaymentStatus }) => <span className={clsx('chip', PAY_TONE[status])}>{PAYMENT_STATUS_AR[status]}</span>;
export const EmailBadge = ({ status }: { status: string }) => (
  <span className={clsx('chip', { sent: 'bg-emerald-100 text-emerald-900', pending: 'bg-stone-100 text-stone-700', sending: 'bg-sky-100 text-sky-900', failed: 'bg-amber-100 text-amber-900', dead: 'bg-red-100 text-red-900' }[status])}>
    {EMAIL_STATUS_AR[status] ?? status}
  </span>
);

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={clsx('flex cursor-pointer items-start justify-between gap-4', disabled && 'cursor-not-allowed opacity-50')}>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-espresso/55">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-cocoa' : 'bg-cocoa/20')}
      >
        <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'right-0.5' : 'right-[22px]')} />
      </button>
    </label>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-espresso/40 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className={clsx('relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-4xl bg-offwhite shadow-lift sm:rounded-4xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <header className="flex items-center justify-between border-b border-cocoa/10 px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cocoa/5" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-cocoa/10 px-6 py-4 pb-safe">{footer}</footer>}
      </div>
    </div>
  );
}

export function MoneyInput({ value, onChange, id, placeholder, allowEmpty }: { value: number | null; onChange: (h: number | null) => void; id?: string; placeholder?: string; allowEmpty?: boolean }) {
  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        dir="ltr"
        placeholder={placeholder}
        value={value == null ? '' : (value / 100).toString()}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') return onChange(allowEmpty ? null : 0);
          const n = Math.round(Number(v) * 100);
          if (Number.isFinite(n) && n >= 0) onChange(n);
        }}
        className="input pe-14 text-right"
      />
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-espresso/45">ر.س</span>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-5 py-14 text-center text-sm text-espresso/50">{children}</div>;
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    // Prevent CSV/formula injection in spreadsheet apps
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const csv = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
