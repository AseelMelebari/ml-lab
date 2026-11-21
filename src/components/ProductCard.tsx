import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import type { Product } from '../lib/types';
import { isSoldOut, productPricing } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Price } from './ui';
import { ProductPlaceholder } from './CookieArt';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add, setDrawerOpen } = useCart();
  const toast = useToast();
  const [added, setAdded] = useState(false);
  const { price, compareAt, fromVariants } = productPricing(product);
  const soldOut = isSoldOut(product);
  const needsOptions = (product.variants?.length ?? 0) > 0;
  const img = product.images?.[0];
  const img2 = product.images?.[1];
  const discount = compareAt ? Math.round((1 - price / compareAt) * 100) : 0;

  const quickAdd = () => {
    add({
      product_id: product.id,
      variant_id: null,
      quantity: product.min_quantity,
      notes: null,
      name: product.name_ar,
      variant_name: null,
      slug: product.slug,
      image: img?.url ?? null,
      unit_price_halalas: price,
      min_quantity: product.min_quantity,
      max_quantity: product.max_quantity,
    });
    setAdded(true);
    toast('success', `تمت إضافة «${product.name_ar}» للسلة`);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="group relative flex animate-fade-up flex-col" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden rounded-[28px] bg-cream-200 shadow-inset" aria-label={product.name_ar}>
        <div className="aspect-[4/5]">
          {img ? (
            <>
              <img src={img.url} alt={img.alt || product.name_ar} loading="lazy" decoding="async" className={clsx('absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]', img2 && 'group-hover:opacity-0')} />
              {img2 && <img src={img2.url} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100" />}
            </>
          ) : (
            <ProductPlaceholder className="absolute inset-0 transition duration-700 group-hover:scale-[1.04]" seed={index} />
          )}
        </div>
        <div className="absolute right-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut && <span className="chip bg-espresso/85 text-cream-50 backdrop-blur">نفدت الكمية</span>}
          {!soldOut && discount > 0 && <span className="chip bg-caramel text-white">خصم {discount}%</span>}
          {!soldOut && product.is_bestseller && <span className="chip bg-white/85 text-cocoa backdrop-blur">الأكثر طلبًا</span>}
        </div>
      </Link>
      <div className="flex items-start justify-between gap-3 px-1 pt-4">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold leading-snug">
            <Link to={`/product/${product.slug}`} className="hover:text-cocoa">{product.name_ar}</Link>
          </h3>
          {product.name_en && <p className="mt-0.5 font-latin text-sm italic text-espresso/45">{product.name_en}</p>}
          <Price className="mt-2" value={price} compareAt={compareAt} from={fromVariants} />
        </div>
        {!soldOut &&
          (needsOptions ? (
            <Link to={`/product/${product.slug}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-cocoa/15 bg-white text-cocoa transition hover:border-cocoa hover:bg-cocoa hover:text-white" aria-label={`اختيار خيارات ${product.name_ar}`}>
              <Plus className="h-5 w-5" />
            </Link>
          ) : (
            <button
              onClick={quickAdd}
              onDoubleClick={() => setDrawerOpen(true)}
              className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-full border transition', added ? 'border-cocoa bg-cocoa text-white' : 'border-cocoa/15 bg-white text-cocoa hover:border-cocoa hover:bg-cocoa hover:text-white')}
              aria-label={`أضف ${product.name_ar} للسلة`}
            >
              {added ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </button>
          ))}
      </div>
    </article>
  );
}
