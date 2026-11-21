import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Download, Info } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useData, must } from '../useData';
import { PageHeader, Panel, StatCard, Empty, downloadCsv } from '../ui';
import { PageLoader, Spinner } from '../../components/ui';
import { formatSAR, halalasToSar } from '../../../shared/money';
import { addDays, riyadhToday } from '../../../shared/dates';
import { ORDER_STATUSES, ORDER_STATUS_AR, PAYMENT_STATUSES, PAYMENT_STATUS_AR } from '../../../shared/labels';
import type { Category } from '../../lib/types';

interface Report {
  summary: {
    orders_total: number; orders_successful: number; orders_cancelled: number; orders_pending: number; units_sold: number;
    gross_sales: number; discounts: number; net_sales: number; delivery_fees: number; total_billed: number; collected: number; unpaid: number; average_order_value: number;
  };
  series: { bucket: string; orders: number; cancelled: number; net_sales: number; total_billed: number; collected: number; units: number }[];
  products: { key: string; name: string; units: number; revenue: number; orders: number }[];
  categories: { name: string; units: number; revenue: number }[];
}

type Preset = 'today' | '7d' | 'month' | 'year' | 'custom';
type Grain = 'day' | 'week' | 'month' | 'year';

const INK = '#60351F';
const AXIS = { fontSize: 11, fill: 'rgba(66,36,23,.55)' };
const sar = (h: number) => (h / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });

function rangeFor(p: Preset, custom: { from: string; to: string }) {
  const today = riyadhToday();
  switch (p) {
    case 'today': return { from: today, to: today };
    case '7d': return { from: addDays(today, -6), to: today };
    case 'month': return { from: `${today.slice(0, 8)}01`, to: today };
    case 'year': return { from: `${today.slice(0, 4)}-01-01`, to: today };
    default: return custom;
  }
}

function bucketLabel(b: string, grain: Grain) {
  const d = new Date(`${b}T12:00:00+03:00`);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { timeZone: 'Asia/Riyadh', ...o }).format(d);
  if (grain === 'year') return b.slice(0, 4);
  if (grain === 'month') return f({ month: 'short', year: '2-digit' });
  return f({ day: 'numeric', month: 'short' });
}

function ChartTooltip({ active, payload, label, money }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value as number;
  return (
    <div className="rounded-xl border border-cocoa/10 bg-white px-3 py-2 text-xs shadow-lift">
      <p className="text-espresso/55">{label}</p>
      <p className="mt-0.5 font-semibold text-espresso">{money ? formatSAR(v) : v.toLocaleString('en-US')}</p>
    </div>
  );
}

