import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getParadigm } from '@/content/paradigms';
import { getAlgorithm } from '@/content/algorithms';
import { AlgorithmCard } from '@/components/learning/AlgorithmCard';
import { CompleteToggle, useVisit } from '@/components/learning/Completion';
import { Callout, Card } from '@/components/ui/primitives';
import { Rich, inline } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import NotFound from './NotFound';

export default function ParadigmPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  useVisit(`paradigm:${id}`);
  const p = getParadigm(id);
  if (!p) return <NotFound />;
  return (
    <article className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <Link to="/paradigms" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} className="rtl:-scale-x-100" /> {t(['All paradigms', 'كل الأنماط'])}
      </Link>
      <h1 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-ink">{t(p.title)}</h1>
      <p className="mt-3 max-w-3xl text-lg text-muted">{t(p.tagline)}</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="max-w-3xl">
          <Rich text={t(p.body)} className="prose-ml space-y-4 text-[16px] leading-relaxed text-muted" />
          {p.futureNote && (
            <div className="mt-6">
              <Callout tone="info" title={t(['Planned interactive module', 'وحدة تفاعلية مخطط لها'])}>
                {t(p.futureNote)}
              </Callout>
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">{t(['Feedback signal', 'إشارة التغذية الراجعة'])}</h2>
            <p className="mt-1 text-sm text-muted">{t(p.feedback)}</p>
            <h2 className="mt-4 text-sm font-semibold text-ink">{t(['Realistic examples', 'أمثلة واقعية'])}</h2>
            <ul className="mt-1 space-y-1 text-sm text-muted">
              {p.examples.map((e, i) => (
                <li key={i}>→ {t(e)}</li>
              ))}
            </ul>
          </Card>
          <CompleteToggle id={`paradigm:${p.id}`} />
        </aside>
      </div>
      {p.glossary && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-ink">{t(['Key concepts', 'المفاهيم الأساسية'])}</h2>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {p.glossary.map((g, i) => (
              <div key={i} className="rounded-2xl border border-line bg-surface p-4">
                <dt className="font-semibold text-ink">{inline(t(g.term))}</dt>
                <dd className="mt-1 text-sm text-muted">{inline(t(g.def))}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold text-ink">{p.depth === 'deep' ? t(['Algorithms in this paradigm', 'خوارزميات هذا النمط']) : t(['Related algorithms on this platform', 'خوارزميات ذات صلة في هذه المنصة'])}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {p.algorithms.map((aid) => {
            const a = getAlgorithm(aid);
            return a ? <AlgorithmCard key={aid} a={a} /> : null;
          })}
        </div>
      </section>
    </article>
  );
}
