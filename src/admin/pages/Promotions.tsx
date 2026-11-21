import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Plus, Pencil, Trash2, Ticket, Sparkles, Image as ImageIcon, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData, must } from '../useData';
import { PageHeader, Panel, Modal, Toggle, Empty, MoneyInput } from '../ui';
import { PageLoader, Spinner } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { formatSAR } from '../../../shared/money';
import { formatDateTimeAr } from '../../../shared/dates';
import { prepareImage, randomId } from '../../lib/image';
import { isoToLocalInput, localInputToIso } from '../dt';
import type { Banner, Category, Product } from '../../lib/types';

interface Promotion {
  id?: string; name: string; code: string | null; kind: 'percentage' | 'fixed'; value: number; applies_to: 'order' | 'products' | 'categories';
  product_ids: string[]; category_ids: string[]; exclude_sale_items: boolean; min_order_halalas: number; max_discount_halalas: number | null;
  max_uses: number | null; per_customer_limit: number | null; uses_count?: number; starts_at: string | null; ends_at: string | null; is_active: boolean;
}
const NEW_PROMO: Promotion = { name: '', code: '', kind: 'percentage', value: 10, applies_to: 'order', product_ids: [], category_ids: [], exclude_sale_items: true, min_order_halalas: 0, max_discount_halalas: null, max_uses: null, per_customer_limit: null, starts_at: null, ends_at: null, is_active: true };

function promoState(p: Promotion): { label: string; cls: string } {
  const now = Date.now();
  if (!p.is_active) return { label: 'متوقف', cls: 'bg-stone-100 text-stone-600' };
  if (p.starts_at && Date.parse(p.starts_at) > now) return { label: 'مجدول', cls: 'bg-sky-100 text-sky-900' };
  if (p.ends_at && Date.parse(p.ends_at) <= now) return { label: 'منتهي', cls: 'bg-stone-200 text-stone-700' };
  if (p.max_uses != null && (p.uses_count ?? 0) >= p.max_uses) return { label: 'مستنفد', cls: 'bg-amber-100 text-amber-900' };
  return { label: 'فعّال', cls: 'bg-emerald-100 text-emerald-900' };
}

