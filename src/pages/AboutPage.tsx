import { Link } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { PageHeader, Card, Callout } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';

export default function AboutPage() {
  const { t, lang } = useI18n();
  return (
    <>
      <PageHeader eyebrow={t(['About', 'عن المنصة'])} title={t(BRAND.fullName)} desc={t(BRAND.tagline)} />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="prose-ml max-w-3xl space-y-8 text-[16px] leading-relaxed text-muted">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">{t(['Educational purpose', 'الغرض التعليمي'])}</h2>
            <p>{t(['ML LAB helps beginners and university students understand Machine Learning by experimenting with real algorithms. Instead of static diagrams, each lab lets you change data and parameters and see how the mathematics responds.', 'تساعد ML LAB المبتدئين وطلاب الجامعات على فهم تعلّم الآلة بالتجربة على خوارزميات حقيقية. فبدل المخططات الثابتة يتيح لك كل مختبر تغيير البيانات والمعاملات ورؤية كيف تستجيب الرياضيات.'])}</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">{t(['How it works', 'كيف تعمل'])}</h2>
            <ul className="list-disc space-y-1.5 ps-5">
              <li>{t(['All simulations run locally in your browser in TypeScript — no server, no paid APIs, no accounts.', 'تعمل جميع المحاكاة محليًا في متصفحك بلغة TypeScript — بلا خادم ولا واجهات مدفوعة ولا حسابات.'])}</li>
              <li>{t(['Algorithms are separated from the interface and covered by automated tests that check them against analytical results.', 'الخوارزميات منفصلة عن الواجهة ومغطاة باختبارات آلية تتحقق منها مقابل نتائج تحليلية.'])}</li>
              <li>{t(['Datasets are small, synthetic and seeded so that experiments are reproducible. They are not real-world measurements.', 'البيانات صغيرة واصطناعية وذات بذرة ثابتة لتكون التجارب قابلة للتكرار، وهي ليست قياسات من العالم الحقيقي.'])}</li>
              <li>{t(['Progress is stored only in your browser’s local storage.', 'يُحفظ التقدّم في التخزين المحلي لمتصفحك فقط.'])}</li>
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">{t(['What is included', 'ما الذي تتضمنه'])}</h2>
            <p>{t(['12 interactive labs (seven supervised, three unsupervised, two reinforcement learning), explanation pages for further algorithms, 16 fundamentals modules, training and evaluation modules, an algorithm comparison tool, quizzes, exercises, lab challenges and an Instructor Mode.', '12 مختبرًا تفاعليًا (سبعة للتعلّم الموجَّه وثلاثة لغير الموجَّه واثنان للتعلّم المعزّز)، وصفحات شرح لخوارزميات إضافية، و16 وحدة أساسية، ووحدات للتدريب والتقييم، وأداة لمقارنة الخوارزميات، واختبارات وتمارين وتحديات مختبرية، ووضع للمحاضِر.'])}</p>
          </section>
          <Callout tone="info" title={t(['Honest limits', 'حدود واضحة'])}>
            {t(['ML LAB is a learning tool. Its implementations favour clarity over speed and are intended for small educational datasets, not production use. Pages marked “Explanation” or “Planned” do not contain interactive simulations yet.', 'ML LAB أداة تعليمية. تفضّل تطبيقاتها الوضوح على السرعة وهي مخصصة لبيانات تعليمية صغيرة لا للاستخدام الإنتاجي. والصفحات المعلَّمة بـ«شرح نظري» أو «مخطط لها» لا تحتوي محاكاة تفاعلية بعد.'])}
          </Callout>
        </div>
        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">{t(['Creator', 'المُنشئ'])}</h2>
            <p className="mt-2 text-lg font-semibold text-ink">{lang === 'ar' ? BRAND.ownerAr : BRAND.owner}</p>
            <p className="mt-1 text-sm text-muted">{t(['Designed and developed ML LAB as an open educational project.', 'صمّمت ML LAB وطوّرتها كمشروع تعليمي مفتوح.'])}</p>
            <a href={BRAND.repoUrl} target="_blank" rel="noreferrer noopener" className="ltr mt-3 inline-block text-sm text-cyan hover:underline">
              github.com/AseelMelebari/ml-lab
            </a>
          </Card>
          <Card className="p-5 text-sm text-muted">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">{t(['License & credits', 'الترخيص والشكر'])}</h2>
            <p className="mt-2">{t(['Released under the MIT License. Built with React, TypeScript, Vite, Tailwind CSS, KaTeX and Lucide icons.', 'منشورة برخصة MIT. ومبنية باستخدام React وTypeScript وVite وTailwind CSS وKaTeX وأيقونات Lucide.'])}</p>
            <p className="mt-2">{t(['ML LAB is independent and is not affiliated with, or endorsed by, any university or institution.', 'ML LAB مشروع مستقل وغير تابع لأي جامعة أو مؤسسة ولا يحظى بتأييد رسمي منها.'])}</p>
          </Card>
          <Link to="/roadmap" className="block rounded-2xl bg-accent px-5 py-3 text-center text-sm font-semibold text-[#04201d]">
            {t(['Start learning', 'ابدأ التعلّم'])}
          </Link>
        </aside>
      </div>
    </>
  );
}
