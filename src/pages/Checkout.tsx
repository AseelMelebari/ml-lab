import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { CalendarDays, Clock, Lock, MessageCircle, ShoppingBag, User, MapPin, AlertCircle, NotebookPen } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../lib/seo';
import { createOrder, fetchActiveZones, fetchAvailability, ApiError } from '../lib/api';
import type { Availability, DeliveryZone } from '../lib/types';
import { MapPicker, zoneFor } from '../components/MapPicker';
import { EmptyState, Field, PageLoader, Spinner } from '../components/ui';
import { WhatsAppIcon } from '../components/Icons';
import { PromoInput, Totals, usePricedCart } from './Cart';
import { checkoutSchema } from '../../shared/checkout-schema';
import { errorMessageAr } from '../../shared/labels';
import { formatTimeAr } from '../../shared/dates';
import { formatSAR } from '../../shared/money';
import { whatsappLink } from '../../shared/whatsapp';
import type { LatLng } from '../../shared/geo';
import { randomId } from '../lib/image';

const KEY_STORAGE = 'dafwa-checkout-key';
export const LAST_ORDER_STORAGE = 'dafwa-last-order';

function idempotencyKey(): string {
  try {
    const existing = sessionStorage.getItem(KEY_STORAGE);
    if (existing) return existing;
    const k = `ck_${Date.now().toString(36)}_${randomId(20)}`;
    sessionStorage.setItem(KEY_STORAGE, k);
    return k;
  } catch {
    return `ck_${Date.now().toString(36)}_${randomId(20)}`;
  }
}

