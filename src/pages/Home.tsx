import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, MessageCircle, ShoppingBag, CalendarCheck, Cookie as CookieIcon, ChevronDown, Truck, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../lib/seo';
import { fetchBanners } from '../lib/api';
import type { Banner } from '../lib/types';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton, SectionHeading, EmptyState } from '../components/ui';
import { Cookie, Crumbs } from '../components/CookieArt';
import { WhatsAppIcon, InstagramIcon } from '../components/Icons';
import { whatsappLink } from '../../shared/whatsapp';

function Hero() {
  const { settings } = useStore();
  return (
    <section className="relative -mt-[72px] overflow-hidden pt-[72px] sm:-mt-20 sm:pt-20">
      <div className="grain absolute inset-0 bg-gradient-to-b from-cream-200 via-cream-100 to-offwhite" aria-hidden="true" />
      <div className="absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-caramel/15 blur-3xl" aria-hidden="true" />
      <div className="container-x relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-6 lg:py-24">
        <div className="lg:col-span-6">
          <p className="eyebrow mb-5 animate-fade-up">Freshly baked · Makkah</p>
          <h1 className="animate-fade-up text-balance text-[44px] font-bold leading-[1.15] text-espresso [animation-delay:80ms] sm:text-6xl lg:text-[68px]">
            {settings.hero_title.includes('...') ? (
              <>
                {settings.hero_title.split('...')[0]}
                <span className="text-caramel">...</span>
                <br />
                <span className="relative inline-block text-cocoa">
                  {settings.hero_title.split('...')[1]}
                  <svg className="absolute -bottom-3 right-0 w-full text-caramel/60" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M2 10C60 3 140 2 298 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </>
            ) : (
              settings.hero_title
            )}
          </h1>
          <p className="mt-7 max-w-md animate-fade-up text-lg leading-relaxed text-espresso/70 [animation-delay:160ms] sm:text-xl">{settings.hero_subtitle}</p>
          <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:240ms]">
            <Link to="/shop" className="btn-primary px-8 py-4 text-base">
              تسوق الآن <ArrowLeft className="h-4 w-4" />
            </Link>
            <a href="#how" className="btn-ghost text-base">كيف أطلب؟</a>
          </div>
          <ul className="mt-10 flex animate-fade-up flex-wrap gap-x-6 gap-y-3 text-sm text-espresso/70 [animation-delay:320ms]">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-caramel" /> داخل مكة المكرمة فقط</li>
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-caramel" /> اطلب قبلها بـ {settings.lead_time_hours} ساعة</li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-caramel" /> الدفع عبر واتساب</li>
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[460px] lg:col-span-6">
          <div className="relative aspect-[4/5] animate-fade-up [animation-delay:120ms]">
            {/* Arch frame */}
            <div className="absolute inset-x-[6%] bottom-0 top-[4%] overflow-hidden rounded-t-[999px] rounded-b-[40px] bg-gradient-to-b from-cocoa via-cocoa-600 to-espresso shadow-lift">
              {settings.hero_image_url ? (
                <img src={settings.hero_image_url} alt="كوكيز دفوة الطازج" className="h-full w-full object-cover" fetchPriority="high" />
              ) : (
                <>
                  <div className="grain absolute inset-0 opacity-70" />
                  <div className="absolute inset-x-0 top-[12%] text-center font-latin text-[13px] italic tracking-[0.5em] text-caramel-light/70">DAFWA</div>
                  <div className="absolute left-1/2 top-1/2 w-[62%] -translate-x-1/2 -translate-y-[42%]">
                    <Cookie className="w-full animate-float-slow" seed={2} tone="golden" />
                  </div>
                  <Cookie className="absolute -left-[6%] bottom-[6%] w-[38%] rotate-12 animate-float-slow [animation-delay:-2s]" seed={5} tone="cocoa" />
                  <Cookie className="absolute -right-[4%] top-[22%] w-[30%] animate-float-slow [animation-delay:-4s]" seed={7} tone="light" />
                  <Crumbs className="absolute bottom-[8%] right-[18%] w-24 opacity-80" />
                </>
              )}
            </div>
            {/* Floating badges */}
            <div className="absolute -right-2 top-[30%] flex items-center gap-3 rounded-2xl border border-cocoa/10 bg-white/90 px-4 py-3 shadow-lift backdrop-blur sm:-right-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-cream-200 text-cocoa"><Sparkles className="h-5 w-5" /></span>
              <div className="text-sm">
                <p className="font-semibold">يُخبز طازج</p>
                <p className="text-xs text-espresso/55">لطلبك بالذات</p>
              </div>
            </div>
            <div className="absolute -left-2 bottom-[14%] flex items-center gap-3 rounded-2xl border border-cocoa/10 bg-white/90 px-4 py-3 shadow-lift backdrop-blur sm:-left-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-cream-200 text-cocoa"><Truck className="h-5 w-5" /></span>
              <div className="text-sm">
                <p className="font-semibold">توصيل لباب البيت</p>
                <p className="text-xs text-espresso/55">داخل مكة المكرمة</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Banners({ banners }: { banners: Banner[] }) {
  if (!banners.length) return null;
  return (
    <section className="container-x mt-6 grid gap-4 md:grid-cols-2" aria-label="العروض">
      {banners.slice(0, 4).map((b, i) => {
        const inner = (
          <div className={`group relative flex min-h-[200px] overflow-hidden rounded-4xl ${i % 2 ? 'bg-cream-300' : 'bg-cocoa'} p-8 shadow-soft`}>
            {b.image_url && <img src={b.image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />}
            {b.image_url && <div className="absolute inset-0 bg-gradient-to-l from-espresso/80 via-espresso/40 to-transparent" />}
            <div className={`relative flex max-w-sm flex-col justify-center ${b.image_url || i % 2 === 0 ? 'text-cream-50' : 'text-espresso'}`}>
              <h3 className={`text-2xl font-semibold ${b.image_url || i % 2 === 0 ? 'text-cream-50' : ''}`}>{b.title}</h3>
              {b.subtitle && <p className="mt-2 leading-relaxed opacity-85">{b.subtitle}</p>}
              {b.cta_label && <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 group-hover:underline">{b.cta_label} <ArrowLeft className="h-4 w-4" /></span>}
            </div>
          </div>
        );
        return b.link_url ? (
          b.link_url.startsWith('/') ? <Link key={b.id} to={b.link_url}>{inner}</Link> : <a key={b.id} href={b.link_url} target="_blank" rel="noopener noreferrer">{inner}</a>
        ) : (
          <div key={b.id}>{inner}</div>
        );
      })}
    </section>
  );
}

function ProductsSection({ id, eyebrow, title, subtitle, filter }: { id: string; eyebrow: string; title: string; subtitle?: string; filter: 'featured' | 'bestseller' }) {
  const { products, loading, error } = useStore();
  const list = useMemo(() => {
    if (filter === 'featured') {
      const f = products.filter((p) => p.is_featured);
      return (f.length ? f : products).slice(0, 8);
    }
    return products.filter((p) => p.is_bestseller).slice(0, 4);
  }, [products, filter]);

  if (filter === 'bestseller' && !loading && list.length === 0) return null;

  return (
    <section id={id} className="container-x py-20 sm:py-24">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        align="start"
        action={products.length > 0 ? <Link to="/shop" className="btn-secondary btn-sm">عرض كل المنتجات <ArrowLeft className="h-4 w-4" /></Link> : undefined}
      />
      {loading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : list.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      ) : (
        <EmptyState
          icon={<CookieIcon className="h-10 w-10" />}
          title={error ? 'تعذر تحميل المنتجات' : 'قائمتنا تُخبز الآن'}
          text={error ? 'فضلًا حدّث الصفحة بعد قليل.' : 'منتجاتنا بتنزل هنا قريبًا. تابعنا أو تواصل معنا عبر واتساب.'}
        />
      )}
    </section>
  );
}

function Story() {
  const { settings } = useStore();
  const paragraphs = settings.brand_story.split('\n').filter(Boolean);
  return (
    <section className="relative overflow-hidden bg-cream-200 py-24 sm:py-32">
      <div className="grain absolute inset-0" aria-hidden="true" />
      <Cookie className="absolute -right-16 top-10 w-56 opacity-20 sm:w-72" seed={9} tone="cocoa" />
      <Cookie className="absolute -bottom-16 -left-10 w-48 opacity-25 sm:w-64" seed={3} tone="golden" />
      <div className="container-x relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow mb-4">Our story</p>
          <h2 className="text-3xl font-semibold sm:text-4xl">حكاية دفوة</h2>
          <div className="mx-auto mt-4 h-px w-16 bg-caramel" />
          <div className="mt-10 space-y-5 font-display text-xl font-light leading-[2.1] text-espresso/85 sm:text-2xl sm:leading-[2.1]">
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 1 ? 'font-medium text-cocoa' : ''}>{p}</p>
            ))}
          </div>
          <Link to="/about" className="btn-secondary mt-10">اعرف أكثر عن دفوة</Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { settings } = useStore();
  const steps = [
    { icon: CookieIcon, title: 'اختر الكوكيز المفضل', text: 'تصفّح منتجاتنا وأضف اللي يعجبك للسلة.' },
    { icon: MapPin, title: 'حدد موقعك داخل مكة', text: 'اختر موقع التوصيل على الخريطة بدقة.' },
    { icon: CalendarCheck, title: 'اختر موعد التوصيل', text: `قبل موعد التسليم بـ ${settings.lead_time_hours} ساعة على الأقل.` },
    { icon: MessageCircle, title: 'أرسل طلبك وأكمل عبر واتساب', text: 'نأكد معك الطلب وترتيبات الدفع عبر واتساب.' },
  ];
  return (
    <section id="how" className="container-x scroll-mt-28 py-20 sm:py-28">
      <SectionHeading eyebrow="How to order" title="كيف تطلب من دفوة؟" subtitle="أربع خطوات بسيطة، ونخبز لك كل شي طازج." />
      <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="absolute inset-x-[12%] top-12 hidden h-px border-t border-dashed border-caramel/40 lg:block" aria-hidden="true" />
        {steps.map((s, i) => (
          <li key={i} className="card relative flex flex-col items-center px-6 py-9 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lift">
            <span className="relative grid h-[72px] w-[72px] place-items-center rounded-full bg-cream-200 text-cocoa ring-8 ring-white">
              <s.icon className="h-7 w-7" />
              <span className="absolute -left-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-cocoa text-xs font-bold text-white tabular-nums">{i + 1}</span>
            </span>
            <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-espresso/60">{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-3 rounded-full border border-caramel/30 bg-caramel/10 px-5 py-3 text-center text-sm font-medium text-cocoa">
        <Clock className="h-4 w-4 shrink-0" />
        الطلب قبل موعد التسليم بـ {settings.lead_time_hours} ساعة على الأقل
      </div>
    </section>
  );
}

function DeliveryAndContact() {
  const { settings } = useStore();
  return (
    <section className="container-x py-12">
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="card relative overflow-hidden p-8 sm:p-10 lg:col-span-3">
          <p className="eyebrow mb-3">Delivery</p>
          <h2 className="text-2xl font-semibold sm:text-3xl">معلومات التوصيل</h2>
          <p className="mt-4 max-w-lg leading-loose text-espresso/70">{settings.delivery_info}</p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              [MapPin, 'داخل مكة المكرمة فقط'],
              [Clock, `الطلب قبل التسليم بـ ${settings.lead_time_hours} ساعة`],
              [CalendarCheck, 'اختر اليوم والوقت المناسب'],
              [MessageCircle, 'الدفع والتأكيد عبر واتساب'],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof MapPin;
              return (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-cream-100 px-4 py-3 text-sm font-medium">
                  <I className="h-4 w-4 shrink-0 text-caramel" /> {text as string}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-cocoa p-8 text-cream-100 shadow-lift sm:p-10 lg:col-span-2">
          <div className="grain absolute inset-0 opacity-60" aria-hidden="true" />
          <Cookie className="absolute -bottom-10 -left-10 w-44 opacity-30" seed={4} tone="light" />
          <div className="relative">
            <h2 className="text-2xl font-semibold text-cream-50 sm:text-3xl">عندك سؤال؟</h2>
            <p className="mt-3 leading-loose text-cream-100/75">كلمنا على واتساب، ويسعدنا نساعدك في طلبك أو نجاوب على استفساراتك.</p>
          </div>
          <div className="relative mt-8 flex flex-col gap-3">
            <a href={whatsappLink(settings.whatsapp_number, 'السلام عليكم دفوة 🤎')} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              <WhatsAppIcon /> تواصل عبر واتساب
            </a>
            {settings.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="btn border border-cream-50/25 text-cream-50 hover:bg-cream-50/10">
                <InstagramIcon /> تابعنا على إنستقرام
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqList() {
  const { settings } = useStore();
  if (!settings.faqs.length) return null;
  return (
    <div className="mx-auto max-w-3xl divide-y divide-cocoa/10 overflow-hidden rounded-3xl border border-cocoa/10 bg-white">
      {settings.faqs.map((f, i) => (
        <details key={i} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-right font-semibold transition hover:bg-cream-100/60 [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown className="h-5 w-5 shrink-0 text-caramel transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <p className="px-6 pb-6 leading-loose text-espresso/70">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

function Faq() {
  const { settings } = useStore();
  if (!settings.faqs.length) return null;
  return (
    <section className="container-x py-20 sm:py-24" id="faq">
      <SectionHeading eyebrow="FAQ" title="أسئلة شائعة" />
      <FaqList />
    </section>
  );
}

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  useSeo({ description: 'دَفوة — كوكيز طازج فاخر في مكة المكرمة. اطلب أونلاين قبل موعد التسليم بـ 24 ساعة، والتوصيل داخل مكة المكرمة فقط، والدفع والتأكيد عبر واتساب.' });
  useEffect(() => {
    fetchBanners().then(setBanners).catch(() => {});
  }, []);

  return (
    <>
      <Hero />
      <Banners banners={banners} />
      <ProductsSection id="featured" eyebrow="Our selection" title="مختارات دفوة" subtitle="كوكيز يُخبز طازج لكل طلب." filter="featured" />
      <Story />
      <HowItWorks />
      <ProductsSection id="bestsellers" eyebrow="Bestsellers" title="الأكثر طلبًا" filter="bestseller" />
      <DeliveryAndContact />
      <Faq />
      <section className="container-x pb-6 pt-4 text-center">
        <Link to="/shop" className="btn-primary px-8 py-4 text-base">
          <ShoppingBag className="h-5 w-5" /> ابدأ طلبك الآن
        </Link>
      </section>
    </>
  );
}
