import { Link, NavLink, useParams } from 'react-router-dom';
import { EVAL_SECTIONS, getEvalSection, type EvalWidget } from '@/content/evaluation';
import { PageHeader, cx } from '@/components/ui/primitives';
import { Rich } from '@/components/ui/Math';
import { CompleteToggle, useVisit } from '@/components/learning/Completion';
import {
  BiasVarianceWidget,
  CrossValidationWidget,
  EncodingWidget,
  GradientDescentWidget,
  ImbalanceWidget,
  MissingValuesWidget,
  RegressionMetricsWidget,
  ScalingWidget,
  SearchWidget,
  SplitWidget,
  ThresholdRocWidget,
} from '@/components/evaluation/widgets';
import { useI18n } from '@/i18n/I18nProvider';
import NotFound from './NotFound';

function Widget({ w }: { w: EvalWidget }) {
  switch (w) {
    case 'missing':
      return <MissingValuesWidget />;
    case 'scaling':
      return <ScalingWidget />;
    case 'encoding':
      return <EncodingWidget />;
    case 'split':
      return <SplitWidget withValidation={false} />;
    case 'split3':
      return <SplitWidget />;
    case 'imbalance':
      return <ImbalanceWidget />;
    case 'gd':
      return <GradientDescentWidget />;
    case 'biasvar':
      return <BiasVarianceWidget />;
    case 'ridge':
      return <BiasVarianceWidget showRidge />;
    case 'roc':
      return <ThresholdRocWidget />;
    case 'regmetrics':
      return <RegressionMetricsWidget />;
    case 'cv':
      return <CrossValidationWidget />;
    case 'search':
      return <SearchWidget />;
  }
}

export default function EvaluationPage() {
  const { section } = useParams();
  const { t } = useI18n();
  const current = section ? getEvalSection(section) : EVAL_SECTIONS[0];
  useVisit(`eval:${current?.id ?? 'none'}`);
  if (!current) return <NotFound />;
  return (
    <>
      <PageHeader eyebrow={t(['Model training & evaluation', 'تدريب النماذج وتقييمها'])} title={t(['From raw data to trustworthy results', 'من البيانات الخام إلى نتائج موثوقة'])} desc={t(['Preparing data, understanding training, and measuring performance honestly. Every widget below computes its numbers live.', 'تجهيز البيانات، وفهم التدريب، وقياس الأداء بأمانة. كل أداة أدناه تحسب أرقامها مباشرة.'])} />
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-8 px-4 sm:px-6 py-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label={t(['Evaluation sections', 'أقسام التقييم'])} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {EVAL_SECTIONS.map((s, i) => (
              <li key={s.id}>
                <NavLink
                  to={`/evaluation/${s.id}`}
                  className={({ isActive }) => cx('flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm', isActive || (!section && i === 0) ? 'bg-surface-2 text-ink font-semibold' : 'text-muted hover:text-ink')}
                >
                  <span className="ltr font-mono text-xs text-subtle">{i + 1}</span>
                  {t(s.title)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink">{t(current.title)}</h2>
          <p className="mt-2 text-muted">{t(current.summary)}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {current.topics.map((tp) => (
              <a key={tp.id} href={`#${tp.id}`} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-ink">
                {t(tp.title)}
              </a>
            ))}
          </div>
          <div className="mt-10 space-y-14">
            {current.topics.map((tp) => (
              <section key={tp.id} id={tp.id} className="scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold text-ink">{t(tp.title)}</h3>
                <Rich text={t(tp.body)} className="prose-ml max-w-3xl space-y-3 leading-relaxed text-muted" />
                {tp.widget && (
                  <div className="mt-5">
                    <Widget w={tp.widget} />
                  </div>
                )}
              </section>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <CompleteToggle id={`eval:${current.id}`} />
            {EVAL_SECTIONS[EVAL_SECTIONS.indexOf(current) + 1] && (
              <Link to={`/evaluation/${EVAL_SECTIONS[EVAL_SECTIONS.indexOf(current) + 1].id}`} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#04201d]">
                {t(['Next', 'التالي'])}: {t(EVAL_SECTIONS[EVAL_SECTIONS.indexOf(current) + 1].title)}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
