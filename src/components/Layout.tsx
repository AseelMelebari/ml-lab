import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Menu, ShoppingBag, X, Truck, MessageCircle, Clock, MapPin, Phone } from 'lucide-react';
import { Logo } from './Logo';
import { CartDrawer } from './CartDrawer';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { WhatsAppIcon, InstagramIcon } from './Icons';
import { whatsappLink } from '../../shared/whatsapp';

const NAV = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/shop', label: 'المتجر' },
  { to: '/about', label: 'عن دفوة' },
  { to: '/contact', label: 'تواصل معنا' },
];

export function AnnouncementBar() {
  const { settings } = useStore();
  return (
    <div className="relative z-40 bg-espresso text-cream-100">
      <div className="container-x flex flex-col items-center justify-center gap-1 py-2 text-center text-[12.5px] leading-relaxed sm:flex-row sm:gap-5 sm:text-[13px]">
        <p className="flex items-center gap-1.5 font-semibold text-cream-50">
          <MapPin className="h-3.5 w-3.5 text-caramel-light" aria-hidden="true" />
          {settings.announcement_primary}
        </p>
        <span className="hidden h-3 w-px bg-cream-50/25 sm:block" aria-hidden="true" />
        <p className="flex items-center gap-1.5 text-cream-200/90">
          <Clock className="h-3.5 w-3.5 text-caramel-light" aria-hidden="true" />
          {settings.announcement_secondary}
        </p>
      </div>
    </div>
  );
}

function Header() {
  const { count, setDrawerOpen } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  return (
    <header className={clsx('sticky top-0 z-30 transition-all duration-300', scrolled ? 'border-b border-cocoa/10 bg-offwhite/85 shadow-[0_8px_30px_-18px_rgba(66,36,23,.35)] backdrop-blur-xl' : 'bg-offwhite/0')}>
      <div className="container-x flex h-[72px] items-center justify-between gap-4 sm:h-20">
        <button className="-ms-2 grid h-11 w-11 place-items-center rounded-full text-cocoa hover:bg-cocoa/5 lg:hidden" onClick={() => setOpen(true)} aria-label="فتح القائمة" aria-expanded={open}>
          <Menu className="h-6 w-6" />
        </button>

        <Link to="/" className="flex shrink-0 items-center lg:order-none" aria-label="دَفوة — الصفحة الرئيسية">
          <Logo size="md" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="القائمة الرئيسية">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                clsx('relative rounded-full px-4 py-2 text-[15px] font-medium transition', isActive ? 'text-cocoa' : 'text-espresso/70 hover:text-cocoa')
              }
            >
              {({ isActive }) => (
                <>
                  {n.label}
                  <span className={clsx('absolute inset-x-4 -bottom-0.5 h-0.5 origin-center rounded-full bg-caramel transition-transform duration-300', isActive ? 'scale-x-100' : 'scale-x-0')} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/shop" className="btn-primary btn-sm hidden md:inline-flex">
            تسوق الآن
          </Link>
          <button onClick={() => setDrawerOpen(true)} className="relative -me-2 grid h-11 w-11 place-items-center rounded-full text-cocoa transition hover:bg-cocoa/5" aria-label={`السلة (${count})`}>
            <ShoppingBag className="h-[22px] w-[22px]" />
            {count > 0 && (
              <span className="absolute -top-0.5 -left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-caramel px-1 text-[11px] font-bold text-white ring-2 ring-offwhite tabular-nums">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={clsx('fixed inset-0 z-50 overflow-hidden transition-[visibility] duration-300 lg:hidden', open ? 'visible pointer-events-auto' : 'invisible pointer-events-none')} aria-hidden={!open}>
        <div className={clsx('absolute inset-0 bg-espresso/40 backdrop-blur-sm transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <div className={clsx('absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-offwhite shadow-lift transition-transform duration-300', open ? 'translate-x-0' : 'translate-x-full')}>
          <div className="flex items-center justify-between border-b border-cocoa/10 px-5 py-4">
            <Logo size="sm" />
            <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-cocoa/5" aria-label="إغلاق القائمة">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-4" aria-label="القائمة">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => clsx('rounded-2xl px-4 py-3.5 text-lg font-medium', isActive ? 'bg-cream-200 text-cocoa' : 'text-espresso/80 hover:bg-cream-100')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto space-y-3 border-t border-cocoa/10 p-5 text-sm text-espresso/70 pb-safe">
            <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-caramel" /> التوصيل داخل مكة المكرمة فقط</p>
            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-caramel" /> الطلب قبل التسليم بـ 24 ساعة</p>
            <p className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-caramel" /> الدفع والتأكيد عبر واتساب</p>
            <Link to="/shop" className="btn-primary mt-2 w-full">تسوق الآن</Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { settings } = useStore();
  return (
    <footer className="relative mt-24 overflow-hidden bg-espresso text-cream-200">
      <div className="grain absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo variant="light" size="lg" />
          <p className="mt-5 max-w-sm leading-loose text-cream-200/75">{settings.description}</p>
          <div className="mt-6 flex items-center gap-3">
            <a href={whatsappLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="grid h-11 w-11 place-items-center rounded-full border border-cream-50/15 transition hover:border-caramel hover:text-caramel-light" aria-label="واتساب">
              <WhatsAppIcon />
            </a>
            {settings.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="grid h-11 w-11 place-items-center rounded-full border border-cream-50/15 transition hover:border-caramel hover:text-caramel-light" aria-label="إنستقرام">
                <InstagramIcon />
              </a>
            )}
          </div>
        </div>
        <div className="md:col-span-3">
          <h3 className="mb-4 font-display text-base font-semibold text-cream-50">روابط</h3>
          <ul className="space-y-2.5 text-cream-200/75">
            {NAV.map((n) => (
              <li key={n.to}><Link to={n.to} className="transition hover:text-caramel-light">{n.label}</Link></li>
            ))}
            <li><Link to="/privacy" className="transition hover:text-caramel-light">سياسة الخصوصية</Link></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <h3 className="mb-4 font-display text-base font-semibold text-cream-50">الطلب والتوصيل</h3>
          <ul className="space-y-3 text-cream-200/75">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-caramel" /> التوصيل داخل مكة المكرمة فقط</li>
            <li className="flex gap-2.5"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-caramel" /> الطلب قبل موعد التسليم بـ {settings.lead_time_hours} ساعة على الأقل</li>
            <li className="flex gap-2.5"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-caramel" /> الدفع والتأكيد عبر واتساب</li>
            <li className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-caramel" /> <a href={`tel:${settings.phone}`} className="ltr hover:text-caramel-light">{settings.phone}</a></li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-cream-50/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-cream-200/50 sm:flex-row">
          <p>© {new Date().getFullYear()} دَفوة DAFWA — جميع الحقوق محفوظة</p>
          <p className="font-latin italic tracking-widest">Freshly baked in Makkah</p>
        </div>
      </div>
    </footer>
  );
}

function FloatingWhatsApp() {
  const { settings } = useStore();
  const loc = useLocation();
  if (loc.pathname.startsWith('/checkout') || loc.pathname.startsWith('/order')) return null;
  return (
    <a
      href={whatsappLink(settings.whatsapp_number, 'السلام عليكم دفوة 🤎')}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 left-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#1F8F55] text-white shadow-lift transition hover:-translate-y-1 hover:bg-[#197A48]"
      aria-label="تواصل عبر واتساب"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-cocoa focus:px-4 focus:py-2 focus:text-white">
        تخطَّ إلى المحتوى
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <FloatingWhatsApp />
    </div>
  );
}
