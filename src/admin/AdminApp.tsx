import { lazy, Suspense, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard, Cookie, FolderTree, ClipboardList, Users, BadgePercent, Truck, BarChart3, Mail, Settings, LogOut, Menu, X, ExternalLink, Lock, KeyRound,
} from 'lucide-react';
import { AuthProvider, useAuth } from './auth';
import { Logo } from '../components/Logo';
import { PageLoader, Spinner } from '../components/ui';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { useSeo } from '../lib/seo';

const Overview = lazy(() => import('./pages/Overview'));
const Products = lazy(() => import('./pages/Products'));
const ProductEditor = lazy(() => import('./pages/ProductEditor'));
const Categories = lazy(() => import('./pages/Categories'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Customers = lazy(() => import('./pages/Customers'));
const Promotions = lazy(() => import('./pages/Promotions'));
const Delivery = lazy(() => import('./pages/Delivery'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Emails = lazy(() => import('./pages/Emails'));
const SettingsPage = lazy(() => import('./pages/Settings'));

const NAV = [
  { to: '/admin', label: 'نظرة عامة', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'الطلبات', icon: ClipboardList },
  { to: '/admin/products', label: 'المنتجات', icon: Cookie },
  { to: '/admin/categories', label: 'التصنيفات', icon: FolderTree },
  { to: '/admin/customers', label: 'العملاء', icon: Users },
  { to: '/admin/promotions', label: 'العروض والخصومات', icon: BadgePercent },
  { to: '/admin/delivery', label: 'إدارة التوصيل', icon: Truck },
  { to: '/admin/analytics', label: 'تحليلات المبيعات', icon: BarChart3 },
  { to: '/admin/emails', label: 'إشعارات البريد', icon: Mail },
  { to: '/admin/settings', label: 'إعدادات المتجر', icon: Settings },
];

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { session, isAdmin, signOut } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  };
  const reset = async () => {
    if (!email.trim()) return setError('اكتب بريدك الإلكتروني أولًا.');
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin` });
    setInfo('إذا كان البريد مسجلًا، ستصلك رسالة لإعادة تعيين كلمة المرور.');
  };

  return (
    <div className="grain flex min-h-screen items-center justify-center bg-cream-200 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo size="lg" /></div>
        <div className="card p-7 sm:p-9">
          <h1 className="flex items-center gap-2 text-xl font-semibold"><Lock className="h-5 w-5 text-caramel" /> لوحة تحكم دفوة</h1>
          {session && !isAdmin ? (
            <div className="mt-6 space-y-4">
              <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">هذا الحساب لا يملك صلاحيات الإدارة.</p>
              <button onClick={signOut} className="btn-secondary w-full">تسجيل الخروج</button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {!supabaseConfigured && <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">Supabase غير مهيأ. أضف متغيرات البيئة أولًا.</p>}
              <div>
                <label htmlFor="em" className="label">البريد الإلكتروني</label>
                <input id="em" type="email" dir="ltr" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="input text-right" />
              </div>
              <div>
                <label htmlFor="pw" className="label">كلمة المرور</label>
                <input id="pw" type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input text-right" />
              </div>
              {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
              {info && <p className="text-sm text-sage">{info}</p>}
              <button className="btn-primary w-full py-3.5" disabled={busy}>{busy ? <Spinner /> : 'تسجيل الدخول'}</button>
              <button type="button" onClick={reset} className="btn-ghost w-full text-sm">نسيت كلمة المرور؟</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function SetNewPassword() {
  const { clearRecovery } = useAuth();
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 10) return setMsg('كلمة المرور يجب أن تكون 10 أحرف على الأقل.');
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) setMsg('تعذر تحديث كلمة المرور.');
    else clearRecovery();
  };
  return (
    <div className="grain flex min-h-screen items-center justify-center bg-cream-200 px-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-8">
        <h1 className="flex items-center gap-2 text-xl font-semibold"><KeyRound className="h-5 w-5 text-caramel" /> تعيين كلمة مرور جديدة</h1>
        <input type="password" dir="ltr" autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="كلمة المرور الجديدة" />
        {msg && <p className="text-sm text-red-700">{msg}</p>}
        <button className="btn-primary w-full">حفظ</button>
      </form>
    </div>
  );
}

function Shell() {
  const { signOut, session } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="قائمة لوحة التحكم">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo size="sm" />
        <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-cocoa/5 lg:hidden" onClick={() => setOpen(false)} aria-label="إغلاق"><X className="h-5 w-5" /></button>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map((n) => (
          <li key={n.to}>
            <NavLink
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => clsx('flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[14.5px] font-medium transition', isActive ? 'bg-cocoa text-cream-50 shadow-soft' : 'text-espresso/70 hover:bg-cream-200 hover:text-espresso')}
            >
              <n.icon className="h-[18px] w-[18px]" /> {n.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="space-y-1 border-t border-cocoa/10 p-3">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-espresso/70 hover:bg-cream-200"><ExternalLink className="h-4 w-4" /> عرض المتجر</a>
        <button onClick={async () => { await signOut(); nav('/admin'); }} className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-espresso/70 hover:bg-red-50 hover:text-red-800"><LogOut className="h-4 w-4" /> تسجيل الخروج</button>
        <p className="truncate px-4 pt-1 text-[11px] text-espresso/40" dir="ltr">{session?.user.email}</p>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream-100/70">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l border-cocoa/10 bg-offwhite lg:block">{sidebar}</aside>
      <div className={clsx('fixed inset-0 z-50 overflow-hidden transition-[visibility] duration-300 lg:hidden', open ? 'visible' : 'invisible pointer-events-none')}>
        <div className={clsx('absolute inset-0 bg-espresso/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <aside className={clsx('absolute inset-y-0 right-0 w-72 bg-offwhite shadow-lift transition-transform', open ? 'translate-x-0' : 'translate-x-full')}>{sidebar}</aside>
      </div>
      <div className="lg:pr-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-cocoa/10 bg-offwhite/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-cocoa/5" aria-label="القائمة"><Menu className="h-5 w-5" /></button>
          <Logo size="sm" />
          <span className="w-10" />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10" key={loc.pathname.split('/')[2] ?? ''}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route index element={<Overview />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<ProductEditor />} />
              <Route path="products/:id" element={<ProductEditor />} />
              <Route path="categories" element={<Categories />} />
              <Route path="customers" element={<Customers />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="delivery" element={<Delivery />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="emails" element={<Emails />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function Gate() {
  const { loading, session, isAdmin, recovery } = useAuth();
  useSeo({ title: 'لوحة التحكم', noindex: true });
  if (loading) return <PageLoader />;
  if (recovery && session) return <SetNewPassword />;
  if (!session || !isAdmin) return <Login />;
  return <Shell />;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
