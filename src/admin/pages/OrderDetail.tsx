import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, MapPin, Phone, Mail, Printer, Send, History, StickyNote } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData, must } from '../useData';
import { adminFetch } from '../auth';
import { PageHeader, Panel, StatusBadge, PaymentBadge, EmailBadge, MoneyInput } from '../ui';
import { PageLoader, Spinner } from '../../components/ui';
import { WhatsAppIcon } from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import { formatSAR } from '../../../shared/money';
import { formatDateAr, formatDateTimeAr } from '../../../shared/dates';
import { ORDER_STATUSES, ORDER_STATUS_AR, PAYMENT_STATUSES, PAYMENT_STATUS_AR, EMAIL_KIND_AR, errorMessageAr, type OrderStatus, type PaymentStatus } from '../../../shared/labels';
import { formatSaudiMobileLocal } from '../../../shared/phone';
import { googleMapsLink } from '../../../shared/geo';
import { whatsappLink } from '../../../shared/whatsapp';
import type { Order, OrderItem } from '../../lib/types';

interface HistoryRow { id: string; field: string; from_value: string | null; to_value: string; created_at: string; note: string | null }
interface EmailRow { id: string; kind: string; recipient: string; status: string; attempts: number; last_error: string | null; sent_at: string | null; created_at: string }

const label = (field: string, v: string | null) => (v ? (field === 'status' ? ORDER_STATUS_AR[v as OrderStatus] : PAYMENT_STATUS_AR[v as PaymentStatus]) ?? v : '—');
const timeAr = (ts: string) => new Intl.DateTimeFormat('ar-SA-u-nu-latn', { timeZone: 'Asia/Riyadh', hour: 'numeric', minute: '2-digit' }).format(new Date(ts));

