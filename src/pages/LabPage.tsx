import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { LAB_COMPONENTS } from '@/labs/registry';
import { LAB_ALGORITHMS } from '@/content/algorithms';
import { Spinner } from '@/components/ui/primitives';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useVisit } from '@/components/learning/Completion';
import { useI18n } from '@/i18n/I18nProvider';
import NotFound from './NotFound';

export default function LabPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  useVisit(`lab:${id}`);
  const Lab = LAB_COMPONENTS[id];
  const algo = LAB_ALGORITHMS.find((a) => a.labId === id);
  if (!Lab || !algo) return <NotFound />;
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/labs" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft size={15} className="rtl:-scale-x-100" /> {t(['All labs', 'كل المختبرات'])}
          </Link>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-ink">
            {t(algo.name)} <span className="text-accent">· {t(['Lab', 'مختبر'])}</span>
          </h1>
        </div>
        <Link to={`/algorithms/${algo.id}`} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-ink hover:border-accent/50">
          <BookOpen size={16} /> {t(['Read the full lesson', 'اقرأ الدرس كاملًا'])}
        </Link>
      </div>
      <ErrorBoundary>
        <Suspense fallback={<Spinner />}>
          <Lab />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
