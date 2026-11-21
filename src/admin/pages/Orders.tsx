import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Search, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData, must } from '../useData';
import { PageHeader, Panel, StatusBadge, PaymentBadge, Empty, downloadCsv } from '../ui';
import { Spinner } from '../../components/ui';
import { formatSAR, halalasToSar } from '../../../shared/money';
import { formatDateAr, formatDateTimeAr } from '../../../shared/dates';
import { ORDER_STATUSES, ORDER_STATUS_AR, PAYMENT_STATUSES, PAYMENT_STATUS_AR } from '../../../shared/labels';
import { normalizeSaudiMobile, formatSaudiMobileLocal } from '../../../shared/phone';
import { googleMapsLink } from '../../../shared/geo';
import type { Order, OrderItem } from '../../lib/types';

const PAGE = 30;

function applyFilters(q: any, f: Record<string, string>) {
  if (f.status) q = q.eq('status', f.status);
  if (f.payment) q = q.eq('payment_status', f.payment);
  const col = f.basis === 'delivery' ? 'delivery_date' : 'created_at';
  if (f.from) q = q.gte(col, f.basis === 'delivery' ? f.from : `${f.from}T00:00:00+03:00`);
  if (f.to) q = f.basis === 'delivery' ? q.lte(col, f.to) : q.lt(col, new Date(new Date(`${f.to}T00:00:00+03:00`).getTime() + 86400000).toISOString());
  if (f.q) {
    const term = f.q.replace(/[,()*%\\]/g, ' ').trim();
    const phone = normalizeSaudiMobile(term);
    if (phone) q = q.eq('customer_phone', phone);
    else if (term) q = q.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,neighborhood.ilike.%${term}%`);
  }
  return q;
}

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const f = Object.fromEntries(params.entries()) as Record<string, string>;
  const page = Number(f.page ?? 0);
  const [search, setSearch] = useState(f.q ?? '');
  const [exporting, setExporting] = useState(false);
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(params);
    v ? n.set(k, v) : n.delete(k);
    if (k !== 'page') n.delete('page');
    setParams(n, { replace: true });
  };

  const { data, loading } = useData(async () => {
    const q = applyFilters(supabase.from('orders').select('*', { count: 'exact' }), f)
      .order('created_at', { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    const res = await q;
    return { rows: must(res) as Order[], count: res.count ?? 0 };
  }, [params.toString()]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all: (Order & { items: OrderItem[] })[] = [];
      for (let from = 0; ; from += 1000) {
        const res = await applyFilters(supabase.from('orders').select('*, items:order_items(*)'), f).order('created_at', { ascending: false }).range(from, from + 999);
        const rows = must(res) as (Order & { items: OrderItem[] })[];
        all.push(...rows);
        if (rows.length < 1000) break;
      }
      const ok = all.filter((o) => o.status !== 'cancelled');
      const rows: (string | number | null)[][] = [
        ['رقم الطلب', 'تاريخ الإنشاء', 'العميل', 'الجوال', 'البريد', 'المنتجات', 'عدد القطع', 'المجموع', 'الخصم', 'كود الخصم', 'التوصيل', 'الإجمالي', 'المدفوع', 'حالة الطلب', 'حالة الدفع', 'تاريخ التوصيل', 'الوقت', 'الحي', 'المنطقة', 'رابط الموقع'],
        ...all.map((o) => [
          o.order_number, formatDateTimeAr(o.created_at), o.customer_name, formatSaudiMobileLocal(o.customer_phone), o.customer_email,
          o.items.map((i) => `${i.product_name_ar}${i.variant_name ? ` (${i.variant_name})` : ''} × ${i.quantity}`).join(' | '),
          o.items.reduce((s, i) => s + i.quantity, 0),
          halalasToSar(o.subtotal_halalas), halalasToSar(o.discount_halalas), o.promo_code, halalasToSar(o.delivery_fee_halalas), halalasToSar(o.total_halalas), halalasToSar(o.amount_paid_halalas),
          ORDER_STATUS_AR[o.status], PAYMENT_STATUS_AR[o.payment_status], o.delivery_date, o.slot_label, o.neighborhood, o.zone_name, googleMapsLink(o.latitude, o.longitude),
        ]),
        [],
        ['ملخص (بدون الطلبات الملغاة)'],
        ['عدد الطلبات', ok.length],
        ['الطلبات الملغاة', all.length - ok.length],
        ['صافي المبيعات (بعد الخصم، بدون التوصيل)', halalasToSar(ok.reduce((s, o) => s + o.subtotal_halalas - o.discount_halalas, 0))],
        ['رسوم التوصيل', halalasToSar(ok.reduce((s, o) => s + o.delivery_fee_halalas, 0))],
        ['إجمالي الفواتير', halalasToSar(ok.reduce((s, o) => s + o.total_halalas, 0))],
        ['المحصّل', halalasToSar(ok.reduce((s, o) => s + (['paid', 'partially_paid'].includes(o.payment_status) ? o.amount_paid_halalas : 0), 0))],
      ];
      downloadCsv(`dafwa-orders-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } finally {
      setExporting(false);
    }
  };

  const pages = Math.ceil((data?.count ?? 0) / PAGE);

  return (
    <div>
      <PageHeader
        title="الطلبات"
        subtitle={data ? `${data.count} طلب` : undefined}
        actions={<button onClick={exportCsv} disabled={exporting} className="btn-secondary btn-sm">{exporting ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} تصدير CSV</button>}
      />

      <Panel className="mb-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <form className="relative lg:col-span-2" onSubmit={(e) => { e.preventDefault(); set('q', search.trim()); }}>
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onBlur={() => search !== (f.q ?? '') && set('q', search.trim())} placeholder="رقم الطلب، الاسم، الجوال، الحي…" className="input py-2.5 ps-10 text-sm" aria-label="بحث" />
          </form>
          <select value={f.status ?? ''} onChange={(e) => set('status', e.target.value)} className="input py-2.5 text-sm" aria-label="حالة الطلب">
            <option value="">كل الحالات</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_AR[s]}</option>)}
          </select>
          <select value={f.payment ?? ''} onChange={(e) => set('payment', e.target.value)} className="input py-2.5 text-sm" aria-label="حالة الدفع">
            <option value="">كل حالات الدفع</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{PAYMENT_STATUS_AR[s]}</option>)}
          </select>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap lg:col-span-2">
            <select value={f.basis ?? 'created'} onChange={(e) => set('basis', e.target.value === 'created' ? '' : e.target.value)} className="input w-auto py-2.5 text-sm" aria-label="نوع التاريخ">
              <option value="created">تاريخ الطلب</option>
              <option value="delivery">تاريخ التوصيل</option>
            </select>
            <input type="date" value={f.from ?? ''} onChange={(e) => set('from', e.target.value)} className="input min-w-0 flex-1 py-2.5 text-sm" aria-label="من" />
            <input type="date" value={f.to ?? ''} onChange={(e) => set('to', e.target.value)} className="input min-w-0 flex-1 py-2.5 text-sm" aria-label="إلى" />
          </div>
        </div>
      </Panel>

      <Panel padded={false}>
        {loading && !data ? (
          <div className="grid place-items-center py-16"><Spinner className="h-6 w-6 text-cocoa" /></div>
        ) : !data?.rows.length ? (
          <Empty>لا توجد طلبات مطابقة.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr><th>الطلب</th><th>العميل</th><th>التوصيل</th><th>الحي</th><th>الإجمالي</th><th>الحالة</th><th>الدفع</th><th></th></tr>
              </thead>
              <tbody>
                {data.rows.map((o) => (
                  <tr key={o.id} className={o.status === 'cancelled' ? 'opacity-60' : ''}>
                    <td><Link to={`/admin/orders/${o.id}`} className="font-semibold text-cocoa hover:underline ltr">{o.order_number}</Link><div className="text-xs text-espresso/45">{formatDateTimeAr(o.created_at)}</div></td>
                    <td>{o.customer_name}<div className="ltr text-right text-xs text-espresso/50">{formatSaudiMobileLocal(o.customer_phone)}</div></td>
                    <td className="whitespace-nowrap text-xs">{formatDateAr(o.delivery_date)}<div className="text-espresso/50">{o.slot_label}</div></td>
                    <td className="text-xs">{o.neighborhood}</td>
                    <td className="whitespace-nowrap font-medium">{formatSAR(o.total_halalas)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><PaymentBadge status={o.payment_status} /></td>
                    <td><a href={googleMapsLink(o.latitude, o.longitude)} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full text-caramel hover:bg-cream-200" title="فتح الموقع في خرائط Google"><MapPin className="h-4 w-4" /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-cocoa/10 px-5 py-3 text-sm">
            <button disabled={page <= 0} onClick={() => set('page', String(page - 1))} className="btn-ghost btn-sm"><ChevronRight className="h-4 w-4" /> السابق</button>
            <span className="text-espresso/55">صفحة {page + 1} من {pages}</span>
            <button disabled={page >= pages - 1} onClick={() => set('page', String(page + 1))} className="btn-ghost btn-sm">التالي <ChevronLeft className="h-4 w-4" /></button>
          </div>
        )}
      </Panel>
    </div>
  );
}