export default function OrderDetail() {
  const { id = '' } = useParams();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const { data, loading, reload } = useData(async () => {
    const [o, items, hist, emails, settings] = await Promise.all([
      supabase.from('orders').select('*').eq('id', id).single(),
      supabase.from('order_items').select('*').eq('order_id', id).order('created_at'),
      supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: false }),
      supabase.from('email_notifications').select('id, kind, recipient, status, attempts, last_error, sent_at, created_at').eq('order_id', id).order('created_at'),
      supabase.from('store_settings').select('allow_partial_payment').single(),
    ]);
    return {
      order: must(o) as Order, items: must(items) as OrderItem[], history: must(hist) as HistoryRow[], emails: must(emails) as EmailRow[],
      allowPartial: settings.data?.allow_partial_payment ?? false,
    };
  }, [id]);
  const [partial, setPartial] = useState<number | null>(null);
  const [notes, setNotes] = useState<string | null>(null);

  if (loading && !data) return <PageLoader />;
  if (!data) return <p>الطلب غير موجود.</p>;
  const { order: o, items, history, emails } = data;

  const update = async (patch: Partial<Order>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setSaving(true);
    const { error } = await supabase.from('orders').update(patch).eq('id', o.id);
    setSaving(false);
    if (error) return toast('error', errorMessageAr(error.message, error.message));
    toast('success', 'تم الحفظ');
    await reload();
    // Status changes may have queued customer emails → send them now (also retried automatically).
    if (patch.status) adminFetch('/api/email-dispatch', { order_id: o.id }).then(() => reload()).catch(() => {});
  };

  const dispatch = async () => {
    setDispatching(true);
    try {
      const r = await adminFetch<{ sent: number; failed: number }>('/api/email-dispatch', { order_id: o.id });
      toast(r.failed ? 'error' : 'success', `تمت المعالجة: ${r.sent} مقبولة، ${r.failed} فشلت`);
      reload();
    } catch (e) {
      toast('error', `تعذر الإرسال: ${(e as Error).message}`);
    } finally {
      setDispatching(false);
    }
  };

  const maps = googleMapsLink(o.latitude, o.longitude);
  const custWa = whatsappLink((o.customer_whatsapp ?? o.customer_phone).replace(/\D/g, ''), `السلام عليكم ${o.customer_name.split(' ')[0]}، معك دفوة بخصوص طلبك رقم ${o.order_number} 🍪`);
  const cancelled = o.status === 'cancelled';

  return (
    <div>
      <Link to="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-espresso/60 hover:text-cocoa"><ArrowRight className="h-4 w-4" /> الطلبات</Link>
      <PageHeader
        title={`الطلب ${o.order_number}`}
        subtitle={`أُنشئ ${formatDateTimeAr(o.created_at)}`}
        actions={
          <>
            <a href={maps} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm"><MapPin className="h-4 w-4" /> فتح الموقع في خرائط Google</a>
            <a href={custWa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp btn-sm"><WhatsAppIcon className="h-4 w-4" /> مراسلة العميل</a>
            <button onClick={() => window.print()} className="btn-ghost btn-sm"><Printer className="h-4 w-4" /> طباعة</button>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2"><StatusBadge status={o.status} /><PaymentBadge status={o.payment_status} /></div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="المنتجات" padded={false}>
            <table className="table-admin">
              <thead><tr><th>المنتج</th><th>سعر الوحدة</th><th>الكمية</th><th>المجموع</th></tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td><span className="font-medium">{i.product_name_ar}</span>{i.variant_name && <span className="text-espresso/55"> — {i.variant_name}</span>}{i.notes && <div className="text-xs text-caramel-dark">ملاحظة: {i.notes}</div>}</td>
                    <td>{formatSAR(i.unit_price_halalas)}</td>
                    <td>{i.quantity}</td>
                    <td className="font-medium">{formatSAR(i.line_total_halalas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="space-y-2 border-t border-cocoa/10 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-espresso/60">المجموع</dt><dd>{formatSAR(o.subtotal_halalas)}</dd></div>
              <div className="flex justify-between"><dt className="text-espresso/60">الخصم {o.promo_code && <span className="ltr">({o.promo_code})</span>}</dt><dd>- {formatSAR(o.discount_halalas)}</dd></div>
              <div className="flex justify-between"><dt className="text-espresso/60">التوصيل ({o.zone_name})</dt><dd>{formatSAR(o.delivery_fee_halalas)}</dd></div>
              <div className="flex justify-between border-t border-cocoa/10 pt-2 text-base font-semibold"><dt>الإجمالي</dt><dd className="text-cocoa">{formatSAR(o.total_halalas)}</dd></div>
              <div className="flex justify-between text-espresso/60"><dt>المدفوع</dt><dd>{formatSAR(o.amount_paid_halalas)}</dd></div>
            </dl>
          </Panel>

          <div className="grid gap-6 sm:grid-cols-2">
            <Panel title="العميل">
              <p className="font-semibold">{o.customer_name}</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-caramel" /><a href={`tel:${o.customer_phone}`} className="ltr hover:underline">{formatSaudiMobileLocal(o.customer_phone)}</a></li>
                {o.customer_whatsapp && <li className="flex items-center gap-2"><WhatsAppIcon className="h-4 w-4 text-caramel" /><span className="ltr">{formatSaudiMobileLocal(o.customer_whatsapp)}</span></li>}
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-caramel" /><a href={`mailto:${o.customer_email}`} className="break-all hover:underline">{o.customer_email}</a></li>
              </ul>
            </Panel>
            <Panel title="التوصيل">
              <p className="font-semibold">{formatDateAr(o.delivery_date, { year: true })}</p>
              <p className="text-sm text-espresso/65">{o.slot_label} ({timeAr(o.delivery_start)} – {timeAr(o.delivery_end)})</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li><span className="text-espresso/55">الحي:</span> {o.neighborhood}</li>
                <li><span className="text-espresso/55">المنطقة:</span> {o.zone_name}</li>
                {(o.building || o.floor || o.apartment) && <li><span className="text-espresso/55">العنوان:</span> {[o.building && `مبنى ${o.building}`, o.floor && `دور ${o.floor}`, o.apartment && `شقة ${o.apartment}`].filter(Boolean).join(' · ')}</li>}
                {o.delivery_instructions && <li><span className="text-espresso/55">تعليمات:</span> {o.delivery_instructions}</li>}
              </ul>
              <a href={maps} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm mt-4 w-full"><MapPin className="h-4 w-4" /> فتح الموقع في خرائط Google</a>
            </Panel>
          </div>
          {o.notes && <Panel title="ملاحظات العميل"><p className="whitespace-pre-line text-sm leading-relaxed">{o.notes}</p></Panel>}

          <Panel title={<span className="flex items-center gap-2"><Mail className="h-4 w-4 text-caramel" /> إشعارات البريد</span>} padded={false} actions={<button onClick={dispatch} disabled={dispatching} className="btn-ghost btn-sm">{dispatching ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />} إرسال المعلّق الآن</button>}>
            <div className="overflow-x-auto">
              <table className="table-admin">
                <thead><tr><th>النوع</th><th>المستلم</th><th>الحالة</th><th>المحاولات</th></tr></thead>
                <tbody>
                  {emails.map((e) => (
                    <tr key={e.id}>
                      <td className="text-xs">{EMAIL_KIND_AR[e.kind] ?? e.kind}</td>
                      <td className="ltr text-right text-xs">{e.recipient}</td>
                      <td><EmailBadge status={e.status} />{e.last_error && <div className="mt-1 max-w-xs truncate text-[11px] text-red-700" title={e.last_error}>{e.last_error}</div>}</td>
                      <td className="text-xs">{e.attempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[11px] text-espresso/45">«قُبل للإرسال» تعني أن مزود البريد استلم الرسالة، ولا تضمن وصولها لصندوق الوارد.</p>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="حالة الطلب">
            {cancelled ? (
              <p className="text-sm text-espresso/60">هذا الطلب ملغي ويبقى محفوظًا في السجل.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {ORDER_STATUSES.filter((s) => s !== 'cancelled').map((s) => (
                  <button key={s} disabled={saving || o.status === s} onClick={() => update({ status: s })} className={`rounded-2xl border px-3 py-2.5 text-sm transition ${o.status === s ? 'border-cocoa bg-cocoa text-white' : 'border-cocoa/15 hover:border-cocoa/40'}`}>
                    {ORDER_STATUS_AR[s]}
                  </button>
                ))}
                <button disabled={saving} onClick={() => update({ status: 'cancelled' }, 'إلغاء الطلب نهائي ولا يمكن التراجع عنه، وسيتم إشعار العميل بالبريد. متأكد؟')} className="col-span-2 mt-1 rounded-2xl border border-red-200 px-3 py-2.5 text-sm text-red-800 hover:bg-red-50">إلغاء الطلب</button>
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-espresso/50">يتم إرسال بريد للعميل تلقائيًا عند: التأكيد، الخروج للتوصيل، الإلغاء.</p>
          </Panel>

          <Panel title="حالة الدفع">
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_STATUSES.filter((s) => s !== 'partially_paid' || data.allowPartial).map((s) => (
                <button
                  key={s}
                  disabled={saving || (o.payment_status === s && s !== 'partially_paid')}
                  onClick={() => {
                    if (s === 'partially_paid') {
                      if (!partial) return toast('error', 'أدخل المبلغ المدفوع أولًا');
                      return update({ payment_status: s, amount_paid_halalas: partial });
                    }
                    update({ payment_status: s }, s === 'paid' ? `تأكيد استلام المبلغ كاملًا (${formatSAR(o.total_halalas)})؟ لا تحدد «مدفوع» إلا بعد التحقق من وصول المبلغ.` : undefined);
                  }}
                  className={`rounded-2xl border px-3 py-2.5 text-sm transition ${o.payment_status === s ? 'border-cocoa bg-cocoa text-white' : 'border-cocoa/15 hover:border-cocoa/40'}`}
                >
                  {PAYMENT_STATUS_AR[s]}
                </button>
              ))}
            </div>
            {data.allowPartial && (
              <div className="mt-3">
                <label className="label text-xs">المبلغ المدفوع (للدفع الجزئي)</label>
                <MoneyInput value={partial ?? (o.payment_status === 'partially_paid' ? o.amount_paid_halalas : null)} onChange={setPartial} allowEmpty />
              </div>
            )}
          </Panel>

          <Panel title={<span className="flex items-center gap-2"><StickyNote className="h-4 w-4 text-caramel" /> ملاحظات داخلية</span>}>
            <textarea rows={3} className="input resize-none text-sm" value={notes ?? o.admin_notes ?? ''} onChange={(e) => setNotes(e.target.value)} placeholder="لا تظهر للعميل" aria-label="ملاحظات داخلية" />
            <button disabled={saving || notes === null} onClick={() => update({ admin_notes: notes })} className="btn-secondary btn-sm mt-2">حفظ الملاحظة</button>
          </Panel>

          <Panel title={<span className="flex items-center gap-2"><History className="h-4 w-4 text-caramel" /> سجل التغييرات</span>}>
            <ol className="relative space-y-4 border-r border-cocoa/15 pr-4">
              {history.map((h) => (
                <li key={h.id} className="relative text-sm">
                  <span className="absolute -right-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-caramel ring-4 ring-white" />
                  <p>
                    <span className="text-espresso/55">{h.field === 'status' ? 'الطلب' : 'الدفع'}:</span>{' '}
                    {h.from_value ? <>{label(h.field, h.from_value)} ← </> : null}
                    <strong>{label(h.field, h.to_value)}</strong>
                  </p>
                  <p className="text-xs text-espresso/45">{formatDateTimeAr(h.created_at)}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
