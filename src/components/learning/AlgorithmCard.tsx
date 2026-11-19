import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, FlaskConical, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { C, DIFFICULTY } from '@/i18n/common';
import type { AlgorithmContent } from '@/content/types';
import { CATEGORY_LABEL, PARADIGM_LABEL, PARADIGM_TONE } from '@/content/taxonomy';
import { useProgress } from '@/progress/store';

export function AlgorithmCard({ a }: { a: AlgorithmContent }) {
  const { t } = useI18n();
  const done = !!useProgress().completed[`algo:${a.id}`];
  return (
    <Link
      to={`/algorithms/${a.id}`}
      className="group relative flex flex-col rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_12px_40px_-20px_rgba(45,212,191,.45)]"
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Badge tone={PARADIGM_TONE[a.paradigm]}>{t(PARADIGM_LABEL[a.paradigm])}</Badge>
        {a.labId ? (
          <Badge tone="success">
            <FlaskConical size={12} /> {t(C.interactiveLab)}
          </Badge>
        ) : (
          <Badge>
            <BookOpen size={12} /> {t(C.explanation)}
          </Badge>
        )}
      </div>
      <h3 className="text-lg font-semibold text-ink group-hover:text-accent-ink">{t(a.name)}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{t(a.short)}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-subtle">
        <span>
          {a.categories.map((c) => t(CATEGORY_LABEL[c])).join(' · ')} · {t(DIFFICULTY[a.difficulty])}
        </span>
        {done ? <CheckCircle2 size={16} className="text-success" aria-label={t(C.completed)} /> : <ArrowUpRight size={16} className="rtl:-scale-x-100 opacity-60 group-hover:opacity-100" />}
      </div>
    </Link>
  );
}
