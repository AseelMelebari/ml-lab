import { Link } from 'react-router-dom';
import { ClipboardList, CalendarClock, Wallet, AlertTriangle, CheckCircle2, Circle, ArrowLeft, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData, must } from '../useData';
import { PageHeader, Panel, StatCard, StatusBadge, PaymentBadge, Empty } from '../ui';
import { PageLoader } from '../../components/ui';
import { formatSAR } from '../../../shared/money';
import { formatDateAr, formatDateTimeAr } from '../../../shared/dates';
import type { Order } from '../../lib/types';

interface OverviewData {
  today: number; week: number; month: number; year: number;
  pending_confirmation: number; pending_payment_value: number;
  deliveries_today: number; deliveries_tomorrow: number; emails_failed: number;
  active_zones: number; active_slots: number; active_products: number;
}

export default function Overview() {
  const { data, loading, error } = useData(async () => {
    const [ov, recent, settings] = await Promise.all([
      supabase.rpc('dafwa_admin_overview'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(8),
      supabase.from('store_settings').select('accepting_orders').single(),
    ]);
    return { ov: must(ov) as OverviewData, recent: must(recent) as Order[], accepting: settings.data?.accepting_orders ?? true };
  });

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <p className="text-red-700">تعذر تحميل البيانات: {error}</p>;
  const { ov, recent } = data;

  const setup = [
    { done: ov.active_products > 0, label: 'أضف منتجًا واحدًا على الأقل', to: '/admin/products/new' },
    { done: ov.active_zones > 0, label: 'فعّل منطقة توصيل داخل مكة ورسومها', to: '/admin/delivery' },
    { done: ov.active_slots > 0, label: 'أضف أوقات التوصيل المتاحة', to: '/admin/delivery' },
  ];
  const setupDone = setup.every((s) => s.done);

  return (
    <div>
      <PageHeader title="أهلًا بك 🤎" subtitle="نظرة سريعة على متجر دفوة اليوم" actions={<Link to="/admin/orders" className="btn-primary btn-sm">كل الطلبات</Link>} />

      {!setupDone && (
        <Panel className="mb-6 border-caramel/40 bg-caramel/5" title="خطوات تجهيز المتجر قبل استقبال الطلبات">
          <p className="mb-4 text-sm text-espresso/65">لن يتمكن العملاء من إرسال الطلبات حتى تكتمل هذه الخطوات.</p>
          <ul className="space-y-2">
            {setup.map((s, i) => (
              <li key={i}>
                <Link to={s.to} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm transition hover:shadow-soft">
                  {s.done ? <CheckCircle2 className="h-5 w-5 text-sage" /> : <Circle className="h-5 w-5 text-espresso/30" />}
                  <span className={s.done ? 'text-espresso/50 line-through' : 'font-medium'}>{s.label}</span>
                  {!s.done && <ArrowLeft className="ms-auto h-4 w-4 text-caramel" />}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {!data.accepting && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900"><AlertTriangle className="h-5 w-5" /> استقبال الطلبات متوقف حاليًا من الإعدادات.</div>
      )}
      {ov.emails_failed > 0 && (
        <Link to="/admin/emails" className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900"><AlertTriangle className="h-5 w-5" /> يوجد {ov.emails_failed} رسالة بريد فشل إرسالها — اضغط للمراجعة.</Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="طلبات اليوم" value={ov.today} icon={ClipboardList} tone="accent" />
        <StatCard label="هذا الأسبوع" value={ov.week} />
        <StatCard label="هذا الشهر" value={ov.month} />
        <StatCard label="هذه السنة" value={ov.year} />
        <StatCard label="بانتظار التأكيد" value={ov.pending_confirmation} icon={AlertTriangle} tone={ov.pending_confirmation ? 'warn' : 'default'} />
        <StatCard label="مبالغ غير محصلة" value={formatSAR(ov.pending_payment_value)} icon={Wallet} hint="طلبات غير ملغاة لم تُدفع بالكامل" />
        <StatCard label="توصيل اليوم" value={ov.deliveries_today} icon={Truck} />
        <StatCard label="توصيل بكرة" value={ov.deliveries_tomorrow} icon={CalendarClock} />
      </div>
      <p className="mt-3 text-xs text-espresso/45">الأعداد لا تشمل الطلبات الملغاة. التوقيت حسب مكة المكرمة (Asia/Riyadh).</p>

      <Panel className="mt-8" title="أحدث الطلبات" padded={false} actions={<Link to="/admin/orders" className="text-sm font-medium text-cocoa hover:underline">عرض الكل</Link>}>
        {recent.length === 0 ? (
          <Empty>لا توجد طلبات بعد.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead><tr><th>الطلب</th><th>العميل</th><th>التوصيل</th><th>الإجمالي</th><th>الحالة</th><th>الدفع</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td><Link to={`/admin/orders/${o.id}`} className="font-semibold text-cocoa hover:underline ltr">{o.order_number}</Link><div className="text-xs text-espresso/45">{formatDateTimeAr(o.created_at)}</div></td>
                    <td>{o.customer_name}</td>
                    <td className="whitespace-nowrap text-xs">{formatDateAr(o.delivery_date)}<div className="text-espresso/50">{o.slot_label}</div></td>
                    <td className="whitespace-nowrap font-medium">{formatSAR(o.total_halalas)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><PaymentBadge status={o.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