function SeriesChart({ data, dataKey, money, grain }: { data: Report['series']; dataKey: keyof Report['series'][number]; money?: boolean; grain: Grain }) {
  const rows = data.map((d) => ({ ...d, label: bucketLabel(d.bucket, grain) }));
  return (
    <div className="h-64" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke="rgba(96,53,31,.08)" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: 'rgba(96,53,31,.15)' }} interval="preserveStartEnd" minTickGap={16} reversed />
          <YAxis orientation="right" tick={AXIS} tickLine={false} axisLine={false} width={48} allowDecimals={false} tickFormatter={money ? sar : undefined} />
          <Tooltip cursor={{ fill: 'rgba(188,137,101,.12)' }} content={<ChartTooltip money={money} />} />
          <Bar dataKey={dataKey as string} fill={INK} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RankingBars({ rows, valueKey, money }: { rows: { name: string; units: number; revenue: number }[]; valueKey: 'units' | 'revenue'; money?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => Number(r[valueKey])));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.name} className="group">
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate font-medium">{r.name}</span>
            <span className="shrink-0 tabular-nums text-espresso/70">{money ? formatSAR(Number(r[valueKey])) : `${r[valueKey]} قطعة`}</span>
          </div>
          <div className="h-2 rounded-full bg-cream-200" title={money ? formatSAR(Number(r[valueKey])) : `${r[valueKey]}`}>
            <div className="h-2 rounded-full bg-cocoa transition-all group-hover:bg-caramel-dark" style={{ width: `${(Number(r[valueKey]) / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Analytics() {
  const [preset, setPreset] = useState<Preset>('month');
  const [custom, setCustom] = useState({ from: addDays(riyadhToday(), -29), to: riyadhToday() });
  const [grain, setGrain] = useState<Grain>('day');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [category, setCategory] = useState('');
  const [productMetric, setProductMetric] = useState<'units' | 'revenue'>('units');
  const range = rangeFor(preset, custom);

  const { data: cats } = useData(async () => must(await supabase.from('categories').select('id, name_ar').order('sort_order')) as Pick<Category, 'id' | 'name_ar'>[]);
  const { data, loading, error } = useData(async () => {
    const res = await supabase.rpc('dafwa_sales_report', {
      p_from: range.from, p_to: range.to,
      p_statuses: status ? [status] : null, p_payments: payment ? [payment] : null,
      p_category: category || null, p_grain: grain,
    });
    return must(res) as Report;
  }, [range.from, range.to, status, payment, category, grain]);

  const s = data?.summary;
  const products = useMemo(() => [...(data?.products ?? [])].sort((a, b) => Number(b[productMetric]) - Number(a[productMetric])).slice(0, 10), [data, productMetric]);

  const exportCsv = () => {
    if (!data || !s) return;
    downloadCsv(`dafwa-sales-${range.from}_${range.to}.csv`, [
      ['تقرير مبيعات دفوة', `${range.from} → ${range.to}`],
      ['الفلاتر', `الحالة: ${status ? ORDER_STATUS_AR[status as keyof typeof ORDER_STATUS_AR] : 'الكل'} | الدفع: ${payment ? PAYMENT_STATUS_AR[payment as keyof typeof PAYMENT_STATUS_AR] : 'الكل'}`],
      [],
      ['المؤشر', 'القيمة'],
      ['عدد الطلبات (الكل)', s.orders_total],
      ['الطلبات الناجحة (غير ملغاة)', s.orders_successful],
      ['الطلبات الملغاة', s.orders_cancelled],
      ['بانتظار التأكيد', s.orders_pending],
      ['القطع المباعة', s.units_sold],
      ['إجمالي المبيعات (قبل الخصم)', halalasToSar(s.gross_sales)],
      ['الخصومات', halalasToSar(s.discounts)],
      ['صافي المبيعات', halalasToSar(s.net_sales)],
      ['رسوم التوصيل', halalasToSar(s.delivery_fees)],
      ['إجمالي الفواتير', halalasToSar(s.total_billed)],
      ['المحصّل', halalasToSar(s.collected)],
      ['غير المحصّل', halalasToSar(s.unpaid)],
      ['متوسط قيمة الطلب', halalasToSar(s.average_order_value)],
      [],
      ['الفترة', 'الطلبات', 'الملغاة', 'القطع', 'صافي المبيعات', 'إجمالي الفواتير', 'المحصّل'],
      ...data.series.map((r) => [r.bucket, r.orders, r.cancelled, r.units, halalasToSar(r.net_sales), halalasToSar(r.total_billed), halalasToSar(r.collected)]),
      [],
      ['المنتج', 'القطع', 'الإيراد (قبل الخصم)', 'عدد الطلبات'],
      ...data.products.map((p) => [p.name, p.units, halalasToSar(p.revenue), p.orders]),
    ]);
  };

  return (
    <div>
      <PageHeader title="تحليلات المبيعات" subtitle="أرقام حقيقية من الطلبات المسجلة — بتوقيت مكة المكرمة" actions={<button onClick={exportCsv} disabled={!data} className="btn-secondary btn-sm"><Download className="h-4 w-4" /> تصدير CSV</button>} />

      <Panel className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap rounded-full bg-cream-200 p-1 text-sm">
            {([['today', 'اليوم'], ['7d', 'آخر 7 أيام'], ['month', 'هذا الشهر'], ['year', 'هذه السنة'], ['custom', 'مخصص']] as [Preset, string][]).map(([k, l]) => (
              <button key={k} onClick={() => { setPreset(k); setGrain(k === 'year' ? 'month' : 'day'); }} className={clsx('rounded-full px-3.5 py-1.5', preset === k ? 'bg-white font-semibold shadow-sm' : 'text-espresso/60')}>{l}</button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex gap-2">
              <input type="date" className="input w-auto py-2 text-sm" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} aria-label="من" />
              <input type="date" className="input w-auto py-2 text-sm" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} aria-label="إلى" />
            </div>
          )}
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-auto py-2 text-sm" aria-label="حالة الطلب">
            <option value="">كل الحالات</option>
            {ORDER_STATUSES.map((x) => <option key={x} value={x}>{ORDER_STATUS_AR[x]}</option>)}
          </select>
          <select value={payment} onChange={(e) => setPayment(e.target.value)} className="input w-auto py-2 text-sm" aria-label="حالة الدفع">
            <option value="">كل حالات الدفع</option>
            {PAYMENT_STATUSES.map((x) => <option key={x} value={x}>{PAYMENT_STATUS_AR[x]}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input w-auto py-2 text-sm" aria-label="التصنيف">
            <option value="">كل التصنيفات</option>
            {cats?.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
          </select>
          {loading && <Spinner className="h-4 w-4 text-cocoa" />}
        </div>
      </Panel>

      {error && <p className="mb-4 text-sm text-red-700">تعذر تحميل التقرير: {error}</p>}
      {!data ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="صافي المبيعات" value={formatSAR(s!.net_sales)} hint="بعد الخصم، بدون التوصيل والملغاة" tone="accent" />
            <StatCard label="المحصّل فعليًا" value={formatSAR(s!.collected)} hint="مدفوع / مدفوع جزئيًا" />
            <StatCard label="غير محصّل" value={formatSAR(s!.unpaid)} hint="طلبات غير ملغاة لم تُدفع بالكامل" tone={s!.unpaid ? 'warn' : 'default'} />
            <StatCard label="متوسط قيمة الطلب" value={formatSAR(s!.average_order_value)} />
            <StatCard label="عدد الطلبات" value={s!.orders_successful} hint={`${s!.orders_total} إجمالي · ${s!.orders_cancelled} ملغي`} />
            <StatCard label="القطع المباعة" value={s!.units_sold} />
            <StatCard label="بانتظار التأكيد" value={s!.orders_pending} />
            <StatCard label="الطلبات الملغاة" value={s!.orders_cancelled} hint="غير محسوبة في المبيعات" />
          </div>

          <Panel className="mt-6" title="تفصيل الإيراد">
            <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['إجمالي المبيعات (قبل الخصم)', s!.gross_sales],
                ['− الخصومات', s!.discounts],
                ['= صافي المبيعات', s!.net_sales],
                ['+ رسوم التوصيل', s!.delivery_fees],
                ['= إجمالي الفواتير', s!.total_billed],
                ['منه المحصّل', s!.collected],
              ].map(([l, v]) => (
                <div key={l as string} className="flex justify-between border-b border-cocoa/5 py-2"><dt className="text-espresso/60">{l}</dt><dd className="font-medium tabular-nums">{formatSAR(v as number)}</dd></div>
              ))}
            </dl>
            <p className="mt-4 flex gap-2 text-xs leading-relaxed text-espresso/50"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />الفترة حسب تاريخ إنشاء الطلب. الطلبات الملغاة لا تُحسب ضمن المبيعات، والطلبات غير المدفوعة لا تُحسب ضمن المحصّل.</p>
          </Panel>

          <div className="mt-6 flex items-center gap-2 text-sm">
            <span className="text-espresso/55">التجميع:</span>
            {([['day', 'يومي'], ['week', 'أسبوعي'], ['month', 'شهري'], ['year', 'سنوي']] as [Grain, string][]).map(([g, l]) => (
              <button key={g} onClick={() => setGrain(g)} className={clsx('chip px-3 py-1.5', grain === g ? 'bg-cocoa text-white' : 'bg-cream-200 text-espresso/70')}>{l}</button>
            ))}
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <Panel title="صافي المبيعات عبر الوقت (ر.س)">{s!.orders_total ? <SeriesChart data={data.series} dataKey="net_sales" money grain={grain} /> : <Empty>لا توجد بيانات في هذه الفترة.</Empty>}</Panel>
            <Panel title="عدد الطلبات عبر الوقت">{s!.orders_total ? <SeriesChart data={data.series} dataKey="orders" grain={grain} /> : <Empty>لا توجد بيانات في هذه الفترة.</Empty>}</Panel>
            <Panel title="المحصّل عبر الوقت (ر.س)">{s!.orders_total ? <SeriesChart data={data.series} dataKey="collected" money grain={grain} /> : <Empty>لا توجد بيانات.</Empty>}</Panel>
            <Panel title="القطع المباعة عبر الوقت">{s!.orders_total ? <SeriesChart data={data.series} dataKey="units" grain={grain} /> : <Empty>لا توجد بيانات.</Empty>}</Panel>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel
              title="ترتيب المنتجات"
              actions={
                <div className="flex rounded-full bg-cream-200 p-0.5 text-xs">
                  <button onClick={() => setProductMetric('units')} className={clsx('rounded-full px-3 py-1', productMetric === 'units' && 'bg-white font-semibold shadow-sm')}>بالكمية</button>
                  <button onClick={() => setProductMetric('revenue')} className={clsx('rounded-full px-3 py-1', productMetric === 'revenue' && 'bg-white font-semibold shadow-sm')}>بالإيراد</button>
                </div>
              }
            >
              {products.length ? <RankingBars rows={products} valueKey={productMetric} money={productMetric === 'revenue'} /> : <Empty>لا توجد مبيعات.</Empty>}
              <p className="mt-4 text-[11px] text-espresso/45">الإيراد هنا بسعر البيع قبل خصم الكود على مستوى الطلب.</p>
            </Panel>
            <Panel title="التصنيفات الأكثر مبيعًا">
              {data.categories.length ? <RankingBars rows={data.categories} valueKey="units" /> : <Empty>لا توجد مبيعات.</Empty>}
            </Panel>
          </div>

          <Panel className="mt-6" title="جدول البيانات" padded={false}>
            <div className="max-h-96 overflow-auto">
              <table className="table-admin">
                <thead><tr><th>الفترة</th><th>الطلبات</th><th>الملغاة</th><th>القطع</th><th>صافي المبيعات</th><th>المحصّل</th></tr></thead>
                <tbody>
                  {data.series.filter((r) => r.orders || r.cancelled).map((r) => (
                    <tr key={r.bucket}><td>{bucketLabel(r.bucket, grain)}</td><td>{r.orders}</td><td>{r.cancelled}</td><td>{r.units}</td><td>{formatSAR(r.net_sales)}</td><td>{formatSAR(r.collected)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
