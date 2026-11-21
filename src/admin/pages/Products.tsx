import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Plus, Search, Star, ArrowUp, ArrowDown, Archive, ArchiveRestore, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData, must } from '../useData';
import { PageHeader, Panel, Empty, Toggle } from '../ui';
import { PageLoader } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { formatSAR } from '../../../shared/money';
import type { Product } from '../../lib/types';

export default function Products() {
  const toast = useToast();
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [q, setQ] = useState('');
  const { data, loading, reload, setData } = useData(async () =>
    must(await supabase.from('products').select('*, images:product_images(url, sort_order), category:categories(id, name_ar, slug), variants:product_variants(id)').order('sort_order').order('created_at', { ascending: false })) as Product[],
  );

  const list = useMemo(
    () => (data ?? []).filter((p) => (view === 'archived' ? p.is_archived : !p.is_archived) && (!q || `${p.name_ar} ${p.name_en ?? ''}`.toLowerCase().includes(q.toLowerCase()))),
    [data, view, q],
  );

  const patch = async (p: Product, changes: Partial<Product>, msg = 'تم الحفظ') => {
    setData((d) => d?.map((x) => (x.id === p.id ? { ...x, ...changes } : x)) ?? null);
    const { error } = await supabase.from('products').update(changes).eq('id', p.id);
    if (error) {
      toast('error', 'تعذر الحفظ');
      reload();
    } else toast('success', msg);
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = list[idx], b = list[idx + dir];
    if (!a || !b) return;
    // Normalise ordering for the visible list, then swap
    const ordered = [...list];
    ordered[idx] = b;
    ordered[idx + dir] = a;
    const updates = ordered.map((p, i) => ({ id: p.id, sort_order: (i + 1) * 10 }));
    setData((d) => d?.map((x) => ({ ...x, sort_order: updates.find((u) => u.id === x.id)?.sort_order ?? x.sort_order })).sort((x, y) => x.sort_order - y.sort_order) ?? null);
    await Promise.all(updates.map((u) => supabase.from('products').update({ sort_order: u.sort_order }).eq('id', u.id)));
  };

  if (loading && !data) return <PageLoader />;

  return (
    <div>
      <PageHeader title="المنتجات" subtitle="أي تعديل يظهر في المتجر مباشرة بدون إعادة نشر" actions={<Link to="/admin/products/new" className="btn-primary btn-sm"><Plus className="h-4 w-4" /> منتج جديد</Link>} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full bg-cream-200 p-1 text-sm">
          {(['active', 'archived'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={clsx('rounded-full px-4 py-1.5 transition', view === v ? 'bg-white font-semibold shadow-sm' : 'text-espresso/60')}>
              {v === 'active' ? 'المنتجات' : 'الأرشيف'}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث…" className="input py-2.5 ps-10 text-sm" aria-label="بحث في المنتجات" />
        </div>
      </div>

      <Panel padded={false}>
        {list.length === 0 ? (
          <Empty>{view === 'active' ? <>لا توجد منتجات بعد. <Link to="/admin/products/new" className="font-semibold text-cocoa underline">أضف أول منتج</Link></> : 'الأرشيف فارغ.'}</Empty>
        ) : (
          <ul className="divide-y divide-cocoa/5">
            {list.map((p, i) => {
              const img = [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:flex-nowrap sm:px-5">
                  <div className="flex flex-col">
                    <button onClick={() => move(i, -1)} disabled={i === 0 || !!q} className="text-espresso/30 hover:text-cocoa disabled:opacity-20" aria-label="تحريك لأعلى"><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === list.length - 1 || !!q} className="text-espresso/30 hover:text-cocoa disabled:opacity-20" aria-label="تحريك لأسفل"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                  <Link to={`/admin/products/${p.id}`} className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream-200 text-espresso/30">
                    {img ? <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" /> : <ImageIcon className="h-6 w-6" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/products/${p.id}`} className="font-semibold hover:text-cocoa">{p.name_ar}</Link>
                    <p className="text-xs text-espresso/50">
                      {p.category?.name_ar ?? 'بدون تصنيف'} · {formatSAR(p.sale_price_halalas ?? p.price_halalas)}
                      {p.sale_price_halalas && <s className="ms-1">{formatSAR(p.price_halalas)}</s>}
                      {(p.variants?.length ?? 0) > 0 && ` · ${p.variants!.length} خيارات`}
                      {p.stock_quantity != null && ` · المخزون ${p.stock_quantity}`}
                      {!p.is_active && ' · مخفي'}
                    </p>
                  </div>
                  {!p.is_archived ? (
                    <div className="flex items-center gap-4">
                      <div className="w-36"><Toggle label="متوفر" checked={p.is_available} onChange={(v) => patch(p, { is_available: v })} /></div>
                      <button onClick={() => patch(p, { is_featured: !p.is_featured })} className={clsx('grid h-9 w-9 place-items-center rounded-full transition', p.is_featured ? 'bg-caramel/15 text-caramel-dark' : 'text-espresso/25 hover:text-caramel')} title="منتج مميز" aria-pressed={p.is_featured}>
                        <Star className={clsx('h-5 w-5', p.is_featured && 'fill-current')} />
                      </button>
                      <button onClick={() => window.confirm('نقل المنتج للأرشيف؟ سيختفي من المتجر وتبقى الطلبات السابقة كما هي.') && patch(p, { is_archived: true, is_featured: false }, 'تم نقل المنتج للأرشيف')} className="grid h-9 w-9 place-items-center rounded-full text-espresso/40 hover:bg-cream-200 hover:text-cocoa" title="أرشفة"><Archive className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => patch(p, { is_archived: false }, 'تمت الاستعادة')} className="btn-secondary btn-sm"><ArchiveRestore className="h-4 w-4" /> استعادة</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