function PromotionsTab() {
  const toast = useToast();
  const { data, loading, reload } = useData(async () => {
    const [p, prods, cats] = await Promise.all([
      supabase.from('promotions').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name_ar').eq('is_archived', false).order('sort_order'),
      supabase.from('categories').select('id, name_ar').order('sort_order'),
    ]);
    return { promos: must(p) as Promotion[], products: must(prods) as Pick<Product, 'id' | 'name_ar'>[], categories: must(cats) as Pick<Category, 'id' | 'name_ar'>[] };
  });
  const [edit, setEdit] = useState<(Promotion & { auto?: boolean }) | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!edit) return;
    const code = edit.auto ? null : (edit.code ?? '').trim().toUpperCase();
    if (!edit.name.trim()) return toast('error', 'اسم العرض مطلوب');
    if (!edit.auto && !/^[A-Z0-9_-]{3,30}$/.test(code ?? '')) return toast('error', 'الكود: 3-30 حرف إنجليزي أو رقم');
    if (edit.kind === 'percentage' && (edit.value < 1 || edit.value > 100)) return toast('error', 'النسبة بين 1 و 100');
    if (edit.value <= 0) return toast('error', 'قيمة الخصم مطلوبة');
    if (edit.applies_to === 'products' && !edit.product_ids.length) return toast('error', 'اختر منتجًا واحدًا على الأقل');
    if (edit.applies_to === 'categories' && !edit.category_ids.length) return toast('error', 'اختر تصنيفًا واحدًا على الأقل');
    setSaving(true);
    const { id, uses_count: _u, auto: _a, ...row } = edit;
    const payload = { ...row, code };
    const { error } = id ? await supabase.from('promotions').update(payload).eq('id', id) : await supabase.from('promotions').insert(payload);
    setSaving(false);
    if (error) return toast('error', error.message.includes('promotions_code_key') ? 'هذا الكود مستخدم' : `تعذر الحفظ: ${error.message}`);
    toast('success', 'تم الحفظ');
    setEdit(null);
    reload();
  };

  if (loading && !data) return <PageLoader />;
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setEdit({ ...NEW_PROMO })} className="btn-primary btn-sm"><Ticket className="h-4 w-4" /> كود خصم جديد</button>
        <button onClick={() => setEdit({ ...NEW_PROMO, code: null, auto: true, applies_to: 'products' })} className="btn-secondary btn-sm"><Sparkles className="h-4 w-4" /> عرض تلقائي (بدون كود)</button>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-espresso/55">يُطبق عرض واحد فقط لكل طلب (لا تجميع للخصومات). يتم التحقق من الكود والتواريخ وعدد الاستخدامات في الخادم عند إرسال الطلب.</p>
      <Panel padded={false}>
        {!data?.promos.length ? <Empty>لا توجد عروض بعد.</Empty> : (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead><tr><th>العرض</th><th>الخصم</th><th>ينطبق على</th><th>الاستخدام</th><th>الفترة</th><th>الحالة</th><th></th></tr></thead>
              <tbody>
                {data.promos.map((p) => {
                  const st = promoState(p);
                  return (
                    <tr key={p.id}>
                      <td><span className="font-medium">{p.name}</span><div className="ltr text-right text-xs font-semibold text-caramel-dark">{p.code ?? 'تلقائي'}</div></td>
                      <td className="whitespace-nowrap">{p.kind === 'percentage' ? `${p.value}%` : formatSAR(p.value)}</td>
                      <td className="text-xs">{p.applies_to === 'order' ? 'كل الطلب' : p.applies_to === 'products' ? `${p.product_ids.length} منتج` : `${p.category_ids.length} تصنيف`}{p.min_order_halalas > 0 && <div className="text-espresso/50">حد أدنى {formatSAR(p.min_order_halalas)}</div>}</td>
                      <td className="text-xs">{p.uses_count ?? 0}{p.max_uses != null && ` / ${p.max_uses}`}</td>
                      <td className="text-xs text-espresso/55">{p.starts_at ? formatDateTimeAr(p.starts_at) : 'الآن'} ← {p.ends_at ? formatDateTimeAr(p.ends_at) : 'مفتوح'}</td>
                      <td><span className={clsx('chip', st.cls)}>{st.label}</span></td>
                      <td className="whitespace-nowrap">
                        <button onClick={() => setEdit({ ...p, auto: p.code == null })} className="inline-grid h-8 w-8 place-items-center rounded-full hover:bg-cream-200" aria-label="تعديل"><Pencil className="h-4 w-4" /></button>
                        <button onClick={async () => { if (window.confirm('حذف العرض؟ (الطلبات السابقة تحتفظ بقيمة خصمها)')) { await supabase.from('promotions').delete().eq('id', p.id!); reload(); } }} className="inline-grid h-8 w-8 place-items-center rounded-full text-red-700/70 hover:bg-red-50" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal wide open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'تعديل العرض' : edit?.auto ? 'عرض تلقائي جديد' : 'كود خصم جديد'} footer={<><button onClick={() => setEdit(null)} className="btn-ghost btn-sm">إلغاء</button><button onClick={save} disabled={saving} className="btn-primary btn-sm">{saving && <Spinner className="h-4 w-4" />} حفظ</button></>}>
        {edit && data && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={edit.auto ? 'sm:col-span-2' : ''}><label className="label">اسم العرض (داخلي) *</label><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="مثال: عرض الافتتاح" /></div>
            {!edit.auto && <div><label className="label">الكود *</label><input dir="ltr" className="input uppercase" value={edit.code ?? ''} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} placeholder="DAFWA10" /></div>}
            <div>
              <label className="label">نوع الخصم</label>
              <select className="input" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as Promotion['kind'], value: e.target.value === 'percentage' ? 10 : 1000 })}>
                <option value="percentage">نسبة مئوية %</option>
                <option value="fixed">مبلغ ثابت (ر.س)</option>
              </select>
            </div>
            <div>
              <label className="label">القيمة *</label>
              {edit.kind === 'percentage' ? (
                <input type="number" min={1} max={100} className="input" value={edit.value} onChange={(e) => setEdit({ ...edit, value: parseInt(e.target.value) || 0 })} />
              ) : (
                <MoneyInput value={edit.value} onChange={(h) => setEdit({ ...edit, value: h ?? 0 })} />
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="label">ينطبق على</label>
              <div className="flex flex-wrap gap-2">
                {(['order', 'products', 'categories'] as const).map((a) => (
                  <button key={a} type="button" onClick={() => setEdit({ ...edit, applies_to: a })} className={clsx('rounded-full border px-4 py-2 text-sm', edit.applies_to === a ? 'border-cocoa bg-cocoa text-white' : 'border-cocoa/15')}>
                    {a === 'order' ? 'كل الطلب' : a === 'products' ? 'منتجات محددة' : 'تصنيفات محددة'}
                  </button>
                ))}
              </div>
            </div>
            {edit.applies_to !== 'order' && (
              <div className="max-h-48 overflow-y-auto rounded-2xl border border-cocoa/10 p-3 sm:col-span-2">
                {(edit.applies_to === 'products' ? data.products : data.categories).map((x) => {
                  const key = edit.applies_to === 'products' ? 'product_ids' : 'category_ids';
                  const on = edit[key].includes(x.id);
                  return (
                    <label key={x.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-cream-100">
                      <input type="checkbox" checked={on} className="accent-cocoa" onChange={() => setEdit({ ...edit, [key]: on ? edit[key].filter((i) => i !== x.id) : [...edit[key], x.id] })} />
                      {x.name_ar}
                    </label>
                  );
                })}
              </div>
            )}
            <div><label className="label">الحد الأدنى للطلب</label><MoneyInput value={edit.min_order_halalas} onChange={(h) => setEdit({ ...edit, min_order_halalas: h ?? 0 })} /></div>
            <div><label className="label">أقصى مبلغ خصم (اختياري)</label><MoneyInput allowEmpty value={edit.max_discount_halalas} onChange={(h) => setEdit({ ...edit, max_discount_halalas: h || null })} /></div>
            <div><label className="label">أقصى عدد استخدامات (إجمالي)</label><input type="number" min={0} className="input" placeholder="غير محدود" value={edit.max_uses ?? ''} onChange={(e) => setEdit({ ...edit, max_uses: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0) })} /></div>
            <div><label className="label">الحد لكل عميل (حسب الجوال)</label><input type="number" min={1} className="input" placeholder="غير محدود" value={edit.per_customer_limit ?? ''} onChange={(e) => setEdit({ ...edit, per_customer_limit: e.target.value === '' ? null : Math.max(1, parseInt(e.target.value) || 1) })} /></div>
            <div><label className="label">يبدأ في (توقيت مكة)</label><input type="datetime-local" className="input" value={isoToLocalInput(edit.starts_at)} onChange={(e) => setEdit({ ...edit, starts_at: localInputToIso(e.target.value) })} /></div>
            <div><label className="label">ينتهي في (توقيت مكة)</label><input type="datetime-local" className="input" value={isoToLocalInput(edit.ends_at)} onChange={(e) => setEdit({ ...edit, ends_at: localInputToIso(e.target.value) })} /></div>
            <div className="space-y-3 sm:col-span-2">
              <Toggle label="استثناء المنتجات المخفضة" description="لا يُطبق الخصم على منتجات لها سعر خصم مسبق (يمنع تجميع الخصومات)" checked={edit.exclude_sale_items} onChange={(v) => setEdit({ ...edit, exclude_sale_items: v })} />
              <Toggle label="مفعّل" checked={edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function BannersTab() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, loading, reload } = useData(async () => must(await supabase.from('banners').select('*').order('sort_order')) as Banner[]);
  const [edit, setEdit] = useState<Partial<Banner> | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (f: File | undefined) => {
    if (!f || !edit) return;
    setBusy(true);
    try {
      const { blob, ext, type } = await prepareImage(f, 1800);
      const path = `banners/${Date.now()}-${randomId(8)}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(path, blob, { contentType: type, cacheControl: '31536000' });
      if (error) throw new Error(error.message);
      setEdit({ ...edit, image_url: supabase.storage.from('site-assets').getPublicUrl(path).data.publicUrl });
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    if (!edit?.title?.trim()) return toast('error', 'العنوان مطلوب');
    setBusy(true);
    const { id, created_at: _c, updated_at: _u, ...row } = edit as Banner & { created_at?: string; updated_at?: string };
    const { error } = id ? await supabase.from('banners').update(row).eq('id', id) : await supabase.from('banners').insert(row);
    setBusy(false);
    if (error) return toast('error', 'تعذر الحفظ');
    setEdit(null);
    reload();
  };

  if (loading && !data) return <PageLoader />;
  return (
    <>
      <button onClick={() => setEdit({ title: '', is_active: true, sort_order: (data?.length ?? 0) * 10 })} className="btn-primary btn-sm mb-4"><Plus className="h-4 w-4" /> بانر جديد</button>
      {!data?.length ? <Panel><Empty>لا توجد بانرات. البانرات تظهر في الصفحة الرئيسية أسفل الواجهة.</Empty></Panel> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-3xl border border-cocoa/10 bg-white shadow-soft">
              <div className="relative aspect-[16/7] bg-cocoa">
                {b.image_url && <img src={b.image_url} alt="" className="h-full w-full object-cover opacity-80" />}
                <div className="absolute inset-0 flex flex-col justify-center p-5 text-white"><p className="text-lg font-semibold">{b.title}</p>{b.subtitle && <p className="text-sm opacity-80">{b.subtitle}</p>}</div>
              </div>
              <div className="flex items-center justify-between p-3 text-xs">
                <span className={clsx('chip', b.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-600')}>{b.is_active ? 'ظاهر' : 'مخفي'}</span>
                <span className="text-espresso/50">{b.ends_at ? `حتى ${formatDateTimeAr(b.ends_at)}` : ''}</span>
                <div>
                  <button onClick={() => setEdit(b)} className="inline-grid h-8 w-8 place-items-center rounded-full hover:bg-cream-200" aria-label="تعديل"><Pencil className="h-4 w-4" /></button>
                  <button onClick={async () => { if (window.confirm('حذف البانر؟')) { await supabase.from('banners').delete().eq('id', b.id); reload(); } }} className="inline-grid h-8 w-8 place-items-center rounded-full text-red-700/70 hover:bg-red-50" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'تعديل البانر' : 'بانر جديد'} footer={<><button onClick={() => setEdit(null)} className="btn-ghost btn-sm">إلغاء</button><button onClick={save} disabled={busy} className="btn-primary btn-sm">{busy && <Spinner className="h-4 w-4" />} حفظ</button></>}>
        {edit && (
          <div className="space-y-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} className="relative flex aspect-[16/7] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-cocoa/20 bg-cream-100 text-sm text-espresso/55">
              {edit.image_url ? <img src={edit.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> صورة البانر (اختياري)</span>}
              {busy && <span className="absolute inset-0 grid place-items-center bg-white/60"><Spinner /></span>}
              {edit.image_url && <span className="absolute bottom-2 left-2 chip bg-white/90"><Upload className="h-3 w-3" /> تغيير</span>}
            </button>
            {edit.image_url && <button type="button" className="text-xs text-red-700" onClick={() => setEdit({ ...edit, image_url: null })}>إزالة الصورة</button>}
            <div><label className="label">العنوان *</label><input className="input" value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
            <div><label className="label">النص الفرعي</label><input className="input" value={edit.subtitle ?? ''} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value || null })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">نص الزر</label><input className="input" value={edit.cta_label ?? ''} onChange={(e) => setEdit({ ...edit, cta_label: e.target.value || null })} placeholder="تسوق الآن" /></div>
              <div><label className="label">الرابط</label><input dir="ltr" className="input" value={edit.link_url ?? ''} onChange={(e) => setEdit({ ...edit, link_url: e.target.value || null })} placeholder="/shop" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">يبدأ</label><input type="datetime-local" className="input" value={isoToLocalInput(edit.starts_at ?? null)} onChange={(e) => setEdit({ ...edit, starts_at: localInputToIso(e.target.value) })} /></div>
              <div><label className="label">ينتهي</label><input type="datetime-local" className="input" value={isoToLocalInput(edit.ends_at ?? null)} onChange={(e) => setEdit({ ...edit, ends_at: localInputToIso(e.target.value) })} /></div>
            </div>
            <Toggle label="ظاهر" checked={edit.is_active ?? true} onChange={(v) => setEdit({ ...edit, is_active: v })} />
          </div>
        )}
      </Modal>
    </>
  );
}

export default function Promotions() {
  const [tab, setTab] = useState<'promos' | 'banners'>('promos');
  return (
    <div>
      <PageHeader title="العروض والخصومات" subtitle="أكواد الخصم، العروض التلقائية، وبانرات الصفحة الرئيسية" />
      <div className="mb-6 flex w-fit rounded-full bg-cream-200 p-1 text-sm">
        <button onClick={() => setTab('promos')} className={clsx('rounded-full px-5 py-2', tab === 'promos' ? 'bg-white font-semibold shadow-sm' : 'text-espresso/60')}>الخصومات</button>
        <button onClick={() => setTab('banners')} className={clsx('rounded-full px-5 py-2', tab === 'banners' ? 'bg-white font-semibold shadow-sm' : 'text-espresso/60')}>البانرات</button>
      </div>
      {tab === 'promos' ? <PromotionsTab /> : <BannersTab />}
    </div>
  );
}
