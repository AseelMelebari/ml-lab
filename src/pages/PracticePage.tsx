import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Dices, Lightbulb, Shuffle } from 'lucide-react';
import { ALGORITHMS } from '@/content/algorithms';
import { FUNDAMENTALS } from '@/content/fundamentals';
import { CHALLENGES, checkAnswer, generateExercises } from '@/content/exercises';
import type { QuizQuestion } from '@/content/types';
import { Quiz } from '@/components/learning/Quiz';
import { Button, PageHeader, Segmented, cx } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { mulberry32, shuffle } from '@/lib/ml/random';
import { useProgress } from '@/progress/store';
import { useVisit } from '@/components/learning/Completion';

type Area = 'all' | 'supervised' | 'unsupervised' | 'reinforcement' | 'fundamentals';

function bank(area: Area): QuizQuestion[] {
  const fromAlgos = ALGORITHMS.filter((a) => area === 'all' || a.paradigm === area).flatMap((a) => a.quiz);
  const fromFund = area === 'all' || area === 'fundamentals' ? FUNDAMENTALS.flatMap((m) => m.quiz ?? []) : [];
  return area === 'fundamentals' ? fromFund : [...fromAlgos, ...fromFund];
}

export default function PracticePage() {
  const { t } = useI18n();
  useVisit('practice');
  const prog = useProgress();
  const [area, setArea] = useState<Area>('all');
  const [setSeed, setSetSeed] = useState(1);
  const questions = useMemo(() => shuffle(bank(area), mulberry32(setSeed * 31 + area.length)).slice(0, 6), [area, setSeed]);
  const [exSeed, setExSeed] = useState(7);
  const exercises = useMemo(() => generateExercises(exSeed), [exSeed]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const doneChallenges = CHALLENGES.filter((c) => prog.labs[c.labId]?.includes(c.event)).length;

  return (
    <>
      <PageHeader eyebrow={t(['Practice & challenges', 'التدريب والتحديات'])} title={t(['Test yourself, then prove it in the labs', 'اختبر نفسك ثم أثبت ذلك في المختبرات'])} desc={t(['Knowledge checks with instant feedback, numeric exercises with worked solutions, and lab challenges that are verified by what you actually do in the simulations.', 'اختبارات معرفية بتغذية راجعة فورية، وتمارين عددية بحلول مفصّلة، وتحديات مختبرية يُتحقق منها بما تفعله فعلًا في المحاكاة.'])} />
      <div className="mx-auto max-w-7xl space-y-14 px-4 sm:px-6 py-10">
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">{t(['Knowledge check', 'اختبار المعرفة'])}</h2>
              <p className="text-sm text-muted">{t(['Six questions drawn from the question bank.', 'ستة أسئلة مختارة من بنك الأسئلة.'])}</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <Segmented
                label={t(['Topic', 'الموضوع'])}
                value={area}
                onChange={setArea}
                size="sm"
                options={[
                  { value: 'all', label: t(['All', 'الكل']) },
                  { value: 'fundamentals', label: t(['Fundamentals', 'الأساسيات']) },
                  { value: 'supervised', label: t(['Supervised', 'الموجَّه']) },
                  { value: 'unsupervised', label: t(['Unsupervised', 'غير الموجَّه']) },
                  { value: 'reinforcement', label: t(['RL', 'المعزّز']) },
                ]}
              />
              <Button size="sm" icon={<Shuffle size={14} />} onClick={() => setSetSeed((s) => s + 1)}>
                {t(['New set', 'مجموعة جديدة'])}
              </Button>
            </div>
          </div>
          <Quiz key={`${area}-${setSeed}`} id={`practice:${area}`} questions={questions} />
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">{t(['Numeric exercises', 'تمارين عددية'])}</h2>
              <p className="text-sm text-muted">{t(['Compute by hand (or with a calculator) and check. Numbers change with each new set.', 'احسب يدويًا (أو بالآلة الحاسبة) ثم تحقق. تتغير الأرقام مع كل مجموعة جديدة.'])}</p>
            </div>
            <Button size="sm" icon={<Dices size={14} />} onClick={() => { setExSeed((s) => s + 1); setInputs({}); setShown({}); }}>
              {t(['New numbers', 'أرقام جديدة'])}
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {exercises.map((ex) => {
              const verdict = checkAnswer(ex, inputs[ex.id] ?? '');
              return (
                <div key={ex.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">{t(ex.topic)}</div>
                  <p className="mt-1 text-sm text-ink">{t(ex.prompt)}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      aria-label={t(['Your answer', 'إجابتك'])}
                      inputMode="decimal"
                      value={inputs[ex.id] ?? ''}
                      onChange={(e) => setInputs((s) => ({ ...s, [ex.id]: e.target.value }))}
                      className={cx('ltr h-10 w-36 rounded-xl border bg-surface-2 px-3 font-mono text-sm', verdict === true ? 'border-success' : verdict === false ? 'border-danger' : 'border-line')}
                      placeholder="0.00"
                    />
                    {verdict === true && <span className="text-sm font-semibold text-success">✓ {t(['Correct', 'صحيح'])}</span>}
                    {verdict === false && <span className="text-sm text-danger">✗ {t(['Not yet', 'ليس بعد'])}</span>}
                    <button type="button" className="ms-auto inline-flex items-center gap-1 text-xs text-muted hover:text-ink" onClick={() => setShown((s) => ({ ...s, [ex.id]: !s[ex.id] }))}>
                      <Lightbulb size={13} /> {shown[ex.id] ? t(['Hide solution', 'إخفاء الحل']) : t(['Show solution', 'إظهار الحل'])}
                    </button>
                  </div>
                  {shown[ex.id] && (
                    <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
                      <span className="ltr font-mono">{t(ex.solution)}</span>{' '}
                      <Link to={ex.link} className="text-accent-ink underline">
                        {t(['Review', 'راجع'])}
                      </Link>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">{t(['Lab challenges', 'تحديات المختبرات'])}</h2>
          <p className="mb-4 text-sm text-muted">
            {t(['Completed automatically when the lab records that you did it.', 'تكتمل تلقائيًا عندما يسجّل المختبر أنك أنجزتها.'])} <span className="ltr font-mono">{doneChallenges}/{CHALLENGES.length}</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHALLENGES.map((c) => {
              const done = !!prog.labs[c.labId]?.includes(c.event);
              return (
                <Link key={c.id} to={`/labs/${c.labId}`} className={cx('rounded-2xl border p-4 transition-colors', done ? 'border-success/50 bg-success/5' : 'border-line bg-surface hover:border-accent/50')}>
                  <div className="flex items-start gap-2">
                    {done ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" /> : <Circle size={18} className="mt-0.5 shrink-0 text-subtle" />}
                    <div>
                      <div className="text-sm font-semibold text-ink">{t(c.title)}</div>
                      <div className="mt-0.5 text-xs text-muted">{t(c.hint)}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
