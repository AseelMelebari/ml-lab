import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Languages, Menu, Moon, Presentation, Sun, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { cx } from '@/components/ui/primitives';
import { Logo } from './Logo';
import { PRIMARY_NAV, SECONDARY_NAV } from './nav';

export function Header() {
  const { t, lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cx('rounded-lg px-2.5 py-1.5 text-[13.5px] font-medium transition-colors', isActive ? 'text-ink bg-surface-2' : 'text-muted hover:text-ink');

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        {t(['Skip to content', 'انتقل إلى المحتوى'])}
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="ML LAB — home" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label={t(['Main navigation', 'التنقل الرئيسي'])} className="hidden xl:flex items-center gap-0.5 ms-4">
          {PRIMARY_NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={linkCls}>
              {t(n.label)}
            </NavLink>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1.5">
          <NavLink
            to="/instructor"
            className={({ isActive }) =>
              cx('hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium', isActive ? 'border-purple/60 text-purple' : 'border-line text-muted hover:text-ink hover:border-purple/50')
            }
          >
            <Presentation size={15} />
            {t(['Instructor', 'المحاضِر'])}
          </NavLink>
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
            aria-label={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
            data-testid="lang-toggle"
          >
            <Languages size={16} />
            <span>{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
            aria-label={t(theme === 'dark' ? ['Switch to light theme', 'التبديل إلى الوضع الفاتح'] : ['Switch to dark theme', 'التبديل إلى الوضع الداكن'])}
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            className="xl:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-surface-2"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={t(open ? ['Close menu', 'إغلاق القائمة'] : ['Open menu', 'فتح القائمة'])}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label={t(['Mobile navigation', 'تنقل الجوال'])} className="xl:hidden border-t border-line bg-bg px-4 pb-5 pt-3">
          <div className="grid gap-1 sm:grid-cols-2">
            {[{ to: '/', label: ['Home', 'الرئيسية'] as const }, ...PRIMARY_NAV, ...SECONDARY_NAV].map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => cx('rounded-lg px-3 py-2.5 text-[15px]', isActive ? 'bg-surface-2 text-ink' : 'text-muted')}>
                {t(n.label)}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
