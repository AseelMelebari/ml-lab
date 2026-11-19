import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ALGORITHMS, getAlgorithm } from '@/content/algorithms';
import { CATEGORY_LABEL, PARADIGM_LABEL } from '@/content/taxonomy';
import { PageHeader, Select, Badge } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { C, DIFFICULTY } from '@/i18n/common';
import { useVisit } from '@/components/learning/Completion';
import type { Text } from '@/i18n/types';
import type { AlgorithmContent } from '@/content/types';

const ROWS: { label: Text; get: (a: AlgorithmContent, t: (x: Text) => string) => React.ReactNode }[] = [
  { label: ['Purpose', 'الغرض'], get: (a, t) => t(a.compare.purpose) },
  { label: ['Learning paradigm', 'نمط التعلّم'], get: (a, t) => t(PARADIGM_LABEL[a.paradigm]) },
  { label: ['Task type', 'نوع المهمة'], get: (a, t) => a.categories.map((c) => t(CATEGORY_LABEL[c])).join(', ') },
  { label: ['Difficulty', 'الصعوبة'], get: (a, t) => t(DIFFICULTY[a.difficulty]) },
  { label: ['Data requirements', 'متطلبات البيانات'], get: (a, t) => t(a.compare.data) },
  { label: ['Important assumptions', 'الافتراضات المهمة'], get: (a, t) => t(a.compare.assumptions) },
  { label: ['Strengths', 'نقاط القوة'], get: (a, t) => <ul className="space-y-1">{a.advantages.map((x, i) => <li key={i}>+ {t(x)}</li>)}</ul> },
  { label: ['Weaknesses', 'نقاط الضعف'], get: (a, t) => <ul className="space-y-1">{a.limitations.map((x, i) => <li key={i}>− {t(x)}</li>)}</ul> },
  { label: ['Common use cases', 'الاستخدامات الشائعة'], get: (a, t) => <ul className="space-y-1">{a.useCases.map((x, i) => <li key={i}>→ {t(x)}</li>)}</ul> },
  { label: ['Key hyperparameters', 'المعاملات الفائقة الرئيسية'], get: (a) => <code className="text-xs">{a.compare.hyperparams}</code> },
  { label: ['Evaluation methods', 'طرق التقييم'], get: (a, t) => <span className="line-clamp-6">{t(a.evaluation).replace(/\$[^$]*\$/g, '…').replace(/\*\*/g, '').replace(/^- /gm, '• ')}</span> },
  { label: ['Interactive lab', 'المختبر التفاعلي'], get: (a, t) => (a.labId ? <Link to={`/labs/${a.labId}`} className="text-accent-ink underline">{t(C.openLab)}</Link> : <Badge>{t(C.explanation)}</Badge>) },
];

export default function ComparePage() {
  const { t } = useI18n();
  useVisit('compare');
  const [ids, setIds] = useState(['decision-tree', 'random-forest', 'svm']);
  const options = ALGORITHMS.map((a) => ({ value: a.id, label: t(a.name) }));
  const algos = ids.map((id) => getAlgorithm(id)!).filter(Boolean);
  return (
    <>
      <PageHeader eyebrow={t(['Compare', 'قارن'])} title={t(['Algorithm comparison', 'مقارنة الخوارزميات'])} desc={t(['Pick up to three algorithms to compare their purpose, data requirements, assumptions, strengths, weaknesses, hyperparameters and evaluation.', 'اختر حتى ثلاث خوارزميات لمقارنة غرضها ومتطلبات بياناتها وافتراضاتها ونقاط قوتها وضعفها ومعاملاتها الفائقة وطرق تقييمها.'])} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {ids.map((id, i) => (
            <Select key={i} label={`${t(['Algorithm', 'الخوارزمية'])} ${i + 1}`} value={id} options={options} onChange={(v) => setIds((x) => x.map((y, j) => (j === i ? v : y)))} />
          ))}
        </div>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-2">
              <tr>
                <th className="w-44 p-3 text-start text-xs text-muted">{t(['Criterion', 'المعيار'])}</th>
                {algos.map((a) => (
                  <th key={a.id} className="p-3 text-start">
                    <Link to={`/algorithms/${a.id}`} className="text-base font-semibold text-ink hover:text-accent-ink">
                      {t(a.name)}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className="border-t border-line align-top">
                  <th scope="row" className="bg-surface p-3 text-start text-xs font-semibold text-muted">
                    {t(row.label)}
                  </th>
                  {algos.map((a) => (
                    <td key={a.id} className="bg-surface p-3 leading-relaxed text-ink">
                      {row.get(a, t)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
