import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData, must } from '../useData';
import { PageHeader, Panel, Empty, downloadCsv } from '../ui';
import { PageLoader } from '../../components/ui';
import { WhatsAppIcon } from '../../components/Icons';
import { formatDateTimeAr } from '../../../shared/dates';
import { formatSaudiMobileLocal, normalizeSaudiMobile } from '../../../shared/phone';
import { whatsappLink } from '../../../shared/whatsapp';

interface Customer { id: string; full_name: string; phone: string; email: string; whatsapp: string | null; orders_count: number; first_order_at: string | null; last_order_at: string | null }

export default function Customers() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const { data, loading } = useData(async () => {
    let query = supabase.from('customers').select('*').order('last_order_at', { ascending: false }).limit(500);
    const t = term.replace(/[,()*%\\]/g, ' ').trim();
    if (t) {
      const phone = normalizeSaudiMobile(t);
      query = phone ? query.eq('phone', phone) : query.or(`full_name.ilike.%${t}%,email.ilike.%${t}%`);
    }
    return must(await query) as Customer[];
  }, [term]);

  if (loading && !data) return <PageLoader />;
  return (
    <div>
      <PageHeader
        title="العملاء"
        subtitle="يُنشأ سجل العميل تلقائيًا مع أول طلب (حسب رقم الجوال)"
        actions={<button className="btn-secondary btn-sm" onClick={() => downloadCsv('dafwa-customers.csv', [['الاسم', 'الجوال', 'البريد', 'عدد الطلبات', 'أول طلب', 'آخر طلب'], ...(data ?? []).map((c) => [c.full_name, formatSaudiMobileLocal(c.phone), c.email, c.orders_count, c.first_order_at, c.last_order_at])])}><Download className="h-4 w-4" /> تصدير CSV</button>}
      />
      <form onSubmit={(e) => { e.preventDefault(); setTerm(q); }} className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="الاسم، البريد أو الجوال…" className="input py-2.5 ps-10 text-sm" aria-label="بحث" />
      </form>
      <Panel padded={false}>
        {!data?.length ? <Empty>لا يوجد عملاء بعد.</Empty> : (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead><tr><th>العميل</th><th>الجوال</th><th>البريد</th><th>الطلبات</th><th>آخر طلب</th><th></th></tr></thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.full_name}</td>
                    <td className="ltr text-right">{formatSaudiMobileLocal(c.phone)}</td>
                    <td className="text-xs">{c.email}</td>
                    <td><Link to={`/admin/orders?q=${encodeURIComponent(formatSaudiMobileLocal(c.phone))}`} className="font-semibold text-cocoa hover:underline">{c.orders_count}</Link></td>
                    <td className="text-xs text-espresso/55">{c.last_order_at ? formatDateTimeAr(c.last_order_at) : '—'}</td>
                    <td><a href={whatsappLink((c.whatsapp ?? c.phone).replace(/\D/g, ''))} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full text-[#1F8F55] hover:bg-emerald-50" aria-label="واتساب"><WhatsAppIcon className="h-4 w-4" /></a></td>
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
