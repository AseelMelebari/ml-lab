import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Send, RotateCcw, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData, must } from '../useData';
import { adminFetch } from '../auth';
import { PageHeader, Panel, EmailBadge, Empty } from '../ui';
import { PageLoader, Spinner } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { EMAIL_KIND_AR } from '../../../shared/labels';
import { formatDateTimeAr } from '../../../shared/dates';

interface Row { id: string; order_id: string; kind: string; recipient: string; status: string; attempts: number; last_error: string | null; sent_at: string | null; created_at: string; next_attempt_at: string; order: { order_number: string } | null }

export default function Emails() {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, loading, reload } = useData(async () => {
    let q = supabase.from('email_notifications').select('*, order:orders(order_number)').order('created_at', { ascending: false }).limit(200);
    if (filter === 'problems') q = q.in('status', ['failed', 'dead']);
    else if (filter) q = q.eq('status', filter);
    return must(await q) as Row[];
  }, [filter]);

  const dispatch = async () => {
    setBusy(true);
    try {
      const r = await adminFetch<{ processed: number; sent: number; failed: number }>('/api/email-dispatch');
      toast(r.failed ? 'error' : 'success', r.processed ? `تمت معالجة ${r.processed}: ${r.sent} مقبولة، ${r.failed} فشلت` : 'لا توجد رسائل مستحقة الآن');
      reload();
    } catch (e) {
      toast('error', `تعذر التشغيل: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const retry = async (id: string) => {
    const { error } = await supabase.rpc('dafwa_retry_email', { p_id: id });
    if (error) return toast('error', 'تعذر إعادة الجدولة');
    await adminFetch('/api/email-dispatch').catch(() => {});
    reload();
  };

  if (loading && !data) return <PageLoader />;
  return (
    <div>
      <PageHeader title="إشعارات البريد" subtitle="سجل كل رسائل البريد المرسلة للمالك والعملاء" actions={<button onClick={dispatch} disabled={busy} className="btn-primary btn-sm">{busy ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />} إرسال المعلّق الآن</button>} />
      <div className="mb-5 flex flex-wrap gap-2 text-sm">
        {[['', 'الكل'], ['sent', 'مقبولة'], ['pending', 'بالانتظار'], ['problems', 'فشلت']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={clsx('chip px-4 py-2', filter === k ? 'bg-cocoa text-white' : 'bg-cream-200 text-espresso/70')}>{l}</button>
        ))}
      </div>
      <p className="mb-4 flex gap-2 rounded-2xl bg-cream-100 p-3 text-xs leading-relaxed text-espresso/60">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        «مقبولة» تعني أن خدمة Resend استلمت الرسالة للإرسال — ولا تضمن وصولها لصندوق الوارد (قد تصل للبريد غير الهام). الرسائل الفاشلة تُعاد تلقائيًا كل 5 دقائق بفواصل متزايدة حتى 6 محاولات.
      </p>
      <Panel padded={false}>
        {!data?.length ? <Empty>لا توجد رسائل.</Empty> : (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead><tr><th>الطلب</th><th>النوع</th><th>المستلم</th><th>الحالة</th><th>المحاولات</th><th>الوقت</th><th></th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <td>{r.order ? <Link to={`/admin/orders/${r.order_id}`} className="ltr font-semibold text-cocoa hover:underline">{r.order.order_number}</Link> : '—'}</td>
                    <td className="text-xs">{EMAIL_KIND_AR[r.kind] ?? r.kind}</td>
                    <td className="ltr text-right text-xs">{r.recipient}</td>
                    <td><EmailBadge status={r.status} />{r.last_error && <div className="mt-1 max-w-[220px] truncate text-[11px] text-red-700" title={r.last_error}>{r.last_error}</div>}</td>
                    <td className="text-xs">{r.attempts}</td>
                    <td className="whitespace-nowrap text-xs text-espresso/55">{formatDateTimeAr(r.sent_at ?? r.created_at)}</td>
                    <td>{['failed', 'dead'].includes(r.status) && <button onClick={() => retry(r.id)} className="btn-ghost btn-sm"><RotateCcw className="h-4 w-4" /> إعادة</button>}</td>
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
