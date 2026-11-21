import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatSAR } from '../../shared/money';
import { QuantityStepper, EmptyState } from './ui';
import { ProductPlaceholder } from './CookieArt';

export function CartLines({ compact = false }: { compact?: boolean }) {
  const { items, setQuantity, remove } = useCart();
  return (
    <ul className="divide-y divide-cocoa/10">
      {items.map((i, idx) => (
        <li key={i.key} className="flex gap-4 py-4">
          <Link to={`/product/${i.slug}`} className={clsx('shrink-0 overflow-hidden rounded-2xl bg-cream-200', compact ? 'h-20 w-20' : 'h-24 w-24')}>
            {i.image ? <img src={i.image} alt={i.name} className="h-full w-full object-cover" loading="lazy" /> : <ProductPlaceholder className="h-full w-full" seed={idx} />}
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={`/product/${i.slug}`} className="block truncate font-semibold hover:text-cocoa">{i.name}</Link>
                {i.variant_name && <p className="text-sm text-espresso/60">{i.variant_name}</p>}
                {i.notes && <p className="mt-0.5 line-clamp-1 text-xs text-espresso/50">ملاحظة: {i.notes}</p>}
              </div>
              <button onClick={() => remove(i.key)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-espresso/40 transition hover:bg-red-50 hover:text-red-700" aria-label={`حذف ${i.name}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-auto flex items-center justify-between pt-2">
              <QuantityStepper size="sm" value={i.quantity} min={i.min_quantity} max={i.max_quantity} onChange={(n) => setQuantity(i.key, n)} />
              <span className="font-semibold tabular-nums text-cocoa">{formatSAR(i.unit_price_halalas * i.quantity)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CartDrawer() {
  const { drawerOpen, setDrawerOpen, items, subtotal, count } = useCart();
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen, setDrawerOpen]);

  return (
    <div className={clsx('fixed inset-0 z-50 overflow-hidden transition-[visibility] duration-300', drawerOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none')} aria-hidden={!drawerOpen}>
      <div className={clsx('absolute inset-0 bg-espresso/40 backdrop-blur-sm transition-opacity duration-300', drawerOpen ? 'opacity-100' : 'opacity-0')} onClick={() => setDrawerOpen(false)} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="سلة التسوق"
        className={clsx('absolute inset-y-0 left-0 flex w-full max-w-md flex-col bg-offwhite shadow-lift transition-transform duration-300 ease-out', drawerOpen ? 'translate-x-0' : '-translate-x-full')}
      >
        <div className="flex items-center justify-between border-b border-cocoa/10 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingBag className="h-5 w-5 text-caramel" /> سلتك
            {count > 0 && <span className="text-sm font-normal text-espresso/50">({count} قطعة)</span>}
          </h2>
          <button onClick={() => setDrawerOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-cocoa/5" aria-label="إغلاق السلة">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="py-10">
              <EmptyState icon={<ShoppingBag className="h-10 w-10" />} title="سلتك فاضية" text="اختر الكوكيز اللي تحبه وأضفه للسلة." action={<Link to="/shop" onClick={() => setDrawerOpen(false)} className="btn-primary">تسوق الآن</Link>} />
            </div>
          ) : (
            <CartLines compact />
          )}
        </div>
        {items.length > 0 && (
          <div className="space-y-3 border-t border-cocoa/10 bg-white/60 px-5 py-5 pb-safe">
            <div className="flex items-center justify-between text-base">
              <span className="text-espresso/70">المجموع</span>
              <span className="font-display text-lg font-semibold text-cocoa">{formatSAR(subtotal)}</span>
            </div>
            <p className="text-xs leading-relaxed text-espresso/55">رسوم التوصيل والخصومات تُحسب في صفحة إتمام الطلب. الدفع والتأكيد عبر واتساب.</p>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/cart" onClick={() => setDrawerOpen(false)} className="btn-secondary">عرض السلة</Link>
              <Link to="/checkout" onClick={() => setDrawerOpen(false)} className="btn-primary">إتمام الطلب</Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
