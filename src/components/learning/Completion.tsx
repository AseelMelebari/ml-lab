import { useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { progress, useProgress } from '@/progress/store';
import { cx } from '@/components/ui/primitives';

/** Marks the page as visited on mount, and offers an explicit "mark complete" toggle. */
export function useVisit(id: string) {
  useEffect(() => {
    progress.markVisited(id);
  }, [id]);
}

export function CompleteToggle({ id }: { id: string }) {
  const { t } = useI18n();
  const done = !!useProgress().completed[id];
  return (
    <button
      type="button"
      onClick={() => progress.setCompleted(id, !done)}
      aria-pressed={done}
      className={cx(
        'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
        done ? 'border-success/50 bg-success/10 text-success' : 'border-line text-muted hover:text-ink hover:border-accent/50',
      )}
      data-testid="complete-toggle"
    >
      {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      {done ? t(C.completed) : t(C.markComplete)}
    </button>
  );
}
