import { Link } from 'react-router-dom';
import { FlaskConical, ArrowUpRight } from 'lucide-react';
import { LAB_ALGORITHMS } from '@/content/algorithms';
import { PARADIGM_LABEL, PARADIGM_TONE } from '@/content/taxonomy';
import { Badge, PageHeader } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { useProgress } from '@/progress/store';
import type { Paradigm } from '@/content/types';

export default function LabsPage() {
  const { t } = useI18n();
  const prog = useProgress();
  const groups: Paradigm[] = ['supervised', 'unsupervised', 'reinforcement'];
  return (
    <>
      <PageHeader eyebrow={t(['Interactive laboratories', 'المختبرات التفاعلية'])} title={t(['12 working simulations', '12 محاكاة عاملة'])} desc={t(['Each lab runs a real implementation of the algorithm in your browser. Move data, change parameters and watch the mathematics respond.', 'يشغّل كل مختبر تطبيقًا حقيقيًا للخوارزمية في متصفحك. حرّك البيانات وغيّر المعاملات وشاهد الرياضيات تستجيب.'])} />
      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 py-12">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="mb-4 text-xl font-semibold text-ink">{t(PARADIGM_LABEL[g])}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LAB_ALGORITHMS.filter((a) => a.paradigm === g).map((a) => {
                const events = prog.labs[a.labId!] ?? [];
                return (
                  <Link key={a.id} to={`/labs/${a.labId}`} className="group rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/50">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <FlaskConical size={20} />
                      </span>
                      {events.length > 0 ? <Badge tone="success">{t(['Explored', 'تمت التجربة'])}</Badge> : <Badge tone={PARADIGM_TONE[g]}>{t(['New', 'جديد'])}</Badge>}
                    </div>
                    <h3 className="text-lg font-semibold text-ink">{t(a.name)}</h3>
                    <p className="mt-1.5 text-sm text-muted">{t(a.short)}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-ink">
                      {t(['Open lab', 'افتح المختبر'])} <ArrowUpRight size={15} className="rtl:-scale-x-100" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
