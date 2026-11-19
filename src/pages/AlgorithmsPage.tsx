import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, GitCompare } from 'lucide-react';
import { ALGORITHMS } from '@/content/algorithms';
import { CATEGORY_LABEL, PARADIGM_LABEL } from '@/content/taxonomy';
import type { Category, Difficulty, Paradigm } from '@/content/types';
import { AlgorithmCard } from '@/components/learning/AlgorithmCard';
import { PageHeader, cx } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { C, DIFFICULTY } from '@/i18n/common';

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cx('rounded-full border px-3 py-1.5 text-[13px] transition-colors', active ? 'border-accent bg-accent/15 text-accent-ink' : 'border-line text-muted hover:text-ink')}>
      {children}
    </button>
  );
}

export default function AlgorithmsPage() {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const paradigm = params.get('paradigm') as Paradigm | null;
  const category = params.get('category') as Category | null;
  const difficulty = params.get('difficulty') as Difficulty | null;
  const labOnly = params.get('lab') === '1';
  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v === null || p.get(k) === v) p.delete(k);
    else p.set(k, v);
    setParams(p, { replace: true });
  };

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ALGORITHMS.filter(
      (a) =>
        (!paradigm || a.paradigm === paradigm) &&
        (!category || a.categories.includes(category)) &&
        (!difficulty || a.difficulty === difficulty) &&
        (!labOnly || !!a.labId) &&
        (!needle || [a.name[0], a.name[1], a.short[0], a.short[1], a.id].some((s) => s.toLowerCase().includes(needle))),
    );
  }, [q, paradigm, category, difficulty, labOnly]);
  const any = paradigm || category || difficulty || labOnly || q;

  return (
    <>
      <PageHeader eyebrow={t(['Explore', 'استكشف'])} title={t(['Algorithm library', 'مكتبة الخوارزميات'])} desc={t(['Search and filter every algorithm on the platform. Cards marked “Interactive lab” contain a working simulation; “Explanation” pages teach the concepts and are designed for future interactive expansion.', 'ابحث وصفِّ كل الخوارزميات في المنصة. البطاقات المعلَّمة بـ«مختبر تفاعلي» تحتوي محاكاة عاملة، أما صفحات «شرح نظري» فتشرح المفاهيم وصُممت للتوسع التفاعلي مستقبلًا.'])}>
        <Link to="/compare" className="inline-flex items-center gap-2 text-sm text-accent-ink hover:underline">
          <GitCompare size={16} /> {t(['Compare algorithms side by side', 'قارن الخوارزميات جنبًا إلى جنب'])}
        </Link>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <label className="relative block">
            <span className="sr-only">{t(['Search algorithms', 'ابحث في الخوارزميات'])}</span>
            <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                set('q', e.target.value || null);
              }}
              placeholder={t(['Search: e.g. “tree”, “clustering”, “تصنيف”…', 'ابحث: مثل «شجرة» أو «تجميع» أو “tree”…'])}
              className="h-12 w-full rounded-xl border border-line bg-surface-2 ps-10 pe-4 text-[15px] text-ink placeholder:text-subtle focus:border-accent"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-xs font-semibold uppercase tracking-wide text-subtle">{t(['Paradigm', 'النمط'])}</span>
            {(['supervised', 'unsupervised', 'reinforcement'] as Paradigm[]).map((p) => (
              <Chip key={p} active={paradigm === p} onClick={() => set('paradigm', p)}>
                {t(PARADIGM_LABEL[p])}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-xs font-semibold uppercase tracking-wide text-subtle">{t(['Task', 'المهمة'])}</span>
            {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
              <Chip key={c} active={category === c} onClick={() => set('category', c)}>
                {t(CATEGORY_LABEL[c])}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-xs font-semibold uppercase tracking-wide text-subtle">{t(['Level', 'المستوى'])}</span>
            {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((d) => (
              <Chip key={d} active={difficulty === d} onClick={() => set('difficulty', d)}>
                {t(DIFFICULTY[d])}
              </Chip>
            ))}
            <span className="mx-2 h-5 w-px bg-line" />
            <Chip active={labOnly} onClick={() => set('lab', '1')}>
              {t(['Interactive lab only', 'المختبرات التفاعلية فقط'])}
            </Chip>
            {any && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
                onClick={() => {
                  setQ('');
                  setParams({}, { replace: true });
                }}
              >
                <X size={13} /> {t(C.clear)}
              </button>
            )}
          </div>
        </div>
        <p className="mt-6 text-sm text-muted" role="status" aria-live="polite">
          {lang === 'ar' ? `${results.length} خوارزمية` : `${results.length} algorithm${results.length === 1 ? '' : 's'}`}
        </p>
        {results.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center text-muted">{t(['No algorithm matches these filters. Try removing one.', 'لا توجد خوارزمية تطابق عوامل التصفية. جرّب إزالة أحدها.'])}</div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((a) => (
              <AlgorithmCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
