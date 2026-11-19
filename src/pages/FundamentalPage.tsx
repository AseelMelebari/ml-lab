import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FUNDAMENTALS, getFundamental } from '@/content/fundamentals';
import { Badge, Card } from '@/components/ui/primitives';
import { Rich } from '@/components/ui/Math';
import { Quiz } from '@/components/learning/Quiz';
import { CompleteToggle, useVisit } from '@/components/learning/Completion';
import { FundamentalDemoView } from '@/components/learning/FundamentalDemos';
import { useI18n } from '@/i18n/I18nProvider';
import { DIFFICULTY } from '@/i18n/common';
import NotFound from './NotFound';

export default function FundamentalPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  useVisit(`learn:${id}`);
  const m = getFundamental(id);
  if (!m) return <NotFound />;
  const idx = FUNDAMENTALS.indexOf(m);
  const prev = FUNDAMENTALS[idx - 1];
  const next = FUNDAMENTALS[idx + 1];
  return (
    <article className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} className="rtl:-scale-x-100" /> {t(['Fundamentals', 'الأساسيات'])}
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="accent">
          {t(['Module', 'الوحدة'])} <span className="ltr">{idx + 1}/{FUNDAMENTALS.length}</span>
        </Badge>
        <Badge>{t(DIFFICULTY[m.level])}</Badge>
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-ink">{t(m.title)}</h1>
      <p className="mt-3 text-lg text-muted">{t(m.summary)}</p>

      <div className="mt-8 max-w-3xl">
        <Rich text={t(m.body)} className="prose-ml space-y-4 text-[16px] leading-relaxed text-muted" />
      </div>

      {m.demo && (
        <div className="mt-10">
          <FundamentalDemoView demo={m.demo} />
        </div>
      )}

      <Card className="mt-10 p-5">
        <h2 className="mb-3 text-base font-semibold text-ink">{t(['Key points', 'النقاط الرئيسية'])}</h2>
        <ul className="space-y-2">
          {m.keyPoints.map((k, i) => (
            <li key={i} className="flex gap-2 text-muted">
              <span className="text-accent">✓</span>
              {t(k)}
            </li>
          ))}
        </ul>
      </Card>

      {m.quiz && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold text-ink">{t(['Quick check', 'تحقق سريع'])}</h2>
          <Quiz id={`learn:${m.id}`} questions={m.quiz} />
        </section>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <CompleteToggle id={`learn:${m.id}`} />
        <div className="flex gap-2">
          {prev && (
            <Link to={`/learn/${prev.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm text-muted hover:text-ink">
              <ArrowLeft size={15} className="rtl:-scale-x-100" /> {t(prev.title)}
            </Link>
          )}
          {next && (
            <Link to={`/learn/${next.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#04201d]">
              {t(next.title)} <ArrowRight size={15} className="rtl:-scale-x-100" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
