import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { PARADIGMS } from '@/content/paradigms';
import { Badge, PageHeader } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { useVisit } from '@/components/learning/Completion';

export default function ParadigmsPage() {
  const { t } = useI18n();
  useVisit('paradigms');
  return (
    <>
      <PageHeader eyebrow={t(['Learning paradigms', 'أنماط التعلّم'])} title={t(['Five ways a machine can learn', 'خمس طرق يتعلّم بها الحاسوب'])} desc={t(['Paradigms differ in the feedback the learner receives. The right choice depends on what data and signals your problem actually provides.', 'تختلف الأنماط في التغذية الراجعة التي يتلقاها المتعلّم. والاختيار الصحيح يعتمد على البيانات والإشارات التي توفرها مشكلتك فعلًا.'])} />
      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 py-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PARADIGMS.map((p) => (
            <Link key={p.id} to={`/paradigms/${p.id}`} className="group rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-accent/50">
              <div className="mb-3 flex items-center justify-between">
                <Badge tone={p.depth === 'deep' ? 'accent' : 'neutral'}>{p.depth === 'deep' ? t(['Interactive labs', 'مختبرات تفاعلية']) : t(['Introduction', 'مقدمة'])}</Badge>
                <ArrowUpRight size={16} className="text-subtle group-hover:text-accent rtl:-scale-x-100" />
              </div>
              <h2 className="text-xl font-semibold text-ink">{t(p.title)}</h2>
              <p className="mt-2 text-muted">{t(p.tagline)}</p>
              <p className="mt-4 text-xs text-subtle">
                <b className="text-muted">{t(['Feedback', 'التغذية الراجعة'])}:</b> {t(p.feedback)}
              </p>
            </Link>
          ))}
        </div>
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-xl font-semibold text-ink">{t(['How the paradigms relate', 'كيف ترتبط الأنماط ببعضها'])}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-2 text-start">{t(['Paradigm', 'النمط'])}</th>
                  <th className="text-start">{t(['Data you need', 'البيانات المطلوبة'])}</th>
                  <th className="text-start">{t(['What is learned', 'ما يتم تعلّمه'])}</th>
                  <th className="text-start">{t(['Typical question', 'السؤال النموذجي'])}</th>
                </tr>
              </thead>
              <tbody className="text-muted">
                {(
                  [
                    [['Supervised', 'موجَّه'], ['Inputs + correct labels', 'مدخلات + تصنيفات صحيحة'], ['A mapping x → y', 'تحويل x ← y'], ['“What is the price / class?”', '«ما السعر / الفئة؟»']],
                    [['Unsupervised', 'غير موجَّه'], ['Inputs only', 'مدخلات فقط'], ['Structure: groups, axes, rules', 'البنية: مجموعات، محاور، قواعد'], ['“What groups exist?”', '«ما المجموعات الموجودة؟»']],
                    [['Reinforcement', 'معزّز'], ['An environment that gives rewards', 'بيئة تعطي مكافآت'], ['A policy: state → action', 'سياسة: حالة ← إجراء'], ['“What should I do next?”', '«ماذا أفعل بعد ذلك؟»']],
                    [['Semi-supervised', 'شبه موجَّه'], ['Few labels + many unlabelled inputs', 'تصنيفات قليلة + مدخلات كثيرة غير مصنّفة'], ['A mapping, helped by structure', 'تحويل مدعوم بالبنية'], ['“Can unlabelled data help?”', '«هل تساعد البيانات غير المصنّفة؟»']],
                    [['Self-supervised', 'ذاتي الإشراف'], ['Unlabelled data + pretext task', 'بيانات غير مصنّفة + مهمة تمهيدية'], ['Reusable representations', 'تمثيلات قابلة لإعادة الاستخدام'], ['“What does this data look like inside?”', '«كيف تبدو هذه البيانات من الداخل؟»']],
                  ] as const
                ).map((row, i) => (
                  <tr key={i} className="border-t border-line">
                    {row.map((c, j) => (
                      <td key={j} className={`py-2.5 pe-3 ${j === 0 ? 'font-semibold text-ink' : ''}`}>
                        {t(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted">{t(['The paradigms are often combined: a self-supervised model can be fine-tuned with supervised labels, clustering can create features for a classifier, and RL agents often use supervised components inside.', 'كثيرًا ما تُدمج الأنماط: يمكن ضبط نموذج ذاتي الإشراف بتصنيفات موجَّهة، ويمكن للتجميع إنشاء خصائص لمصنِّف، وغالبًا ما يستخدم وكلاء التعلّم المعزّز مكونات موجَّهة بداخلهم.'])}</p>
        </section>
      </div>
    </>
  );
}
