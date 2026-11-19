import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Clock, FlaskConical, Map as MapIcon, Navigation, RotateCcw } from 'lucide-react';
import { GUIDED_PATH, ROADMAP, TIER_LABEL, TRACK_LABEL, nodeStatus, type RoadmapNode, type Tier, type Track } from '@/content/roadmap';
import { FUNDAMENTALS } from '@/content/fundamentals';
import { ALGORITHMS, LAB_ALGORITHMS } from '@/content/algorithms';
import { Button, PageHeader, Stat, cx } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { progress, useProgress } from '@/progress/store';

const TIERS: Tier[] = ['beginner', 'intermediate', 'advanced'];
const TRACKS: Track[] = ['foundations', 'supervised', 'unsupervised', 'reinforcement', 'evaluation', 'projects'];

function NodeChip({ n }: { n: RoadmapNode }) {
  const { t } = useI18n();
  const status = nodeStatus(n, useProgress());
  const icon = n.kind === 'lab' ? <FlaskConical size={14} /> : n.kind === 'lesson' ? <BookOpen size={14} /> : <Clock size={14} />;
  const body = (
    <span
      className={cx(
        'flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] leading-snug transition-colors',
        n.kind === 'future' ? 'border-dashed border-line text-subtle' : status === 'done' ? 'border-success/50 bg-success/10 text-ink' : n.kind === 'lab' ? 'border-accent/40 bg-accent/5 text-ink hover:border-accent' : 'border-line bg-surface text-ink hover:border-accent/50',
      )}
    >
      <span className={cx('shrink-0', n.kind === 'lab' ? 'text-accent' : n.kind === 'future' ? 'text-subtle' : 'text-cyan')}>{icon}</span>
      <span className="flex-1">{t(n.title)}</span>
      {status === 'done' && <CheckCircle2 size={15} className="shrink-0 text-success" aria-label={t(['completed', 'مكتمل'])} />}
      {status === 'explored' && <span className="shrink-0 h-2 w-2 rounded-full bg-accent" title={t(['lab explored', 'تمت تجربة المختبر'])} />}
      {n.kind === 'future' && <span className="shrink-0 rounded bg-surface-2 px-1.5 text-[10px] uppercase">{t(['planned', 'مخطط'])}</span>}
    </span>
  );
  return n.to && n.kind !== 'future' ? (
    <Link to={n.to} className="block">
      {body}
    </Link>
  ) : (
    <div aria-disabled>{body}</div>
  );
}

