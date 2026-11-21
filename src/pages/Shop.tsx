import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { Search, Cookie as CookieIcon, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../lib/seo';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton, EmptyState } from '../components/ui';
import { isSoldOut, productPricing } from '../lib/api';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export default function Shop() {
  const { products, categories, loading, error } = useStore();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const cat = params.get('category') ?? '';
  const sort = (params.get('sort') as Sort) || 'featured';
  const onlyAvailable = params.get('available') === '1';
  const onlyOffers = params.get('offers') === '1';

  useSeo({ title: 'المتجر', description: 'تسوّق كوكيز دفوة الطازج في مكة المكرمة — اختر المفضل لديك واطلب قبل موعد التسليم بـ 24 ساعة.' });

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = products.filter((p) => {
      if (cat && p.category?.slug !== cat) return false;
      if (onlyAvailable && isSoldOut(p)) return false;
      if (onlyOffers && !productPricing(p).compareAt) return false;
      if (term) {
        const hay = `${p.name_ar} ${p.name_en ?? ''} ${p.short_description ?? ''} ${p.category?.name_ar ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    if (sort === 'price-asc') r = [...r].sort((a, b) => productPricing(a).price - productPricing(b).price);
    if (sort === 'price-desc') r = [...r].sort((a, b) => productPricing(b).price - productPricing(a).price);
    if (sort === 'newest') r = [...r].sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (sort === 'featured') r = [...r].sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order);
    return r;
  }, [products, q, cat, sort, onlyAvailable, onlyOffers]);

  const hasFilters = q || cat || onlyAvailable || onlyOffers;

  return (
    <div>
      <section className="relative overflow-hidden bg-cream-200">
        <div className="grain absolute inset-0" aria-hidden="true" />
        <div className="container-x relative py-14 text-center sm:py-20">
          <p className="eyebrow mb-3">The shop</p>
          <h1 className="text-4xl font-bold sm:text-5xl">متجر دفوة</h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-espresso/65">كوكيز طازج يُخبز لطلبك. التوصيل داخل مكة المكرمة فقط.</p>
          <div className="relative mx-auto mt-8 max-w-lg">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-espresso/40" />
            <input
              type="search"
              value={q}
              onChange={(e) => set('q', e.target.value || null)}
              placeholder="ابحث عن منتج…"
              className="input rounded-full py-4 pe-4 ps-12 shadow-soft"
              aria-label="ابحث عن منتج"
            />
          </div>
        </div>
      </section>

      <div className="sticky top-[72px] z-20 border-b border-cocoa/10 bg-offwhite/90 backdrop-blur-xl sm:top-20">
        <div className="container-x flex items-center gap-3 py-3">
          <div className="scrollbar-none -mx-1 flex flex-1 gap-2 overflow-x-auto px-1">
            <button onClick={() => set('category', null)} className={clsx('chip shrink-0 px-4 py-2 text-sm transition', !cat ? 'bg-cocoa text-white' : 'bg-cream-200 text-espresso/75 hover:bg-cream-300')}>
              الكل
            </button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => set('category', c.slug)} className={clsx('chip shrink-0 px-4 py-2 text-sm transition', cat === c.slug ? 'bg-cocoa text-white' : 'bg-cream-200 text-espresso/75 hover:bg-cream-300')}>
                {c.name_ar}
              </button>
            ))}
          </div>
          <label className="relative hidden shrink-0 sm:block">
            <span className="sr-only">ترتيب</span>
            <select value={sort} onChange={(e) => set('sort', e.target.value === 'featured' ? null : e.target.value)} className="input rounded-full py-2 pe-9 ps-4 text-sm">
              <option value="featured">المميزة أولًا</option>
              <option value="newest">الأحدث</option>
              <option value="price-asc">السعر: من الأقل</option>
              <option value="price-desc">السعر: من الأعلى</option>
            </select>
          </label>
        </div>
      </div>

      <div className="container-x py-10">
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
          <SlidersHorizontal className="h-4 w-4 text-caramel" />
          <button onClick={() => set('available', onlyAvailable ? null : '1')} className={clsx('chip px-3 py-1.5', onlyAvailable ? 'bg-caramel text-white' : 'border border-cocoa/15 bg-white text-espresso/70')} aria-pressed={onlyAvailable}>
            المتوفر فقط
          </button>
          <button onClick={() => set('offers', onlyOffers ? null : '1')} className={clsx('chip px-3 py-1.5', onlyOffers ? 'bg-caramel text-white' : 'border border-cocoa/15 bg-white text-espresso/70')} aria-pressed={onlyOffers}>
            العروض
          </button>
          <select value={sort} onChange={(e) => set('sort', e.target.value === 'featured' ? null : e.target.value)} className="chip border border-cocoa/15 bg-white px-3 py-1.5 text-espresso/70 sm:hidden" aria-label="ترتيب">
            <option value="featured">المميزة أولًا</option>
            <option value="newest">الأحدث</option>
            <option value="price-asc">السعر: من الأقل</option>
            <option value="price-desc">السعر: من الأعلى</option>
          </select>
          {hasFilters && (
            <button onClick={() => setParams({}, { replace: true })} className="chip px-3 py-1.5 text-cocoa hover:bg-cocoa/5">
              <X className="h-3.5 w-3.5" /> مسح الفلاتر
            </button>
          )}
          {!loading && <span className="ms-auto text-espresso/50">{list.length} منتج</span>}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : list.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        ) : (
          <EmptyState
            icon={<CookieIcon className="h-10 w-10" />}
            title={error ? 'تعذر تحميل المنتجات' : products.length ? 'ما لقينا منتجات مطابقة' : 'المنتجات قريبًا'}
            text={error ? 'فضلًا حدّث الصفحة بعد قليل.' : products.length ? 'جرّب كلمة بحث أو تصنيف مختلف.' : 'نجهّز قائمتنا الآن — ترقبونا قريبًا.'}
            action={hasFilters ? <button onClick={() => setParams({})} className="btn-secondary">عرض كل المنتجات</button> : undefined}
          />
        )}
      </div>
    </div>
  );
}