function Section({ n, icon: Icon, title, children, subtitle }: { n: number; icon: typeof User; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-7">
      <header className="mb-6 flex items-center gap-3">
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream-200 text-cocoa">
          <Icon className="h-5 w-5" />
          <span className="absolute -left-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-cocoa text-[10px] font-bold text-white">{n}</span>
        </span>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-espresso/55">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function dayLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00+03:00`);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { timeZone: 'Asia/Riyadh', ...o }).format(d);
  return { weekday: f({ weekday: 'long' }), day: f({ day: 'numeric' }), month: f({ month: 'short' }) };
}

const REASON_AR = { lead_time: 'أقل من 24 ساعة', full: 'مكتمل', unavailable: 'غير متاح' } as const;

export default function Checkout() {
  const { items, promoCode, clear } = useCart();
  const { settings } = useStore();
  const nav = useNavigate();
  useSeo({ title: 'إتمام الطلب', noindex: true });

  const [avail, setAvail] = useState<Availability | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loadError, setLoadError] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [diffWhatsapp, setDiffWhatsapp] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [location, setLocation] = useState<LatLng | null>(null);
  const [neighborhood, setNeighborhood] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [apartment, setApartment] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const zone = zoneFor(location, zones);
  const { quote, error: quoteError, loading: quoteLoading } = usePricedCart(zone ? location : null);

  useEffect(() => {
    Promise.all([fetchAvailability(), fetchActiveZones()])
      .then(([a, z]) => {
        setAvail(a);
        setZones(z);
        const first = a.days.find((d) => d.slots.some((s) => s.available));
        if (first) setDate(first.date);
      })
      .catch(() => setLoadError(true));
  }, []);

  const day = useMemo(() => avail?.days.find((d) => d.date === date) ?? null, [avail, date]);
  useEffect(() => {
    if (day && !day.slots.some((s) => s.slot_id === slotId && s.available)) setSlotId(day.slots.find((s) => s.available)?.slot_id ?? null);
  }, [day, slotId]);

  useEffect(() => {
    if (zone && !neighborhood) setNeighborhood(zone.name_ar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone?.id]);

  if (!items.length)
    return (
      <div className="container-x py-20">
        <EmptyState icon={<ShoppingBag className="h-10 w-10" />} title="سلتك فاضية" text="أضف منتجات للسلة أولًا." action={<Link to="/shop" className="btn-primary">تسوق الآن</Link>} />
      </div>
    );
  if (loadError)
    return (
      <div className="container-x py-20">
        <EmptyState icon={<AlertCircle className="h-10 w-10" />} title="تعذر تحميل مواعيد التوصيل" text="فضلًا حدّث الصفحة وحاول مرة أخرى." action={<button className="btn-primary" onClick={() => window.location.reload()}>تحديث</button>} />
      </div>
    );
  if (!avail) return <PageLoader />;

  if (!avail.accepting_orders || !avail.checkout_configured) {
    return (
      <div className="container-x py-20">
        <EmptyState
          icon={<Clock className="h-10 w-10" />}
          title={!avail.accepting_orders ? 'استقبال الطلبات متوقف مؤقتًا' : 'الطلب عبر الموقع غير متاح بعد'}
          text={!avail.accepting_orders ? avail.closure_message : 'نجهّز مناطق ومواعيد التوصيل حاليًا. تواصل معنا عبر واتساب.'}
          action={<a href={whatsappLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp"><WhatsAppIcon /> تواصل عبر واتساب</a>}
        />
      </div>
    );
  }

  const selectedSlot = day?.slots.find((s) => s.slot_id === slotId) ?? null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    const payload = {
      idempotency_key: idempotencyKey(),
      customer: { name, phone, email, whatsapp: diffWhatsapp ? whatsapp : null },
      location: { lat: location?.lat, lng: location?.lng, neighborhood, building, floor, apartment, instructions },
      delivery: { date: date ?? undefined, slot_id: slotId ?? undefined },
      items: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity, notes: i.notes })),
      promo_code: promoCode,
      notes,
      website: honeypot,
    };
    const parsed = checkoutSchema.safeParse(payload);
    const errs: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const k = issue.path.join('.');
        if (!errs[k]) errs[k] = issue.message;
      }
    }
    if (location && !zone) errs['location.lat'] = 'الموقع خارج نطاق التوصيل المعتمد داخل مكة المكرمة.';
    if (!location) errs['location.lat'] = 'فضلًا حدد موقع التوصيل على الخريطة.';
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = document.querySelector('[data-error="true"]');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await createOrder(parsed.data);
      try {
        sessionStorage.setItem(LAST_ORDER_STORAGE, JSON.stringify({ key: payload.idempotency_key, receipt: res.receipt }));
        sessionStorage.removeItem(KEY_STORAGE);
      } catch {
        /* ignore */
      }
      clear();
      nav(`/order/${res.receipt.order_id}`, { replace: true, state: { receipt: res.receipt } });
    } catch (err) {
      const e = err as ApiError;
      if (e.code === 'VALIDATION') setSubmitError(e.message || 'فضلًا راجع البيانات.');
      else if (e.code === 'NETWORK') setSubmitError(e.message);
      else setSubmitError(errorMessageAr(e.code));
      // Slot may have filled up: refresh availability
      if (['SLOT_FULL', 'LEAD_TIME', 'DATE_UNAVAILABLE', 'INVALID_SLOT'].includes(e.code)) fetchAvailability().then(setAvail).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  const err = (k: string) => errors[k] ?? null;
  const inputCls = (k: string) => clsx('input', err(k) && 'input-error');

  return (
    <div className="bg-cream-100/50">
      <div className="container-x py-10 sm:py-14">
        <div className="mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl">إتمام الطلب</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-espresso/60"><Lock className="h-4 w-4" /> بدون إنشاء حساب — بياناتك تُستخدم فقط لتوصيل طلبك.</p>
        </div>

        <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          <div className="min-w-0 space-y-6 lg:col-span-3">
            {/* Honeypot (hidden from humans) */}
            <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            <Section n={1} icon={User} title="بيانات التواصل">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2" data-error={!!err('customer.name')}>
                  <Field label="الاسم الكامل" required error={err('customer.name')} htmlFor="name">
                    <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls('customer.name')} placeholder="مثال: سارة محمد" />
                  </Field>
                </div>
                <div data-error={!!err('customer.phone')}>
                  <Field label="رقم الجوال" required error={err('customer.phone')} hint="مثال: 05XXXXXXXX" htmlFor="phone">
                    <input id="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className={clsx(inputCls('customer.phone'), 'text-right')} placeholder="05XXXXXXXX" />
                  </Field>
                </div>
                <div data-error={!!err('customer.email')}>
                  <Field label="البريد الإلكتروني" required error={err('customer.email')} hint="نرسل لك تأكيد استلام الطلب" htmlFor="email">
                    <input id="email" type="email" inputMode="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={clsx(inputCls('customer.email'), 'text-right')} placeholder="name@example.com" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input type="checkbox" checked={diffWhatsapp} onChange={(e) => setDiffWhatsapp(e.target.checked)} className="h-4 w-4 rounded accent-cocoa" />
                    رقم الواتساب مختلف عن رقم الجوال
                  </label>
                  {diffWhatsapp && (
                    <div className="mt-3" data-error={!!err('customer.whatsapp')}>
                      <Field label="رقم الواتساب" error={err('customer.whatsapp')} htmlFor="wa">
                        <input id="wa" type="tel" inputMode="tel" dir="ltr" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={clsx(inputCls('customer.whatsapp'), 'text-right')} placeholder="05XXXXXXXX" />
                      </Field>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            <Section n={2} icon={MapPin} title="موقع التوصيل" subtitle="التوصيل داخل مكة المكرمة فقط">
              <div className="space-y-4">
                <div data-error={!!err('location.lat')}>
                  <MapPicker value={location} zones={zones} onChange={setLocation} error={err('location.lat') ?? err('location.lng')} />
                </div>
                <div data-error={!!err('location.neighborhood')}>
                  <Field label="الحي" required error={err('location.neighborhood')} htmlFor="hood">
                    <input id="hood" list="hoods" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={inputCls('location.neighborhood')} placeholder="مثال: العزيزية" />
                    <datalist id="hoods">{zones.map((z) => <option key={z.id} value={z.name_ar} />)}</datalist>
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="رقم المبنى" htmlFor="bld"><input id="bld" value={building} onChange={(e) => setBuilding(e.target.value)} className="input" /></Field>
                  <Field label="الدور" htmlFor="flr"><input id="flr" value={floor} onChange={(e) => setFloor(e.target.value)} className="input" /></Field>
                  <Field label="الشقة" htmlFor="apt"><input id="apt" value={apartment} onChange={(e) => setApartment(e.target.value)} className="input" /></Field>
                </div>
                <Field label="تعليمات إضافية للتوصيل" htmlFor="ins">
                  <textarea id="ins" rows={2} maxLength={500} value={instructions} onChange={(e) => setInstructions(e.target.value)} className="input resize-none" placeholder="مثال: البوابة الجانبية، بجوار المسجد…" />
                </Field>
              </div>
            </Section>

            <Section n={3} icon={CalendarDays} title="موعد التوصيل" subtitle={`الطلب قبل موعد التسليم بـ ${avail.lead_time_hours} ساعة على الأقل`}>
              {avail.days.length === 0 ? (
                <p className="rounded-2xl bg-cream-100 p-4 text-sm text-espresso/70">لا توجد مواعيد متاحة حاليًا. تواصل معنا عبر واتساب.</p>
              ) : (
                <>
                  <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="radiogroup" aria-label="تاريخ التوصيل">
                    {avail.days.map((d) => {
                      const anyAvail = d.slots.some((s) => s.available);
                      const l = dayLabel(d.date);
                      return (
                        <button
                          type="button"
                          key={d.date}
                          role="radio"
                          aria-checked={date === d.date}
                          disabled={!anyAvail}
                          onClick={() => setDate(d.date)}
                          className={clsx(
                            'flex w-[76px] shrink-0 flex-col items-center rounded-2xl border px-2 py-3 transition disabled:cursor-not-allowed disabled:opacity-35',
                            date === d.date ? 'border-cocoa bg-cocoa text-white shadow-soft' : 'border-cocoa/15 bg-white hover:border-cocoa/40',
                          )}
                        >
                          <span className="text-[11px] opacity-75">{l.weekday}</span>
                          <span className="font-display text-2xl font-semibold leading-tight">{l.day}</span>
                          <span className="text-[11px] opacity-75">{l.month}</span>
                        </button>
                      );
                    })}
                  </div>
                  {day && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="وقت التوصيل" data-error={!!err('delivery.slot_id')}>
                      {day.slots.map((s) => (
                        <button
                          type="button"
                          key={s.slot_id}
                          role="radio"
                          aria-checked={slotId === s.slot_id}
                          disabled={!s.available}
                          onClick={() => setSlotId(s.slot_id)}
                          className={clsx(
                            'flex items-center justify-between rounded-2xl border px-4 py-3.5 text-right transition disabled:cursor-not-allowed disabled:opacity-45',
                            slotId === s.slot_id ? 'border-cocoa bg-cream-200 ring-2 ring-cocoa/20' : 'border-cocoa/15 bg-white hover:border-cocoa/40',
                          )}
                        >
                          <span>
                            <span className="block font-semibold">{s.label}</span>
                            <span className="text-sm text-espresso/60">{formatTimeAr(s.start)} – {formatTimeAr(s.end)}</span>
                          </span>
                          {!s.available && s.reason && <span className="chip bg-cream-300 text-espresso/70">{REASON_AR[s.reason]}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {(err('delivery.date') || err('delivery.slot_id')) && <p className="field-error">{err('delivery.date') || err('delivery.slot_id')}</p>}
                </>
              )}
            </Section>

            <Section n={4} icon={NotebookPen} title="ملاحظات الطلب" subtitle="اختياري">
              <textarea rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} className="input resize-none" placeholder="أي ملاحظة تحب نعرفها عن طلبك…" aria-label="ملاحظات الطلب" />
            </Section>

            <Section n={5} icon={MessageCircle} title="طريقة الدفع">
              <div className="flex items-start gap-4 rounded-2xl border-2 border-cocoa bg-cream-100 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1F8F55] text-white"><WhatsAppIcon /></span>
                <div>
                  <p className="font-semibold">الدفع عبر واتساب</p>
                  <p className="mt-1 text-sm leading-relaxed text-espresso/65">
                    بعد إرسال الطلب، تنتقل لواتساب لإرسال ملخص طلبك لنا. نتواصل معك لتأكيد الطلب وترتيبات الدفع والتوصيل. الطلب لا يُعتبر مؤكدًا أو مدفوعًا حتى نؤكده لك.
                  </p>
                </div>
              </div>
            </Section>
          </div>

          {/* Summary */}
          <aside className="min-w-0 lg:col-span-2">
            <div className="card space-y-5 p-5 sm:p-7 lg:sticky lg:top-28">
              <h2 className="text-lg font-semibold">مراجعة الطلب</h2>
              <ul className="max-h-72 space-y-3 overflow-y-auto">
                {(quote?.lines ?? []).length
                  ? quote!.lines.map((l, i) => (
                      <li key={i} className="flex justify-between gap-3 text-sm">
                        <span><span className="font-medium">{l.product_name_ar}</span>{l.variant_name && <span className="text-espresso/55"> — {l.variant_name}</span>} <span className="text-espresso/50">× {l.quantity}</span></span>
                        <span className="shrink-0 tabular-nums">{formatSAR(l.line_total_halalas)}</span>
                      </li>
                    ))
                  : items.map((i) => (
                      <li key={i.key} className="flex justify-between gap-3 text-sm">
                        <span><span className="font-medium">{i.name}</span>{i.variant_name && <span className="text-espresso/55"> — {i.variant_name}</span>} <span className="text-espresso/50">× {i.quantity}</span></span>
                        <span className="shrink-0 tabular-nums">{formatSAR(i.unit_price_halalas * i.quantity)}</span>
                      </li>
                    ))}
              </ul>
              <PromoInput />
              {quoteError && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{errorMessageAr(quoteError.code)}</p>}
              <Totals quote={quote} loading={quoteLoading} />
              {date && selectedSlot && (
                <div className="rounded-2xl bg-cream-100 p-4 text-sm">
                  <p className="flex items-center gap-2 font-medium"><CalendarDays className="h-4 w-4 text-caramel" /> {dayLabel(date).weekday} {dayLabel(date).day} {dayLabel(date).month}</p>
                  <p className="mt-1 flex items-center gap-2 text-espresso/65"><Clock className="h-4 w-4 text-caramel" /> {selectedSlot.label} ({formatTimeAr(selectedSlot.start)} – {formatTimeAr(selectedSlot.end)})</p>
                  {zone && <p className="mt-1 flex items-center gap-2 text-espresso/65"><MapPin className="h-4 w-4 text-caramel" /> {zone.name_ar}</p>}
                </div>
              )}
              {submitError && (
                <p className="flex gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{submitError}</p>
              )}
              <button type="submit" disabled={submitting || !!quoteError} className="btn-primary w-full py-4 text-base">
                {submitting ? <><Spinner className="h-5 w-5" /> جارٍ إرسال الطلب…</> : 'إرسال الطلب'}
              </button>
              <p className="text-center text-xs leading-relaxed text-espresso/50">
                بإرسال الطلب أنت توافق على <Link to="/privacy" className="underline">سياسة الخصوصية</Link>. يتم اعتماد الأسعار النهائية من النظام عند الإرسال.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
