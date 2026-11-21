import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Tag, ArrowLeft, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSeo } from '../lib/seo';
import { CartLines } from '../components/CartDrawer';
import { EmptyState, Spinner } from '../components/ui';
import { fetchQuote, ApiError } from '../lib/api';
import type { Quote } from '../lib/types';
import { formatSAR } from '../../shared/money';
import { errorMessageAr } from '../../shared/labels';

export function usePricedCart(loc?: { lat: number; lng: number } | null) {
  const { items, promoCode } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);
  const sig = JSON.stringify([items.map((i) => [i.product_id, i.variant_id, i.quantity, i.notes]), promoCode, loc]);
  useEffect(() => {
    if (!items.length) {
      setQuote(null);
      return;
    }
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      fetchQuote(items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity, notes: i.notes })), promoCode, loc)
        .then((q) => {
          if (!alive) return;
          setQuote(q);
          setError(null);
        })
        .catch((e: ApiError) => {
          if (!alive) return;
          setError(e);
          setQuote(null);
        })
        .finally(() => alive && setLoading(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return { quote, error, loading };
}

export function PromoInput() {
  const { promoCode, setPromoCode } = useCart();
  const [value, setValue] = useState('');
  if (promoCode)
    return (
      <div className="flex items-center justify-between rounded-2xl border border-dashed border-caramel/60 bg-caramel/10 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-semibold text-cocoa"><Tag className="h-4 w-4" /> <span className="ltr">{promoCode}</span></span>
        <button onClick={() => setPromoCode(null)} className="flex items-center gap-1 text-espresso/60 hover:text-red-700"><X className="h-4 w-4" /> إزالة</button>
      </div>
    );
  const apply = () => {
    if (value.trim()) setPromoCode(value.trim().toUpperCase());
  };
  return (
    <div className="flex gap-2">
      <label htmlFor="promo" className="sr-only">كود الخصم</label>
      <input
        id="promo"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            apply();
          }
        }}
        placeholder="كود الخصم"
        className="input flex-1 py-2.5 uppercase"
        autoComplete="off"
        maxLength={30}
      />
      <button type="button" onClick={apply} className="btn-secondary btn-sm">تطبيق</button>
    </div>
  );
}

export function Totals({ quote, loading, showDelivery = true }: { quote: Quote | null; loading: boolean; showDelivery?: boolean }) {
  const { subtotal } = useCart();
  return (
    <dl className="space-y-2.5 text-[15px]">
      <div className="flex justify-between"><dt className="text-espresso/65">المجموع</dt><dd className="tabular-nums">{formatSAR(quote?.subtotal_halalas ?? subtotal)}</dd></div>
      {quote && quote.discount_halalas > 0 && (
        <div className="flex justify-between text-sage"><dt>الخصم {quote.promotion?.code ? `(${quote.promotion.code})` : quote.promotion?.name ? `(${quote.promotion.name})` : ''}</dt><dd className="tabular-nums">- {formatSAR(quote.discount_halalas)}</dd></div>
      )}
      {showDelivery && (
        <div className="flex justify-between"><dt className="text-espresso/65">التوصيل</dt><dd className="tabular-nums">{quote?.zone ? formatSAR(quote.delivery_fee_halalas) : <span className="text-sm text-espresso/50">يُحدد حسب موقعك</span>}</dd></div>
      )}
      <div className="flex items-center justify-between border-t border-cocoa/10 pt-3">
        <dt className="font-semibold">الإجمالي</dt>
        <dd className="flex items-center gap-2 font-display text-xl font-semibold text-cocoa tabular-nums">{loading && <Spinner className="h-4 w-4" />}{formatSAR(quote?.total_halalas ?? subtotal)}</dd>
      </div>
    </dl>
  );
}

export default function Cart() {
  const { items } = useCart();
  const { quote, error, loading } = usePricedCart();
  useSeo({ title: 'السلة', noindex: true });

  if (!items.length)
    return (
      <div className="container-x py-20">
        <EmptyState icon={<ShoppingBag className="h-10 w-10" />} title="سلتك فاضية" text="ابدأ بإضافة الكوكيز المفضل لديك." action={<Link to="/shop" className="btn-primary">تسوق الآن</Link>} />
      </div>
    );

  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">سلة التسوق</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="card px-5 sm:px-7 lg:col-span-2">
          <CartLines />
        </div>
        <aside className="card h-fit space-y-5 p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-semibold">ملخص الطلب</h2>
          <PromoInput />
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{errorMessageAr(error.code)}</p>}
          <Totals quote={quote} loading={loading} />
          <Link to="/checkout" className="btn-primary w-full py-4 text-base">إتمام الطلب <ArrowLeft className="h-4 w-4" /></Link>
          <Link to="/shop" className="btn-ghost w-full">متابعة التسوق</Link>
          <p className="text-center text-xs leading-relaxed text-espresso/50">الأسعار النهائية تُحسب وتُعتمد عند إرسال الطلب.</p>
        </aside>
      </div>
    </div>
  );
}
