import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { FUNDAMENTALS } from '@/content/fundamentals';
import { Badge, PageHeader } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { DIFFICULTY } from '@/i18n/common';
import { useProgress } from '@/progress/store';

export default function FundamentalsPage() {
  const { t } = useI18n();
  const prog = useProgress();
  const done = FUNDAMENTALS.filter((m) => prog.completed[`learn:${m.id}`]).length;
  return (
    <>
      <PageHeader eyebrow={t(['Start here', 'ابدأ من هنا'])} title={t(['Machine Learning fundamentals', 'أساسيات تعلّم الآلة'])} desc={t(['Sixteen short modules that build the vocabulary and intuition you need before the algorithm labs. Each module has a diagram or an interactive demonstration.', 'ست عشرة وحدة قصيرة تبني المفردات والحدس اللازمين قبل مختبرات الخوارزميات. لكل وحدة مخطط أو عرض تفاعلي.'])}>
        <div className="flex items-center gap-3 text-sm text-muted">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-accent" style={{ width: `${(done / FUNDAMENTALS.length) * 100}%` }} />
          </div>
          <span className="ltr font-mono">{done}/{FUNDAMENTALS.length}</span> {t(['completed', 'مكتملة'])}
        </div>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FUNDAMENTALS.map((m, i) => {
            const isDone = !!prog.completed[`learn:${m.id}`];
            return (
              <li key={m.id}>
                <Link to={`/learn/${m.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/50">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="ltr font-mono text-sm text-subtle">{String(i + 1).padStart(2, '0')}</span>
                    <div className="flex items-center gap-1.5">
                      {m.demo && (
                        <Badge tone="accent">
                          <Sparkles size={11} /> {t(['Interactive', 'تفاعلي'])}
                        </Badge>
                      )}
                      <Badge>{t(DIFFICULTY[m.level])}</Badge>
                    </div>
                  </div>
                  <h2 className="text-base font-semibold text-ink group-hover:text-accent-ink">{t(m.title)}</h2>
                  <p className="mt-1.5 flex-1 text-sm text-muted">{t(m.summary)}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs">
                    {isDone ? <CheckCircle2 size={15} className="text-success" /> : <Circle size={15} className="text-subtle" />}
                    <span className={isDone ? 'text-success' : 'text-subtle'}>{isDone ? t(['Completed', 'مكتملة']) : t(['Not completed', 'غير مكتملة'])}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
