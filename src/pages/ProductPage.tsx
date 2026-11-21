import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronLeft, ShoppingBag, Clock, MapPin, MessageCircle, AlertTriangle, Leaf } from 'lucide-react';
import { fetchProduct, isSoldOut, variantPrice } from '../lib/api';
import type { Product } from '../lib/types';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useSeo } from '../lib/seo';
import { PageLoader, Price, QuantityStepper, EmptyState } from '../components/ui';
import { ProductPlaceholder } from '../components/CookieArt';
import { ProductCard } from '../components/ProductCard';

export default function ProductPage() {
  const { slug = '' } = useParams();
  const { products } = useStore();
  const { add, setDrawerOpen } = useCart();
  const toast = useToast();
  const nav = useNavigate();
  const cached = products.find((p) => p.slug === slug);
  const [product, setProduct] = useState<Product | null | undefined>(cached);
  const [imgIdx, setImgIdx] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let alive = true;
    setImgIdx(0);
    fetchProduct(slug)
      .then((p) => alive && setProduct(p))
      .catch(() => alive && setProduct((c) => c ?? null));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    setQty(product.min_quantity);
    const firstAvail = product.variants?.find((v) => v.is_available && (v.stock_quantity == null || v.stock_quantity > 0));
    setVariantId(firstAvail?.id ?? null);
  }, [product]);

  const site = (import.meta.env.VITE_SITE_URL as string | undefined) ?? '';
  useSeo({
    title: product?.seo_title || product?.name_ar,
    description: product?.seo_description || product?.short_description || undefined,
    image: product?.images?.[0]?.url,
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name_ar,
          description: product.short_description || product.description || undefined,
          image: product.images?.map((i) => i.url),
          brand: { '@type': 'Brand', name: 'دَفوة DAFWA' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'SAR',
            price: (variantPrice(product, null).price / 100).toFixed(2),
            availability: isSoldOut(product) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            url: `${site}/product/${product.slug}`,
            areaServed: 'مكة المكرمة',
          },
        }
      : null,
  });

  const related = useMemo(
    () => (product ? products.filter((p) => p.id !== product.id && (p.category_id === product.category_id || p.is_featured)).slice(0, 4) : []),
    [products, product],
  );

  if (product === undefined) return <PageLoader />;
  if (product === null)
    return (
      <div className="container-x py-20">
        <EmptyState title="المنتج غير موجود" text="يمكن أن يكون المنتج غير متاح حاليًا." action={<Link to="/shop" className="btn-primary">العودة للمتجر</Link>} />
      </div>
    );

  const images = product.images ?? [];
  const variants = product.variants ?? [];
  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;
  const { price, compareAt } = variantPrice(product, variantId);
  const soldOut = isSoldOut(product) || (selectedVariant != null && (!selectedVariant.is_available || (selectedVariant.stock_quantity != null && selectedVariant.stock_quantity <= 0)));
  const maxQty = Math.min(product.max_quantity, product.stock_quantity ?? Infinity, selectedVariant?.stock_quantity ?? Infinity);
  const needsVariant = variants.length > 0 && !variantId;

  const addToCart = (goCheckout = false) => {
    if (needsVariant) return toast('error', 'فضلًا اختر الحجم أو النوع.');
    add({
      product_id: product.id,
      variant_id: variantId,
      quantity: qty,
      notes: product.allow_notes && notes.trim() ? notes.trim() : null,
      name: product.name_ar,
      variant_name: selectedVariant?.name_ar ?? null,
      slug: product.slug,
      image: images[0]?.url ?? null,
      unit_price_halalas: price,
      min_quantity: product.min_quantity,
      max_quantity: Number.isFinite(maxQty) ? maxQty : product.max_quantity,
    });
    if (goCheckout) nav('/checkout');
    else {
      toast('success', `تمت إضافة «${product.name_ar}» للسلة`);
      setDrawerOpen(true);
    }
  };

  return (
    <div className="container-x py-8 sm:py-12">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-espresso/55" aria-label="مسار التنقل">
        <Link to="/" className="hover:text-cocoa">الرئيسية</Link>
        <ChevronLeft className="h-4 w-4" />
        <Link to="/shop" className="hover:text-cocoa">المتجر</Link>
        {product.category && (
          <>
            <ChevronLeft className="h-4 w-4" />
            <Link to={`/shop?category=${product.category.slug}`} className="hover:text-cocoa">{product.category.name_ar}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative aspect-square overflow-hidden rounded-[32px] bg-cream-200 shadow-inset">
            {images.length ? (
              <img key={images[imgIdx]?.id} src={images[imgIdx]?.url} alt={images[imgIdx]?.alt || product.name_ar} className="h-full w-full animate-fade-up object-cover [animation-duration:.4s]" fetchPriority="high" />
            ) : (
              <ProductPlaceholder className="h-full w-full" seed={2} />
            )}
          </div>
          {images.length > 1 && (
            <div className="scrollbar-none mt-4 flex gap-3 overflow-x-auto">
              {images.map((im, i) => (
                <button key={im.id} onClick={() => setImgIdx(i)} className={clsx('h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition', i === imgIdx ? 'border-cocoa' : 'border-transparent opacity-70 hover:opacity-100')} aria-label={`صورة ${i + 1}`}>
                  <img src={im.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && <p className="mb-2 text-sm font-medium text-caramel">{product.category.name_ar}</p>}
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{product.name_ar}</h1>
          {product.name_en && <p className="mt-1 font-latin text-lg italic text-espresso/45">{product.name_en}</p>}
          <div className="mt-5 flex items-center gap-3">
            <Price value={price} compareAt={compareAt} size="lg" />
            {soldOut ? <span className="chip bg-espresso text-cream-50">نفدت الكمية</span> : <span className="chip bg-sage/15 text-sage">متوفر</span>}
          </div>
          {product.short_description && <p className="mt-6 text-lg leading-loose text-espresso/75">{product.short_description}</p>}

          {variants.length > 0 && (
            <fieldset className="mt-8">
              <legend className="label">اختر الحجم / النوع</legend>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const unavailable = !v.is_available || (v.stock_quantity != null && v.stock_quantity <= 0);
                  const vp = variantPrice(product, v.id).price;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={unavailable}
                      onClick={() => setVariantId(v.id)}
                      aria-pressed={variantId === v.id}
                      className={clsx(
                        'rounded-2xl border px-4 py-3 text-right transition disabled:cursor-not-allowed disabled:opacity-40',
                        variantId === v.id ? 'border-cocoa bg-cocoa text-white shadow-soft' : 'border-cocoa/15 bg-white hover:border-cocoa/40',
                      )}
                    >
                      <span className="block font-semibold">{v.name_ar}</span>
                      <span className={clsx('text-sm', variantId === v.id ? 'text-cream-200' : 'text-espresso/55')}>{unavailable ? 'غير متاح' : `${(vp / 100).toFixed(vp % 100 ? 2 : 0)} ر.س`}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {product.allow_notes && (
            <div className="mt-6">
              <label htmlFor="notes" className="label">ملاحظات على المنتج (اختياري)</label>
              <textarea id="notes" rows={2} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} className="input resize-none" placeholder="مثال: عبارة على البطاقة…" />
            </div>
          )}

          {!soldOut && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <QuantityStepper value={qty} min={product.min_quantity} max={Number.isFinite(maxQty) ? maxQty : 99} onChange={setQty} />
              <button onClick={() => addToCart(false)} className="btn-primary flex-1 py-3.5 text-base sm:flex-none sm:px-10">
                <ShoppingBag className="h-5 w-5" /> أضف للسلة
              </button>
              <button onClick={() => addToCart(true)} className="btn-secondary w-full py-3.5 sm:w-auto">اطلب الآن</button>
            </div>
          )}
          {product.min_quantity > 1 && <p className="hint mt-3">الحد الأدنى للطلب {product.min_quantity} قطع.</p>}

          <ul className="mt-8 grid gap-2 rounded-3xl bg-cream-100 p-5 text-sm text-espresso/75">
            <li className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-caramel" /> التوصيل داخل مكة المكرمة فقط</li>
            <li className="flex items-center gap-2.5"><Clock className="h-4 w-4 text-caramel" /> الطلب قبل موعد التسليم بـ 24 ساعة على الأقل</li>
            <li className="flex items-center gap-2.5"><MessageCircle className="h-4 w-4 text-caramel" /> الدفع والتأكيد عبر واتساب</li>
          </ul>

          <div className="mt-8 divide-y divide-cocoa/10 border-y border-cocoa/10">
            {product.description && (
              <details className="group py-5" open>
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
                  الوصف <ChevronLeft className="h-4 w-4 transition group-open:-rotate-90" />
                </summary>
                <p className="mt-3 whitespace-pre-line leading-loose text-espresso/70">{product.description}</p>
              </details>
            )}
            {product.show_ingredients && product.ingredients && (
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2"><Leaf className="h-4 w-4 text-sage" /> المكونات</span>
                  <ChevronLeft className="h-4 w-4 transition group-open:-rotate-90" />
                </summary>
                <p className="mt-3 whitespace-pre-line leading-loose text-espresso/70">{product.ingredients}</p>
              </details>
            )}
            {product.show_allergens && product.allergens && (
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-caramel-dark" /> معلومات الحساسية</span>
                  <ChevronLeft className="h-4 w-4 transition group-open:-rotate-90" />
                </summary>
                <p className="mt-3 whitespace-pre-line leading-loose text-espresso/70">{product.allergens}</p>
              </details>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 text-2xl font-semibold">قد يعجبك أيضًا</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