export default function RoadmapPage() {
  const { t } = useI18n();
  const prog = useProgress();
  const pathNodes = GUIDED_PATH.map((id) => ROADMAP.find((n) => n.id === id)!).filter(Boolean);
  const nextNode = pathNodes.find((n) => nodeStatus(n, prog) !== 'done');
  const lessonsDone = FUNDAMENTALS.filter((m) => prog.completed[`learn:${m.id}`]).length;
  const algosDone = ALGORITHMS.filter((a) => prog.completed[`algo:${a.id}`]).length;
  const labsExplored = LAB_ALGORITHMS.filter((a) => (prog.labs[a.labId!] ?? []).length > 0).length;
  const quizzes = Object.values(prog.quizzes);
  const avgQuiz = quizzes.length ? quizzes.reduce((s, q) => s + q.best / q.total, 0) / quizzes.length : 0;

  return (
    <>
      <PageHeader eyebrow={t(['Learning roadmap', 'خريطة التعلّم'])} title={t(['Your path through Machine Learning', 'طريقك عبر تعلّم الآلة'])} desc={t(['Every node links to its page. Teal nodes are fully interactive labs, blue nodes are explanation lessons, and dashed nodes are planned future modules.', 'كل عقدة ترتبط بصفحتها. العقد الخضراء المزرقة مختبرات تفاعلية كاملة، والزرقاء دروس شرح، والمتقطعة وحدات مستقبلية مخطط لها.'])} />
      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 py-10">
        <section aria-labelledby="progress-h" className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 id="progress-h" className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
              <MapIcon size={18} className="text-accent" /> {t(['Your progress (saved in this browser)', 'تقدّمك (محفوظ في هذا المتصفح)'])}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Stat label={t(['Lessons completed', 'الدروس المكتملة'])} value={`${lessonsDone}/${FUNDAMENTALS.length}`} />
              <Stat label={t(['Algorithm pages completed', 'صفحات الخوارزميات المكتملة'])} value={`${algosDone}/${ALGORITHMS.length}`} />
              <Stat label={t(['Labs explored', 'المختبرات المجرَّبة'])} value={`${labsExplored}/${LAB_ALGORITHMS.length}`} tone="accent" />
              <Stat label={t(['Quizzes · best avg', 'الاختبارات · متوسط الأفضل'])} value={`${quizzes.length} · ${Math.round(avgQuiz * 100)}%`} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                icon={<RotateCcw size={14} />}
                onClick={() => {
                  if (window.confirm(t(['Reset all locally saved progress? This cannot be undone.', 'هل تريد مسح كل التقدّم المحفوظ محليًا؟ لا يمكن التراجع عن ذلك.']))) progress.reset();
                }}
              >
                {t(['Reset progress', 'مسح التقدّم'])}
              </Button>
              <span className="text-xs text-subtle">{t(['No account needed; nothing leaves your device.', 'لا حاجة لحساب؛ ولا شيء يغادر جهازك.'])}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-ink">
              <Navigation size={18} className="text-accent" /> {t(['Guided beginner path', 'المسار الإرشادي للمبتدئين'])}
            </h2>
            {nextNode && (
              <p className="mb-3 text-sm text-muted">
                {t(['Recommended next:', 'الخطوة المقترحة التالية:'])}{' '}
                <Link to={nextNode.to!} className="font-semibold text-accent-ink underline">
                  {t(nextNode.title)}
                </Link>
              </p>
            )}
            <ol className="grid gap-1.5 sm:grid-cols-2">
              {pathNodes.map((n, i) => {
                const st = nodeStatus(n, prog);
                return (
                  <li key={n.id}>
                    <Link to={n.to!} className={cx('flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface', n === nextNode ? 'bg-surface ring-1 ring-accent/50' : '')}>
                      <span className={cx('ltr flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', st === 'done' ? 'bg-success text-white' : 'bg-surface-2 text-muted')}>{st === 'done' ? '✓' : i + 1}</span>
                      <span className="text-ink">{t(n.title)}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section aria-label={t(['Roadmap', 'خريطة الطريق'])}>
          <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5"><FlaskConical size={13} className="text-accent" /> {t(['Interactive lab', 'مختبر تفاعلي'])}</span>
            <span className="inline-flex items-center gap-1.5"><BookOpen size={13} className="text-cyan" /> {t(['Explanation lesson', 'درس شرح'])}</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {t(['Planned module (not available yet)', 'وحدة مخطط لها (غير متاحة بعد)'])}</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-success" /> {t(['Completed', 'مكتمل'])}</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {TIERS.map((tier, ti) => (
              <div key={tier} className="relative rounded-2xl border border-line bg-surface-2/40 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="ltr flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-[#04201d]">{ti + 1}</span>
                  <h2 className="text-lg font-semibold text-ink">{t(TIER_LABEL[tier])}</h2>
                </div>
                <div className="space-y-5">
                  {TRACKS.map((track) => {
                    const nodes = ROADMAP.filter((n) => n.tier === tier && n.track === track);
                    if (!nodes.length) return null;
                    return (
                      <div key={track}>
                        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">{t(TRACK_LABEL[track])}</h3>
                        <div className="relative space-y-1.5 border-s-2 border-line ps-3">
                          {nodes.map((n) => (
                            <NodeChip key={n.id} n={n} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
