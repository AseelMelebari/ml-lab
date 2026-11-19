import { Suspense, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, ExternalLink, FlaskConical, Lightbulb, Presentation, ThumbsDown, ThumbsUp } from 'lucide-react';
import { getAlgorithm } from '@/content/algorithms';
import { CATEGORY_LABEL, PARADIGM_LABEL, PARADIGM_TONE } from '@/content/taxonomy';
import { LAB_COMPONENTS } from '@/labs/registry';
import { Badge, Callout, Card, Spinner } from '@/components/ui/primitives';
import { Rich } from '@/components/ui/Math';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Quiz } from '@/components/learning/Quiz';
import { CompleteToggle, useVisit } from '@/components/learning/Completion';
import { AlgorithmCard } from '@/components/learning/AlgorithmCard';
import { useI18n } from '@/i18n/I18nProvider';
import { C, DIFFICULTY } from '@/i18n/common';
import type { Text } from '@/i18n/types';
import NotFound from './NotFound';

function Section({ id, title, icon, children, wide }: { id: string; title: string; icon?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <section id={id} className={`scroll-mt-32 ${wide ? '' : 'max-w-3xl'}`}>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-ink">
        {icon && <span className="text-accent">{icon}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

function List({ items, marker = '•' }: { items: Text[]; marker?: string }) {
  const { t } = useI18n();
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 leading-relaxed text-muted">
          <span className="mt-0.5 shrink-0 text-accent" aria-hidden>
            {marker}
          </span>
          <span>{t(it)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AlgorithmPage() {
  const { id = '' } = useParams();
  const a = getAlgorithm(id);
  const { t } = useI18n();
  useVisit(`algo:${id}`);
  if (!a) return <NotFound />;
  const Lab = a.labId ? LAB_COMPONENTS[a.labId] : undefined;

  const toc: [string, Text][] = [
    ['overview', ['Overview', 'نظرة عامة']],
    ['how', ['How it works', 'آلية العمل']],
    ['math', ['Mathematics', 'الرياضيات']],
    ['lab', Lab ? ['Interactive lab', 'المختبر التفاعلي'] : ['Interactive module', 'الوحدة التفاعلية']],
    ['evaluation', ['Evaluation', 'التقييم']],
    ['pros-cons', ['Strengths & limits', 'المزايا والقيود']],
    ['python', ['Python', 'بايثون']],
    ['quiz', ['Quiz', 'اختبار']],
    ['related', ['Related & references', 'ذات صلة ومراجع']],
  ];

  return (
    <article>
      <header className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-grid-faint opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-10">
          <Link to="/algorithms" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft size={15} className="rtl:-scale-x-100" /> {t(['All algorithms', 'كل الخوارزميات'])}
          </Link>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone={PARADIGM_TONE[a.paradigm]}>{t(PARADIGM_LABEL[a.paradigm])}</Badge>
            {a.categories.map((c) => (
              <Badge key={c}>{t(CATEGORY_LABEL[c])}</Badge>
            ))}
            <Badge tone="warn">{t(DIFFICULTY[a.difficulty])}</Badge>
            {Lab ? (
              <Badge tone="success">
                <FlaskConical size={12} /> {t(C.interactiveLab)}
              </Badge>
            ) : (
              <Badge>
                <BookOpen size={12} /> {t(C.explanation)}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink">{t(a.name)}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">{t(a.short)}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {Lab && (
              <a href="#lab" className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-[#04201d]">
                <FlaskConical size={16} /> {t(['Jump to the lab', 'انتقل إلى المختبر'])}
              </a>
            )}
            {Lab && (
              <Link to={`/labs/${a.labId}`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-5 text-sm font-medium text-ink hover:border-accent/50">
                {t(['Open lab full-page', 'افتح المختبر بصفحة كاملة'])}
              </Link>
            )}
            <CompleteToggle id={`algo:${a.id}`} />
          </div>
        </div>
      </header>

      <nav aria-label={t(['On this page', 'في هذه الصفحة'])} className="sticky top-16 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 py-2">
          {toc.map(([sid, label]) => (
            <a key={sid} href={`#${sid}`} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] text-muted hover:bg-surface-2 hover:text-ink">
              {t(label)}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 py-12">
        <Section id="overview" title={t(['What you will learn', 'ماذا ستتعلّم'])} icon={<CheckCircle2 size={20} />}>
          <List items={a.objectives} marker="✓" />
          <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
            <h3 className="mb-3 text-base font-semibold text-ink">{t(['The idea in plain words', 'الفكرة بكلمات بسيطة'])}</h3>
            <Rich text={t(a.intuition)} className="prose-ml space-y-3 leading-relaxed text-muted" />
          </div>
          <h3 className="mb-3 mt-8 text-base font-semibold text-ink">{t(['Real-world use cases', 'استخدامات في الواقع'])}</h3>
          <List items={a.useCases} marker="→" />
        </Section>

        <Section id="how" title={t(['Step by step', 'خطوة بخطوة'])}>
          <ol className="space-y-3">
            {a.steps.map((s, i) => (
              <li key={i} className="flex gap-4 rounded-xl border border-line bg-surface px-4 py-3">
                <span className="ltr flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-sm font-semibold text-accent-ink">{i + 1}</span>
                <span className="leading-relaxed text-ink">{t(s)}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="math" title={t(['Mathematical intuition', 'الحدس الرياضي'])}>
          <Card className="p-6">
            <Rich text={t(a.math)} className="prose-ml space-y-4 leading-relaxed text-muted" />
          </Card>
        </Section>

        <Section id="lab" title={Lab ? t(['Interactive lab — run the model and inspect the results', 'المختبر التفاعلي — شغّل النموذج وافحص النتائج']) : t(['Interactive module', 'الوحدة التفاعلية'])} icon={<FlaskConical size={20} />} wide>
          {Lab ? (
            <>
              <ErrorBoundary>
                <Suspense fallback={<Spinner label={t(['Loading the lab…', 'جارٍ تحميل المختبر…'])} />}>
                  <Lab />
                </Suspense>
              </ErrorBoundary>
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {a.labGuide && (
                  <div>
                    <h3 className="mb-3 text-base font-semibold text-ink">{t(['Adjustable parameters', 'المعاملات القابلة للتعديل'])}</h3>
                    <dl className="space-y-2">
                      {a.labGuide.map((g, i) => (
                        <div key={i} className="rounded-xl border border-line bg-surface px-4 py-3">
                          <dt className="text-sm font-semibold text-ink">{t(g.param)}</dt>
                          <dd className="mt-0.5 text-sm text-muted">{t(g.effect)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                {a.experiments && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
                      <Lightbulb size={17} className="text-warn" /> {t(['Explore the data: try this', 'استكشف البيانات: جرّب ما يلي'])}
                    </h3>
                    <List items={a.experiments} marker="◆" />
                    <Link to="/instructor" className="mt-4 inline-flex items-center gap-1.5 text-sm text-purple hover:underline">
                      <Presentation size={15} /> {t(['Present this lab in Instructor Mode', 'اعرض هذا المختبر في وضع المحاضِر'])}
                    </Link>
                  </div>
                )}
              </div>
              <p className="mt-6 max-w-3xl text-xs text-subtle">
                {t(['Every number and chart in this lab is computed live in your browser from the current data and parameters, using the implementation in src/lib/ml.', 'كل رقم ورسم في هذا المختبر يُحسب مباشرة في متصفحك من البيانات والمعاملات الحالية، باستخدام التطبيق الموجود في src/lib/ml.'])}
              </p>
            </>
          ) : (
            <Callout tone="info" title={t(['Planned interactive module', 'وحدة تفاعلية مخطط لها'])}>
              {t(['This page is an explanation page. An interactive laboratory for this algorithm is planned but not available yet — nothing on this page simulates it.', 'هذه صفحة شرح. مختبر تفاعلي لهذه الخوارزمية مخطط له لكنه غير متاح بعد — ولا يوجد في هذه الصفحة ما يحاكيها.'])}{' '}
              <Link to="/labs" className="text-accent-ink underline">
                {t(['See the available labs', 'اطّلع على المختبرات المتاحة'])}
              </Link>
            </Callout>
          )}
        </Section>

        <Section id="evaluation" title={t(['Evaluation metrics', 'مقاييس التقييم'])}>
          <Rich text={t(a.evaluation)} className="prose-ml space-y-3 leading-relaxed text-muted" />
        </Section>

        <section id="pros-cons" className="scroll-mt-32 grid gap-4 md:grid-cols-3">
          {(
            [
              [['Advantages', 'المزايا'], a.advantages, <ThumbsUp key="u" size={18} />, 'text-success'],
              [['Limitations', 'القيود'], a.limitations, <ThumbsDown key="d" size={18} />, 'text-warn'],
              [['Common mistakes', 'أخطاء شائعة'], a.mistakes, <AlertTriangle key="m" size={18} />, 'text-danger'],
            ] as const
          ).map(([title, items, icon, tone]) => (
            <Card key={title[0]} className="p-5">
              <h2 className={`mb-3 flex items-center gap-2 text-base font-semibold ${tone}`}>
                {icon}
                {t(title)}
              </h2>
              <List items={items} />
            </Card>
          ))}
        </section>

        <Section id="python" title={t(['Python implementation', 'التطبيق ببايثون'])}>
          <CodeBlock code={a.python} />
          <Callout tone="info" title={t(['Library vs. this platform', 'المكتبة مقابل هذه المنصة'])}>
            {t(a.pythonNote)}
          </Callout>
        </Section>

        <Section id="quiz" title={t(['Check your understanding', 'اختبر فهمك'])}>
          <Quiz id={`algo:${a.id}`} questions={a.quiz} />
        </Section>

        <section id="related" className="scroll-mt-32 space-y-8">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-ink">{t(['Related algorithms', 'خوارزميات ذات صلة'])}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {a.related.map((rid) => {
                const r = getAlgorithm(rid);
                return r ? <AlgorithmCard key={rid} a={r} /> : null;
              })}
            </div>
          </div>
          <div className="max-w-3xl">
            <h2 className="mb-3 text-xl font-semibold text-ink">{t(['References & further reading', 'مراجع وقراءات إضافية'])}</h2>
            <ul className="space-y-2">
              {a.references.map((ref) => (
                <li key={ref.url}>
                  <a href={ref.url} target="_blank" rel="noreferrer noopener" className="ltr inline-flex items-center gap-1.5 text-sm text-cyan hover:underline">
                    {ref.title} <ExternalLink size={13} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </article>
  );
}
