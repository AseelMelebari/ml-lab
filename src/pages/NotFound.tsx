import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="ltr font-mono text-6xl font-bold text-accent">404</div>
      <h1 className="mt-4 text-2xl font-semibold text-ink">{t(['Page not found', 'الصفحة غير موجودة'])}</h1>
      <p className="mt-2 text-muted">{t(['The page you are looking for does not exist or has moved.', 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'])}</p>
      <Link to="/" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-[#04201d]">
        {t(['Back to home', 'العودة إلى الرئيسية'])}
      </Link>
    </div>
  );
}
