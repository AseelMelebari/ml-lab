import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Mail, Clock, CalendarDays, MapPin, Info, Copy, Check } from 'lucide-react';
import { fetchReceipt } from '../lib/api';
import type { Receipt } from '../lib/types';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../lib/seo';
import { EmptyState, PageLoader } from '../components/ui';
import { Logo } from '../components/Logo';
import { WhatsAppIcon } from '../components/Icons';
import { buildOrderWhatsAppMessage, whatsappLink } from '../../shared/whatsapp';
import { formatSAR } from '../../shared/money';
import { formatDateAr } from '../../shared/dates';
import { ORDER_STATUS_AR, PAYMENT_STATUS_AR } from '../../shared/labels';
import { LAST_ORDER_STORAGE } from './Checkout';

const hhmm = (ts: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ts));
const timeAr = (ts: string) => new Intl.DateTimeFormat('ar-SA-u-nu-latn', { timeZone: 'Asia/Riyadh', hour: 'numeric', minute: '2-digit' }).format(new Date(ts));

export default function OrderReceived() {
  const { id = '' } = useParams();
  const loc = useLocation() as { state?: { receipt?: Receipt } };
  const { settings } = useStore();
  const [receipt, setReceipt] = useState<Receipt | null | undefined>(loc.state?.receipt ?? undefined);
  const [copied, setCopied] = useState(false);
  useSeo({ title: 'استلمنا طلبك', noindex: true });

  useEffect(() => {
    if (receipt) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(LAST_ORDER_STORAGE) ?? 'null');
      if (saved?.receipt?.order_id === id) {
        setReceipt(saved.receipt);
        fetchReceipt(id, saved.key).then((r) => setReceipt(r.receipt)).catch(() => {});
        return;
      }
    } catch {
      /* ignore */
    }
    setReceipt(null);
  }, [id, receipt]);

  if (receipt === undefined) return <PageLoader />;
  if (receipt === null)
    return (
      <div className="container-x py-20">
        <EmptyState title="لا يمكن عرض هذا الطلب" text="لحماية خصوصيتك، تظهر تفاصيل الطلب فقط على نفس الجهاز بعد إرساله. راجع بريدك الإلكتروني لتفاصيل طلبك." action={<Link to="/" className="btn-primary">العودة للرئيسية</Link>} />
      </div>
    );

  const message = buildOrderWhatsAppMessage({
    ...receipt,
    slot_start: hhmm(receipt.delivery_start),
    slot_end: hhmm(receipt.delivery_end),
  });
  const waHref = whatsappLink(settings.whatsapp_number, message);

  return (
    <div className="relative overflow-hidden">
      <div className="grain absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-cream-200 to-offwhite" aria-hidden="true" />
      <div className="container-x relative max-w-3xl py-12 sm:py-16">
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <span className="mt-8 grid h-16 w-16 animate-fade-up place-items-center rounded-full bg-sage/15 text-sage">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">استلمنا طلبك بنجاح 🤎</h1>
          <p className="mt-3 max-w-lg leading-loose text-espresso/70">
            شكرًا لاختيارك دفوة! طلبك الآن <strong>بانتظار التأكيد</strong>. أكمل التأكيد وترتيبات الدفع عبر واتساب.
          </p>
          <div className="mt-6 flex flex-col items-center rounded-3xl border border-cocoa/10 bg-white px-8 py-4 shadow-soft">
            <span className="text-xs text-espresso/55">رقم الطلب</span>
            <span className="ltr mt-1 font-display text-3xl font-bold tracking-wide text-cocoa">{receipt.order_number}</span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="chip bg-caramel/15 text-cocoa">حالة الطلب: {ORDER_STATUS_AR[receipt.status]}</span>
            <span className="chip bg-cream-300 text-espresso/80">الدفع: {PAYMENT_STATUS_AR[receipt.payment_status]}</span>
          </div>
        </div>

        <div className="card mt-10 p-6 sm:p-8">
          <h2 className="text-lg font-semibold">الخطوة التالية: أرسل طلبك عبر واتساب</h2>
          <p className="mt-2 text-sm leading-relaxed text-espresso/65">
            اضغط الزر ليفتح واتساب برسالة جاهزة فيها ملخص طلبك. راجع الرسالة واضغط إرسال، وبنتواصل معك لتأكيد الطلب والدفع.
          </p>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-5 w-full py-4 text-base">
            <WhatsAppIcon className="h-6 w-6" /> المتابعة عبر واتساب
          </a>
          <details className="mt-4 rounded-2xl bg-cream-100 p-4 text-sm">
            <summary className="cursor-pointer font-medium text-espresso/75">معاينة الرسالة</summary>
            <pre className="mt-3 whitespace-pre-wrap font-sans leading-relaxed text-espresso/80">{message}</pre>
            <button
              type="button"
              className="btn-ghost btn-sm mt-2"
              onClick={() => {
                navigator.clipboard?.writeText(message).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'تم النسخ' : 'نسخ الرسالة'}
            </button>
          </details>
          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-espresso/55">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> طلبك محفوظ لدينا حتى لو ما أرسلت الرسالة، لكن التأكيد والدفع يتمان عبر واتساب. فتح واتساب لا يعني أن الرسالة أُرسلت تلقائيًا.
          </p>
        </div>

        <div className="card mt-6 p-6 sm:p-8">
          <h2 className="mb-4 text-lg font-semibold">ملخص الطلب</h2>
          <ul className="divide-y divide-cocoa/10">
            {receipt.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-3 py-3 text-sm">
                <span><span className="font-medium">{i.name}</span>{i.variant && <span className="text-espresso/55"> — {i.variant}</span>} <span className="text-espresso/50">× {i.quantity}</span></span>
                <span className="tabular-nums">{formatSAR(i.line_total_halalas)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-cocoa/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-espresso/60">المجموع</dt><dd>{formatSAR(receipt.subtotal_halalas)}</dd></div>
            {receipt.discount_halalas > 0 && <div className="flex justify-between text-sage"><dt>الخصم</dt><dd>- {formatSAR(receipt.discount_halalas)}</dd></div>}
            <div className="flex justify-between"><dt className="text-espresso/60">التوصيل</dt><dd>{formatSAR(receipt.delivery_fee_halalas)}</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>الإجمالي</dt><dd className="text-cocoa">{formatSAR(receipt.total_halalas)}</dd></div>
          </dl>
          <div className="mt-6 grid gap-3 rounded-2xl bg-cream-100 p-4 text-sm sm:grid-cols-3">
            <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-caramel" /> {formatDateAr(receipt.delivery_date)}</p>
            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-caramel" /> {receipt.slot_label} ({timeAr(receipt.delivery_start)})</p>
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-caramel" /> {receipt.neighborhood}</p>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-espresso/60">
            <Mail className="h-4 w-4 text-caramel" /> أرسلنا تأكيد استلام الطلب إلى <span className="ltr font-medium">{receipt.customer_email}</span>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link to="/shop" className="btn-ghost">العودة للمتجر</Link>
        </div>
      </div>
    </div>
  );
}
