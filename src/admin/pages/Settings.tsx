import { useEffect, useRef, useState } from 'react';
import { Save, Plus, Trash2, ArrowUp, ArrowDown, Upload, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PageHeader, Panel, Toggle } from '../ui';
import { PageLoader, Spinner } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { prepareImage, randomId } from '../../lib/image';
import type { Faq, StoreSettings } from '../../lib/types';

export default function Settings() {
  const toast = useToast();
  const [s, setS] = useState<StoreSettings | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const heroRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([supabase.from('store_settings').select('*').single(), supabase.from('store_private_settings').select('*').single()]).then(([a, b]) => {
      setS(a.data as StoreSettings);
      setEmails((b.data?.owner_notification_emails as string[]) ?? []);
    });
  }, []);
  if (!s) return <PageLoader />;
  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS({ ...s, [k]: v });
  const setFaq = (i: number, f: Partial<Faq>) => set('faqs', s.faqs.map((x, j) => (j === i ? { ...x, ...f } : x)));

  const uploadHero = async (f?: File) => {
    if (!f) return;
    setUploading(true);
    try {
      const { blob, ext, type } = await prepareImage(f, 1800);
      const path = `hero/${Date.now()}-${randomId(8)}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(path, blob, { contentType: type, cacheControl: '31536000' });
      if (error) throw new Error(error.message);
      set('hero_image_url', supabase.storage.from('site-assets').getPublicUrl(path).data.publicUrl);
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const cleanEmails = emails.map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (cleanEmails.some((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e))) return toast('error', 'أحد عناوين البريد غير صحيح');
    if (!cleanEmails.length) return toast('error', 'أضف بريدًا واحدًا على الأقل لاستلام إشعارات الطلبات');
    if (!/^9665\d{8}$/.test(s.whatsapp_number)) return toast('error', 'رقم الواتساب بالصيغة الدولية: 9665XXXXXXXX');
    if (s.instagram_url && !/^https:\/\//.test(s.instagram_url)) return toast('error', 'رابط إنستقرام يجب أن يبدأ بـ https://');
    setSaving(true);
    const { updated_at: _u, ...rest } = s as StoreSettings & { updated_at?: string; id?: boolean };
    const payload = { ...rest, faqs: s.faqs.filter((f) => f.q.trim() && f.a.trim()) };
    delete (payload as { id?: boolean }).id;
    const [a, b] = await Promise.all([
      supabase.from('store_settings').update(payload).eq('id', true),
      supabase.from('store_private_settings').update({ owner_notification_emails: cleanEmails }).eq('id', true),
    ]);
    setSaving(false);
    if (a.error || b.error) return toast('error', `تعذر الحفظ: ${(a.error ?? b.error)!.message}`);
    toast('success', 'تم حفظ الإعدادات — تظهر في الموقع مباشرة');
  };

  return (
    <div className="pb-24">
      <PageHeader title="إعدادات المتجر" subtitle="كل التغييرات تظهر في الموقع بدون تعديل الكود" actions={<button onClick={save} disabled={saving} className="btn-primary btn-sm">{saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} حفظ</button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="معلومات المتجر">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">الاسم (عربي)</label><input className="input" value={s.store_name_ar} onChange={(e) => set('store_name_ar', e.target.value)} /></div>
              <div><label className="label">الاسم (إنجليزي)</label><input dir="ltr" className="input" value={s.store_name_en} onChange={(e) => set('store_name_en', e.target.value)} /></div>
            </div>
            <div><label className="label">وصف المتجر</label><textarea rows={2} className="input" value={s.description} onChange={(e) => set('description', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">رقم الجوال (للعرض)</label><input dir="ltr" className="input" value={s.phone} onChange={(e) => set('phone', e.target.value)} /></div>
              <div><label className="label">واتساب (دولي)</label><input dir="ltr" className="input" value={s.whatsapp_number} onChange={(e) => set('whatsapp_number', e.target.value.replace(/\D/g, ''))} placeholder="966501131470" /></div>
            </div>
            <div><label className="label">بريد التواصل العام (اختياري)</label><input dir="ltr" type="email" className="input" value={s.contact_email ?? ''} onChange={(e) => set('contact_email', e.target.value || null)} /></div>
            <div><label className="label">رابط إنستقرام (اختياري)</label><input dir="ltr" className="input" value={s.instagram_url ?? ''} onChange={(e) => set('instagram_url', e.target.value || null)} placeholder="https://instagram.com/..." /></div>
          </div>
        </Panel>

        <Panel title={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-caramel" /> مستلمو إشعارات الطلبات الجديدة</span>}>
          <p className="mb-4 text-xs leading-relaxed text-espresso/55">كل عنوان هنا يستلم بريدًا عند كل طلب جديد. هذه القائمة لا تظهر للعملاء.</p>
          <ul className="space-y-2">
            {emails.map((e, i) => (
              <li key={i} className="flex gap-2">
                <input dir="ltr" type="email" className="input py-2.5" value={e} onChange={(ev) => setEmails(emails.map((x, j) => (j === i ? ev.target.value : x)))} aria-label={`بريد ${i + 1}`} />
                <button onClick={() => setEmails(emails.filter((_, j) => j !== i))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-red-700/70 hover:bg-red-50" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
          <button onClick={() => setEmails([...emails, ''])} className="btn-ghost btn-sm mt-3"><Plus className="h-4 w-4" /> إضافة بريد</button>
        </Panel>

        <Panel title="الشريط العلوي والواجهة">
          <div className="space-y-4">
            <div><label className="label">الإعلان الرئيسي</label><input className="input" value={s.announcement_primary} onChange={(e) => set('announcement_primary', e.target.value)} /></div>
            <div><label className="label">الإعلان الثانوي</label><input className="input" value={s.announcement_secondary} onChange={(e) => set('announcement_secondary', e.target.value)} /></div>
            <div><label className="label">عنوان الواجهة</label><input className="input" value={s.hero_title} onChange={(e) => set('hero_title', e.target.value)} /><p className="hint">استخدم «...» لفصل السطرين بشكل جمالي.</p></div>
            <div><label className="label">النص التعريفي</label><input className="input" value={s.hero_subtitle} onChange={(e) => set('hero_subtitle', e.target.value)} /></div>
            <div>
              <label className="label">صورة الواجهة (اختياري)</label>
              <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadHero(e.target.files?.[0])} />
              <div className="flex items-center gap-3">
                <div className="h-24 w-20 overflow-hidden rounded-t-full rounded-b-xl bg-cocoa">{s.hero_image_url && <img src={s.hero_image_url} alt="" className="h-full w-full object-cover" />}</div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => heroRef.current?.click()} className="btn-secondary btn-sm" disabled={uploading}>{uploading ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />} رفع صورة</button>
                  {s.hero_image_url && <button onClick={() => set('hero_image_url', null)} className="text-xs text-red-700">استخدام الرسم الافتراضي</button>}
                </div>
              </div>
              <p className="hint">يُفضل صورة عمودية (4:5) لكوكيز دفوة الحقيقي.</p>
            </div>
          </div>
        </Panel>

        <Panel title="النصوص">
          <div className="space-y-4">
            <div><label className="label">قصة دفوة</label><textarea rows={5} className="input leading-loose" value={s.brand_story} onChange={(e) => set('brand_story', e.target.value)} /><p className="hint">كل سطر جديد يظهر كفقرة.</p></div>
            <div><label className="label">معلومات التوصيل</label><textarea rows={3} className="input" value={s.delivery_info} onChange={(e) => set('delivery_info', e.target.value)} /></div>
          </div>
        </Panel>

        <Panel title="خيارات الدفع">
          <Toggle label="السماح بحالة «مدفوع جزئيًا»" description="يتيح تسجيل مبلغ مدفوع جزئيًا في صفحة الطلب" checked={s.allow_partial_payment} onChange={(v) => set('allow_partial_payment', v)} />
          <div className="mt-4"><label className="label">أقصى عدد قطع في الطلب الواحد</label><input type="number" min={1} className="input" value={s.max_items_per_order} onChange={(e) => set('max_items_per_order', Math.max(1, parseInt(e.target.value) || 1))} /></div>
          <p className="mt-4 text-xs text-espresso/50">إعدادات المواعيد والإيقاف المؤقت للطلبات موجودة في صفحة «إدارة التوصيل».</p>
        </Panel>

        <Panel className="lg:col-span-2" title="الأسئلة الشائعة" actions={<button onClick={() => set('faqs', [...s.faqs, { q: '', a: '' }])} className="btn-ghost btn-sm"><Plus className="h-4 w-4" /> سؤال</button>}>
          <ul className="space-y-3">
            {s.faqs.map((f, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border border-cocoa/10 p-3">
                <div className="flex flex-col">
                  <button disabled={i === 0} onClick={() => { const n = [...s.faqs]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set('faqs', n); }} className="text-espresso/30 hover:text-cocoa disabled:opacity-20" aria-label="لأعلى"><ArrowUp className="h-4 w-4" /></button>
                  <button disabled={i === s.faqs.length - 1} onClick={() => { const n = [...s.faqs]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set('faqs', n); }} className="text-espresso/30 hover:text-cocoa disabled:opacity-20" aria-label="لأسفل"><ArrowDown className="h-4 w-4" /></button>
                </div>
                <div className="flex-1 space-y-2">
                  <input className="input py-2.5 font-medium" value={f.q} onChange={(e) => setFaq(i, { q: e.target.value })} placeholder="السؤال" aria-label="السؤال" />
                  <textarea rows={2} className="input py-2.5 text-sm" value={f.a} onChange={(e) => setFaq(i, { a: e.target.value })} placeholder="الإجابة" aria-label="الإجابة" />
                </div>
                <button onClick={() => set('faqs', s.faqs.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-xl text-red-700/70 hover:bg-red-50" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
