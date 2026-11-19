import { useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { Button, cx } from '@/components/ui/primitives';
import { inline } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { progress, useProgress } from '@/progress/store';
import type { QuizQuestion } from '@/content/types';

/** Scores the answers. Exported for unit tests. */
export function scoreQuiz(questions: QuizQuestion[], answers: (number | null)[]): number {
  return questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
}

export function Quiz({ id, questions, title }: { id: string; questions: QuizQuestion[]; title?: string }) {
  const { t } = useI18n();
  const prog = useProgress();
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const score = scoreQuiz(questions, answers);
  const record = prog.quizzes[id];
  const allAnswered = answers.every((a) => a !== null);

  const submit = () => {
    setSubmitted(true);
    progress.recordQuiz(id, score, questions.length);
  };
  const retry = () => {
    setAnswers(questions.map(() => null));
    setSubmitted(false);
  };

  return (
    <div className="space-y-4" data-testid={`quiz-${id}`}>
      {title && <h3 className="text-lg font-semibold text-ink">{title}</h3>}
      {questions.map((q, qi) => {
        const name = `${id}-q${qi}`;
        return (
          <fieldset key={qi} className="rounded-2xl border border-line bg-surface p-4">
            <legend className="px-1 text-sm font-semibold text-ink">
              {qi + 1}. {inline(t(q.q))}
            </legend>
            <div className="mt-2 grid gap-2">
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                const correct = submitted && oi === q.answer;
                const wrong = submitted && chosen && oi !== q.answer;
                return (
                  <label
                    key={oi}
                    className={cx(
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                      correct ? 'border-success/60 bg-success/10' : wrong ? 'border-danger/60 bg-danger/10' : chosen ? 'border-accent/60 bg-accent/5' : 'border-line hover:border-accent/40',
                      submitted && 'cursor-default',
                    )}
                  >
                    <input type="radio" name={name} className="accent-[var(--c-accent)]" checked={chosen} disabled={submitted} onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))} />
                    <span className="flex-1 text-ink">{inline(t(opt))}</span>
                    {correct && <CheckCircle2 size={16} className="text-success" aria-label={t(C.correct)} />}
                    {wrong && <XCircle size={16} className="text-danger" aria-label={t(C.incorrect)} />}
                  </label>
                );
              })}
            </div>
            {submitted && (
              <p className={cx('mt-3 text-sm', answers[qi] === q.answer ? 'text-success' : 'text-muted')} role="status">
                <b>{answers[qi] === q.answer ? t(C.correct) : t(C.incorrect)}.</b> {inline(t(q.explain))}
              </p>
            )}
          </fieldset>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        {!submitted ? (
          <Button variant="primary" onClick={submit} disabled={!allAnswered}>
            {t(C.submit)}
          </Button>
        ) : (
          <Button onClick={retry} icon={<RotateCcw size={15} />}>
            {t(C.tryAgain)}
          </Button>
        )}
        {submitted && (
          <span className="text-sm font-semibold text-ink" data-testid="quiz-score">
            {t(['Score', 'النتيجة'])}: <span className="ltr font-mono">{score} / {questions.length}</span>
          </span>
        )}
        {!submitted && record && (
          <span className="text-xs text-subtle">
            {t(['Best so far', 'أفضل نتيجة سابقة'])}: <span className="ltr font-mono">{record.best}/{record.total}</span>
          </span>
        )}
        {!allAnswered && !submitted && <span className="text-xs text-subtle">{t(['Answer every question to check.', 'أجب عن كل الأسئلة للتحقق.'])}</span>}
      </div>
    </div>
  );
}
