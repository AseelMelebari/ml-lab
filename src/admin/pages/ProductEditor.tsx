import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, ImagePlus, Trash2, ArrowUp, ArrowDown, Plus, RefreshCw, Save, ExternalLink, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { prepareImage, randomId, slugify } from '../../lib/image';
import { PageHeader, Panel, Toggle, MoneyInput } from '../ui';
import { PageLoader, Spinner } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import type { Category, Product, ProductImage, ProductVariant } from '../../lib/types';

type ImgDraft = Omit<ProductImage, 'id' | 'product_id'> & { id?: string; uploading?: boolean; replacedPath?: string };
type VarDraft = Omit<ProductVariant, 'id' | 'product_id'> & { id?: string; key: string };

const EMPTY: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
  slug: '', name_ar: '', name_en: null, short_description: null, description: null, category_id: null,
  price_halalas: 0, sale_price_halalas: null, is_active: true, is_archived: false, is_available: true, is_featured: false, is_bestseller: false,
  stock_quantity: null, ingredients: null, allergens: null, show_ingredients: true, show_allergens: true, allow_notes: false,
  min_quantity: 1, max_quantity: 50, sort_order: 0, seo_title: null, seo_description: null,
};

const BUCKET = 'product-images';

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceIdx = useRef<number>(-1);
  const [productId] = useState(() => id ?? crypto.randomUUID());
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState<ImgDraft[]>([]);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [variants, setVariants] = useState<VarDraft[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [trackStock, setTrackStock] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories((data as Category[]) ?? []));
    if (isNew) return;
    supabase
      .from('products')
      .select('*, images:product_images(*), variants:product_variants(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast('error', 'المنتج غير موجود');
          nav('/admin/products');
          return;
        }
        const { images: imgs, variants: vars, id: _i, created_at: _c, updated_at: _u, ...rest } = data as Product;
        setForm(rest);
        setTrackStock(rest.stock_quantity != null);
        setImages([...(imgs ?? [])].sort((a, b) => a.sort_order - b.sort_order));
        setVariants([...(vars ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((v) => ({ ...v, key: v.id })));
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const upload = async (file: File): Promise<{ storage_path: string; url: string }> => {
    const { blob, ext, type } = await prepareImage(file);
    const path = `products/${productId}/${Date.now()}-${randomId(8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { storage_path: path, url: data.publicUrl };
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 10);
    const start = images.length;
    setImages((imgs) => [...imgs, ...list.map((f, i) => ({ storage_path: '', url: URL.createObjectURL(f), alt: null, sort_order: start + i, uploading: true }))]);
    await Promise.all(
      list.map(async (f, i) => {
        try {
          const r = await upload(f);
          setImages((imgs) => imgs.map((im, j) => (j === start + i ? { ...im, ...r, uploading: false } : im)));
        } catch (e) {
          toast('error', (e as Error).message);
          setImages((imgs) => imgs.map((im, j) => (j === start + i ? { ...im, url: '', uploading: false } : im)));
        }
      }),
    );
    setImages((imgs) => imgs.filter((im) => im.url && (im.storage_path || im.uploading)));
    if (fileRef.current) fileRef.current.value = '';
  };

  const onReplace = async (files: FileList | null) => {
    const idx = replaceIdx.current;
    if (!files?.[0] || idx < 0) return;
    const old = images[idx];
    setImages((imgs) => imgs.map((im, j) => (j === idx ? { ...im, uploading: true } : im)));
    try {
      const r = await upload(files[0]);
      setImages((imgs) => imgs.map((im, j) => (j === idx ? { ...im, ...r, uploading: false, replacedPath: old.storage_path } : im)));
      if (old.storage_path) setRemovedPaths((p) => [...p, old.storage_path]);
    } catch (e) {
      toast('error', (e as Error).message);
      setImages((imgs) => imgs.map((im, j) => (j === idx ? { ...im, uploading: false } : im)));
    }
    if (replaceRef.current) replaceRef.current.value = '';
  };

  const moveImg = (i: number, d: -1 | 1) =>
    setImages((imgs) => {
      const n = [...imgs];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });

  const removeImg = (i: number) => {
    const im = images[i];
    if (im.storage_path) setRemovedPaths((p) => [...p, im.storage_path]);
    setImages((imgs) => imgs.filter((_, j) => j !== i));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name_ar.trim()) e.name_ar = 'اسم المنتج مطلوب';
    if (!/^[a-z0-9-]{1,100}$/.test(form.slug)) e.slug = 'الرابط يجب أن يحتوي حروف إنجليزية صغيرة وأرقام وشرطات فقط';
    if (!form.price_halalas || form.price_halalas <= 0) e.price = 'السعر مطلوب';
    if (form.sale_price_halalas != null && form.sale_price_halalas >= form.price_halalas) e.sale = 'سعر الخصم يجب أن يكون أقل من السعر الأساسي';
    if (form.max_quantity < form.min_quantity) e.qty = 'الحد الأقصى يجب أن يكون أكبر من الحد الأدنى';
    variants.forEach((v, i) => {
      if (!v.name_ar.trim()) e[`v${i}`] = 'اسم الخيار مطلوب';
      if (v.sale_price_halalas != null && v.price_halalas != null && v.sale_price_halalas >= v.price_halalas) e[`v${i}`] = 'سعر الخصم يجب أن يكون أقل من السعر';
    });
    if (images.some((i) => i.uploading)) e.images = 'انتظر انتهاء رفع الصور';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return toast('error', 'فضلًا راجع الحقول المطلوبة');
    setSaving(true);
    try {
      const payload = { ...form, stock_quantity: trackStock ? form.stock_quantity ?? 0 : null, name_en: form.name_en?.trim() || null };
      const { error } = isNew
        ? await supabase.from('products').insert({ id: productId, ...payload })
        : await supabase.from('products').update(payload).eq('id', productId);
      if (error) throw new Error(error.message.includes('products_slug_key') ? 'الرابط مستخدم لمنتج آخر' : error.message);

      // Images: sync rows with the edited list
      const { data: existingImgs } = await supabase.from('product_images').select('id').eq('product_id', productId);
      const keepIds = new Set(images.filter((i) => i.id).map((i) => i.id));
      const toDelete = (existingImgs ?? []).filter((r) => !keepIds.has(r.id)).map((r) => r.id);
      if (toDelete.length) await supabase.from('product_images').delete().in('id', toDelete);
      for (const [i, im] of images.entries()) {
        const row = { product_id: productId, storage_path: im.storage_path, url: im.url, alt: im.alt || form.name_ar, sort_order: i };
        const r = im.id ? await supabase.from('product_images').update(row).eq('id', im.id) : await supabase.from('product_images').insert(row);
        if (r.error) throw new Error(r.error.message);
      }
      if (removedPaths.length) await supabase.storage.from(BUCKET).remove(removedPaths);

      // Variants
      const { data: existingVars } = await supabase.from('product_variants').select('id').eq('product_id', productId);
      const keepVars = new Set(variants.filter((v) => v.id).map((v) => v.id));
      const delVars = (existingVars ?? []).filter((r) => !keepVars.has(r.id)).map((r) => r.id);
      if (delVars.length) await supabase.from('product_variants').delete().in('id', delVars);
      for (const [i, v] of variants.entries()) {
        const { key: _k, id: vid, ...rest } = v;
        const row = { ...rest, product_id: productId, sort_order: i, name_en: rest.name_en || null };
        const r = vid ? await supabase.from('product_variants').update(row).eq('id', vid) : await supabase.from('product_variants').insert(row);
        if (r.error) throw new Error(r.error.message);
      }

      toast('success', 'تم حفظ المنتج — التغييرات ظاهرة في المتجر الآن');
      setRemovedPaths([]);
      if (isNew) nav(`/admin/products/${productId}`, { replace: true });
      else {
        // refresh ids of newly inserted rows
        const { data } = await supabase.from('products').select('images:product_images(*), variants:product_variants(*)').eq('id', productId).single();
        if (data) {
          setImages([...(data.images as ProductImage[])].sort((a, b) => a.sort_order - b.sort_order));
          setVariants([...(data.variants as ProductVariant[])].sort((a, b) => a.sort_order - b.sort_order).map((v) => ({ ...v, key: v.id })));
        }
      }
    } catch (e) {
      toast('error', `تعذر الحفظ: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="pb-24">
      <Link to="/admin/products" className="mb-4 inline-flex items-center gap-1 text-sm text-espresso/60 hover:text-cocoa"><ArrowRight className="h-4 w-4" /> المنتجات</Link>
      <PageHeader
        title={isNew ? 'منتج جديد' : form.name_ar || 'تعديل المنتج'}
        actions={
          <>
            {!isNew && form.is_active && !form.is_archived && <a href={`/product/${form.slug}`} target="_blank" className="btn-ghost btn-sm"><ExternalLink className="h-4 w-4" /> عرض في المتجر</a>}
            <button onClick={save} disabled={saving} className="btn-primary btn-sm">{saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} حفظ</button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="المعلومات الأساسية">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="name_ar">اسم المنتج (عربي) *</label>
                <input id="name_ar" className={clsx('input', errors.name_ar && 'input-error')} value={form.name_ar} onChange={(e) => set('name_ar', e.target.value)} />
                {errors.name_ar && <p className="field-error">{errors.name_ar}</p>}
              </div>
              <div>
                <label className="label" htmlFor="name_en">الاسم بالإنجليزي (اختياري)</label>
                <input
                  id="name_en"
                  dir="ltr"
                  className="input"
                  value={form.name_en ?? ''}
                  onChange={(e) => {
                    set('name_en', e.target.value);
                    if (!slugTouched) set('slug', slugify(e.target.value));
                  }}
                />
              </div>
              <div>
                <label className="label" htmlFor="slug">رابط المنتج *</label>
                <input id="slug" dir="ltr" className={clsx('input', errors.slug && 'input-error')} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); }} placeholder="chocolate-chip" />
                {errors.slug ? <p className="field-error">{errors.slug}</p> : <p className="hint ltr text-right">/product/{form.slug || '…'}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="cat">التصنيف</label>
                <select id="cat" className="input" value={form.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)}>
                  <option value="">بدون تصنيف</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="short">وصف مختصر</label>
                <input id="short" maxLength={300} className="input" value={form.short_description ?? ''} onChange={(e) => set('short_description', e.target.value || null)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="desc">الوصف الكامل</label>
                <textarea id="desc" rows={5} maxLength={5000} className="input" value={form.description ?? ''} onChange={(e) => set('description', e.target.value || null)} />
              </div>
            </div>
          </Panel>

          <Panel title="الصور" actions={<span className="text-xs text-espresso/50">JPG / PNG / WebP — حتى 8MB، تُحسّن تلقائيًا</span>}>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <input ref={replaceRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" className="hidden" onChange={(e) => onReplace(e.target.files)} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((im, i) => (
                <div key={im.storage_path || im.url} className="group relative overflow-hidden rounded-2xl border border-cocoa/10 bg-cream-100">
                  <div className="aspect-square">
                    <img src={im.url} alt="" className={clsx('h-full w-full object-cover', im.uploading && 'opacity-40')} />
                    {im.uploading && <div className="absolute inset-0 grid place-items-center"><Spinner className="h-6 w-6 text-cocoa" /></div>}
                  </div>
                  {i === 0 && <span className="chip absolute right-2 top-2 bg-cocoa text-white">الرئيسية</span>}
                  <div className="flex items-center justify-between gap-1 border-t border-cocoa/10 bg-white p-1.5">
                    <div className="flex">
                      <button type="button" onClick={() => moveImg(i, -1)} disabled={i === 0} className="grid h-8 w-8 place-items-center rounded-lg text-espresso/50 hover:bg-cream-200 disabled:opacity-25" aria-label="تقديم"><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" onClick={() => moveImg(i, 1)} disabled={i === images.length - 1} className="grid h-8 w-8 place-items-center rounded-lg text-espresso/50 hover:bg-cream-200 disabled:opacity-25" aria-label="تأخير"><ArrowDown className="h-4 w-4" /></button>
                    </div>
                    <div className="flex">
                      <button type="button" onClick={() => { replaceIdx.current = i; replaceRef.current?.click(); }} className="grid h-8 w-8 place-items-center rounded-lg text-espresso/50 hover:bg-cream-200" aria-label="استبدال" title="استبدال الصورة"><RefreshCw className="h-4 w-4" /></button>
                      <button type="button" onClick={() => removeImg(i)} className="grid h-8 w-8 place-items-center rounded-lg text-red-700/70 hover:bg-red-50" aria-label="حذف" title="حذف"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cocoa/20 text-espresso/50 transition hover:border-cocoa/40 hover:bg-cream-100 hover:text-cocoa">
                <ImagePlus className="h-7 w-7" />
                <span className="text-sm font-medium">إضافة صور</span>
              </button>
            </div>
            {errors.images && <p className="field-error">{errors.images}</p>}
            <p className="hint mt-3">الصورة الأولى تظهر كصورة رئيسية. التغييرات على الصور تُحفظ عند الضغط على «حفظ».</p>
          </Panel>

          <Panel title="الخيارات (الأحجام / الأنواع)" actions={<button type="button" onClick={() => setVariants((v) => [...v, { key: randomId(6), name_ar: '', name_en: null, price_halalas: null, sale_price_halalas: null, is_available: true, stock_quantity: null, sort_order: v.length }])} className="btn-ghost btn-sm"><Plus className="h-4 w-4" /> إضافة خيار</button>}>
            {variants.length === 0 ? (
              <p className="text-sm text-espresso/55">بدون خيارات — يُباع المنتج بسعره الأساسي. أضف خيارات مثل «بوكس 6 حبات» و«بوكس 12 حبة» إذا اختلفت الأسعار.</p>
            ) : (
              <ul className="space-y-3">
                {variants.map((v, i) => (
                  <li key={v.key} className="rounded-2xl border border-cocoa/10 bg-cream-100/50 p-3">
                    <div className="grid items-end gap-3 sm:grid-cols-12">
                      <GripVertical className="hidden h-5 w-5 self-center text-espresso/20 sm:col-span-1 sm:block" />
                      <div className="sm:col-span-4">
                        <label className="label text-xs">اسم الخيار *</label>
                        <input className="input py-2.5" value={v.name_ar} onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, name_ar: e.target.value } : x)))} placeholder="بوكس 6 حبات" />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="label text-xs">السعر (فارغ = سعر المنتج)</label>
                        <MoneyInput allowEmpty value={v.price_halalas} onChange={(h) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, price_halalas: h } : x)))} />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="label text-xs">سعر بعد الخصم</label>
                        <MoneyInput allowEmpty value={v.sale_price_halalas} onChange={(h) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, sale_price_halalas: h } : x)))} />
                      </div>
                      <button type="button" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))} className="grid h-11 w-11 place-items-center rounded-xl text-red-700/70 hover:bg-red-50 sm:col-span-1" aria-label="حذف الخيار"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-5">
                      <div className="w-32"><Toggle label="متاح" checked={v.is_available} onChange={(x) => setVariants((vs) => vs.map((y, j) => (j === i ? { ...y, is_available: x } : y)))} /></div>
                      <label className="flex items-center gap-2 text-sm">
                        مخزون
                        <input type="number" min={0} className="input w-24 py-1.5 text-sm" placeholder="غير محدود" value={v.stock_quantity ?? ''} onChange={(e) => setVariants((vs) => vs.map((y, j) => (j === i ? { ...y, stock_quantity: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0) } : y)))} />
                      </label>
                    </div>
                    {errors[`v${i}`] && <p className="field-error">{errors[`v${i}`]}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="المكونات والحساسية">
            <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">أدخل المكونات ومسببات الحساسية الحقيقية فقط كما تستخدمها في الوصفة. تُعرض للعميل كما هي.</p>
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="ing">المكونات</label>
                <textarea id="ing" rows={3} className="input" value={form.ingredients ?? ''} onChange={(e) => set('ingredients', e.target.value || null)} />
                <div className="mt-2"><Toggle label="عرض المكونات في صفحة المنتج" checked={form.show_ingredients} onChange={(v) => set('show_ingredients', v)} /></div>
              </div>
              <div>
                <label className="label" htmlFor="alg">معلومات الحساسية</label>
                <textarea id="alg" rows={2} className="input" value={form.allergens ?? ''} onChange={(e) => set('allergens', e.target.value || null)} placeholder="مثال: يحتوي على القمح، البيض، الحليب…" />
                <div className="mt-2"><Toggle label="عرض معلومات الحساسية" checked={form.show_allergens} onChange={(v) => set('show_allergens', v)} /></div>
              </div>
            </div>
          </Panel>

          <Panel title="محركات البحث (اختياري)">
            <div className="space-y-4">
              <div><label className="label" htmlFor="st">عنوان الصفحة</label><input id="st" className="input" value={form.seo_title ?? ''} onChange={(e) => set('seo_title', e.target.value || null)} placeholder={form.name_ar} /></div>
              <div><label className="label" htmlFor="sd">وصف الصفحة</label><textarea id="sd" rows={2} maxLength={300} className="input" value={form.seo_description ?? ''} onChange={(e) => set('seo_description', e.target.value || null)} placeholder={form.short_description ?? ''} /></div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="السعر">
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="price">السعر الأساسي *</label>
                <MoneyInput id="price" value={form.price_halalas || null} onChange={(h) => set('price_halalas', h ?? 0)} allowEmpty />
                {errors.price && <p className="field-error">{errors.price}</p>}
              </div>
              <div>
                <label className="label" htmlFor="sale">السعر بعد الخصم (اختياري)</label>
                <MoneyInput id="sale" value={form.sale_price_halalas} onChange={(h) => set('sale_price_halalas', h)} allowEmpty />
                {errors.sale && <p className="field-error">{errors.sale}</p>}
              </div>
            </div>
          </Panel>

          <Panel title="الظهور والتوفر">
            <div className="space-y-4">
              <Toggle label="منشور في المتجر" description="إيقافه يخفي المنتج عن العملاء" checked={form.is_active} onChange={(v) => set('is_active', v)} />
              <Toggle label="متوفر للطلب" description="إيقافه يعرض «نفدت الكمية»" checked={form.is_available} onChange={(v) => set('is_available', v)} />
              <Toggle label="منتج مميز" description="يظهر في «مختارات دفوة» بالرئيسية" checked={form.is_featured} onChange={(v) => set('is_featured', v)} />
              <Toggle label="الأكثر طلبًا" description="يظهر في قسم «الأكثر طلبًا»" checked={form.is_bestseller} onChange={(v) => set('is_bestseller', v)} />
              <Toggle label="السماح بملاحظات العميل" description="حقل ملاحظة اختياري على المنتج" checked={form.allow_notes} onChange={(v) => set('allow_notes', v)} />
            </div>
          </Panel>

          <Panel title="الكميات والمخزون">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label text-xs" htmlFor="minq">أقل كمية</label><input id="minq" type="number" min={1} className="input" value={form.min_quantity} onChange={(e) => set('min_quantity', Math.max(1, parseInt(e.target.value) || 1))} /></div>
                <div><label className="label text-xs" htmlFor="maxq">أعلى كمية للطلب</label><input id="maxq" type="number" min={1} className="input" value={form.max_quantity} onChange={(e) => set('max_quantity', Math.max(1, parseInt(e.target.value) || 1))} /></div>
              </div>
              {errors.qty && <p className="field-error">{errors.qty}</p>}
              <Toggle label="تتبع المخزون" description="يُخصم تلقائيًا مع كل طلب ويُعاد عند الإلغاء" checked={trackStock} onChange={setTrackStock} />
              {trackStock && <div><label className="label text-xs" htmlFor="stock">الكمية المتاحة</label><input id="stock" type="number" min={0} className="input" value={form.stock_quantity ?? 0} onChange={(e) => set('stock_quantity', Math.max(0, parseInt(e.target.value) || 0))} /></div>}
            </div>
          </Panel>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cocoa/10 bg-offwhite/95 px-4 py-3 backdrop-blur lg:pr-64">
        <div className="mx-auto flex max-w-7xl justify-end gap-2 lg:px-6">
          <Link to="/admin/products" className="btn-ghost btn-sm">إلغاء</Link>
          <button onClick={save} disabled={saving} className="btn-primary btn-sm">{saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} حفظ المنتج</button>
        </div>
      </div>
    </div>
  );
}
