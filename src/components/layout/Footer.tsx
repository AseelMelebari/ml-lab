import { Link } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { useI18n } from '@/i18n/I18nProvider';
import { LogoMark } from './Logo';
import { PRIMARY_NAV, SECONDARY_NAV } from './nav';

export function Footer() {
  const { t, lang } = useI18n();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="ltr font-bold text-ink">{BRAND.name}</span>
          </div>
          <p className="max-w-sm text-sm text-muted leading-relaxed">{t(BRAND.tagline)} {t(['An open educational platform where every chart comes from a real computation running in your browser.', 'منصة تعليمية مفتوحة يأتي فيها كل رسم من عملية حسابية حقيقية تعمل داخل متصفحك.'])}</p>
          <a href={BRAND.repoUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <GithubIcon /> GitHub
          </a>
        </div>
        <nav aria-label={t(['Footer: learn', 'التذييل: التعلّم'])}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">{t(['Learn', 'تعلّم'])}</h2>
          <ul className="space-y-2 text-sm">
            {PRIMARY_NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-muted hover:text-ink">
                  {t(n.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t(['Footer: more', 'التذييل: المزيد'])}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">{t(['More', 'المزيد'])}</h2>
          <ul className="space-y-2 text-sm">
            {SECONDARY_NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-muted hover:text-ink">
                  {t(n.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-5 text-xs text-subtle">
          <span>
            © {BRAND.year} {lang === 'ar' ? BRAND.ownerAr : BRAND.owner} · {t(['MIT License', 'رخصة MIT'])}
          </span>
          <span>{t(['All simulations run locally. No account, no tracking.', 'جميع المحاكاة تعمل محليًا. بلا حساب وبلا تتبّع.'])}</span>
        </div>
      </div>
    </footer>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
