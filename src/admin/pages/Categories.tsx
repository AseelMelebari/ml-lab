import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData, must } from '../useData';
import { PageHeader, Panel, Modal, Toggle, Empty } from '../ui';
import { PageLoader, Spinner } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { slugify } from '../../lib/image';
import type { Category } from '../../lib/types';

type Draft = Partial<Category> & { name_ar: string; slug: string };

export default function Categories() {
  const toast = useToast();
  const { data, loading, reload } = useData(async () => must(await supabase.from('categories').select('*, products(count)').order('sort_order')) as (Category & { products: { count: number }[] })[]);
  const [edit, setEdit] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!edit) return;
    if (!edit.name_ar.trim() || !/^[a-z0-9-]+$/.test(edit.slug)) return toast('error', 'الاسم والرابط (حروف إنجليزية صغيرة وأرقام) مطلوبة');
    setSaving(true);
    const row = { name_ar: edit.name_ar.trim(), name_en: edit.name_en || null, slug: edit.slug, description: edit.description || null, sort_order: edit.sort_order ?? 0, is_active: edit.is_active ?? true };
    const { error } = edit.id ? await supabase.from('categories').update(row).eq('id', edit.id) : await supabase.from('categories').insert(row);
    setSaving(false);
    if (error) return toast('error', error.message.includes('slug') ? 'الرابط مستخدم' : 'تعذر الحفظ');
    toast('success', 'تم الحفظ');
    setEdit(null);
    reload();
  };

  const remove = async (c: Category & { products: { count: number }[] }) => {
    const n = c.products?.[0]?.count ?? 0;
    if (!window.confirm(n ? `يوجد ${n} منتج في هذا التصنيف وسيصبح «بدون تصنيف». متابعة الحذف؟` : 'حذف التصنيف؟')) return;
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    if (error) toast('error', 'تعذر الحذف');
    else reload();
  };

  if (loading && !data) return <PageLoader />;
  return (
    <div>
      <PageHeader title="التصنيفات" subtitle="تظهر كفلاتر في صفحة المتجر" actions={<button onClick={() => setEdit({ name_ar: '', slug: '', is_active: true, sort_order: ((data?.length ?? 0) + 1) * 10 })} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> تصنيف جديد</button>} />
      <Panel padded={false}>
        {!data?.length ? <Empty>لا توجد تصنيفات.</Empty> : (
          <table className="table-admin">
            <thead><tr><th>التصنيف</th><th>الرابط</th><th>المنتجات</th><th>الترتيب</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name_ar}{c.name_en && <span className="ms-2 text-xs text-espresso/45">{c.name_en}</span>}</td>
                  <td className="ltr text-right text-xs text-espresso/55">{c.slug}</td>
                  <td>{c.products?.[0]?.count ?? 0}</td>
                  <td>{c.sort_order}</td>
                  <td>{c.is_active ? <span className="chip bg-emerald-100 text-emerald-900">ظاهر</span> : <span className="chip bg-stone-100 text-stone-600">مخفي</span>}</td>
                  <td className="whitespace-nowrap text-left">
                    <button onClick={() => setEdit(c)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-cream-200" aria-label="تعديل" style={{ display: 'inline-grid' }}><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(c)} className="grid h-8 w-8 place-items-center rounded-full text-red-700/70 hover:bg-red-50" aria-label="حذف" style={{ display: 'inline-grid' }}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'تعديل التصنيف' : 'تصنيف جديد'} footer={<><button onClick={() => setEdit(null)} className="btn-ghost btn-sm">إلغاء</button><button onClick={save} disabled={saving} className="btn-primary btn-sm">{saving && <Spinner className="h-4 w-4" />} حفظ</button></>}>
        {edit && (
          <div className="space-y-4">
            <div><label className="label">الاسم (عربي) *</label><input className="input" value={edit.name_ar} onChange={(e) => setEdit({ ...edit, name_ar: e.target.value })} /></div>
            <div><label className="label">الاسم بالإنجليزي</label><input dir="ltr" className="input" value={edit.name_en ?? ''} onChange={(e) => setEdit({ ...edit, name_en: e.target.value, slug: edit.id ? edit.slug : slugify(e.target.value) })} /></div>
            <div><label className="label">الرابط *</label><input dir="ltr" className="input" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} placeholder="classic" /></div>
            <div><label className="label">الترتيب</label><input type="number" className="input" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: parseInt(e.target.value) || 0 })} /></div>
            <Toggle label="ظاهر في المتجر" checked={edit.is_active ?? true} onChange={(v) => setEdit({ ...edit, is_active: v })} />
          </div>
        )}
      </Modal>
    </div>
  );
}
