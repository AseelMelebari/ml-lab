import { Link } from 'react-router-dom';
import { Keyboard, Maximize2, Play, Presentation } from 'lucide-react';
import { DEMOS } from '@/content/demos';
import { Kbd, PageHeader } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { useVisit } from '@/components/learning/Completion';

export default function InstructorPage() {
  const { t } = useI18n();
  useVisit('instructor');
  return (
    <>
      <PageHeader eyebrow={t(['Instructor Mode', 'وضع المحاضِر'])} title={t(['Teach Machine Learning live', 'درّس تعلّم الآلة مباشرة'])} desc={t(['Ten ready-made demonstrations built on the same labs students use — with large labels, a simplified layout, presenter shortcuts and talking points.', 'عشرة عروض جاهزة مبنية على المختبرات نفسها التي يستخدمها الطلاب — بخطوط كبيرة وتخطيط مبسّط واختصارات للمقدّم ونقاط للحديث.'])}>
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <span className="inline-flex items-center gap-2"><Keyboard size={16} /> <Kbd>Space</Kbd> {t(['play/pause', 'تشغيل/إيقاف'])}</span>
          <span className="inline-flex items-center gap-2"><Kbd>S</Kbd> {t(['step', 'خطوة'])}</span>
          <span className="inline-flex items-center gap-2"><Kbd>R</Kbd> {t(['reset', 'إعادة ضبط'])}</span>
          <span className="inline-flex items-center gap-2"><Kbd>←</Kbd><Kbd>→</Kbd> {t(['previous / next demo', 'العرض السابق / التالي'])}</span>
          <span className="inline-flex items-center gap-2"><Maximize2 size={15} /> <Kbd>F</Kbd> {t(['full screen', 'ملء الشاشة'])}</span>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMOS.map((d, i) => (
            <li key={d.id}>
              <Link to={`/instructor/${d.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-purple/50">
                <div className="mb-3 flex items-center justify-between">
                  <span className="ltr flex h-9 w-9 items-center justify-center rounded-xl bg-purple/15 font-mono text-sm font-bold text-purple">{i + 1}</span>
                  <Presentation size={18} className="text-subtle group-hover:text-purple" />
                </div>
                <h2 className="text-lg font-semibold text-ink">{t(d.title)}</h2>
                <p className="mt-1.5 flex-1 text-sm text-muted">{t(d.goal)}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-purple">
                  <Play size={15} className="rtl:-scale-x-100" /> {t(['Start demo', 'ابدأ العرض'])}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
