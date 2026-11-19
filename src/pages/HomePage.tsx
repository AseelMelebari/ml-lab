import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BookOpenCheck, Compass, FlaskConical, GraduationCap, Languages, Presentation, ShieldCheck, Sigma, Trophy, Users } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { LAB_ALGORITHMS, ALGORITHMS } from '@/content/algorithms';
import { PARADIGMS } from '@/content/paradigms';
import { FUNDAMENTALS } from '@/content/fundamentals';
import { AlgorithmCard } from '@/components/learning/AlgorithmCard';
import { HeroPreview } from '@/components/learning/HeroPreview';
import { SectionTitle } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';

export default function HomePage() {
  const { t } = useI18n();
  const featured = ['linear-regression', 'decision-tree', 'svm', 'k-means', 'pca', 'q-learning'].map((id) => LAB_ALGORITHMS.find((a) => a.id === id)!);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-grid-faint opacity-70 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
        <div className="absolute -top-40 start-1/2 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t(['Open educational platform · Arabic & English', 'منصة تعليمية مفتوحة · العربية والإنجليزية'])}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight text-ink">
              <span className="ltr inline-block">{BRAND.name}</span>
              <span className="mt-2 block bg-gradient-to-r from-accent via-cyan to-purple bg-clip-text text-transparent">{t(BRAND.tagline)}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              {t(["Don't just read how algorithms work. Move the data, change the parameters, and watch the mathematics happen — every chart is computed live in your browser.", 'لا تكتفِ بقراءة كيف تعمل الخوارزميات. حرّك البيانات وغيّر المعاملات وشاهد الرياضيات تحدث أمامك — كل رسم يُحسب مباشرة في متصفحك.'])}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/algorithms" className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-6 text-[15px] font-semibold text-[#04201d] shadow-[0_10px_30px_-12px_rgba(45,212,191,.7)] hover:brightness-110">
                {t(['Explore algorithms', 'استكشف الخوارزميات'])} <ArrowRight size={18} className="rtl:-scale-x-100" />
              </Link>
              <Link to="/learn" className="inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-surface px-6 text-[15px] font-medium text-ink hover:border-accent/50">
                {t(['Start from the basics', 'ابدأ من الأساسيات'])}
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {(
                [
                  [String(LAB_ALGORITHMS.length), ['interactive labs', 'مختبرًا تفاعليًا']],
                  [String(ALGORITHMS.length), ['algorithm lessons', 'درسًا للخوارزميات']],
                  [String(FUNDAMENTALS.length), ['fundamental modules', 'وحدة أساسية']],
                ] as const
              ).map(([n, l]) => (
                <div key={l[0]}>
                  <dt className="sr-only">{t(l)}</dt>
                  <dd className="ltr font-mono text-3xl font-semibold text-ink">{n}</dd>
                  <dd className="text-xs text-muted">{t(l)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="animate-fade-up rounded-3xl border border-line bg-surface p-2 shadow-[0_30px_80px_-40px_rgba(45,212,191,.35)] [animation-delay:120ms]">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Roadmap preview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <SectionTitle eyebrow={t(['Learning roadmap', 'خريطة التعلّم'])} title={t(['A clear path from first idea to advanced methods', 'مسار واضح من الفكرة الأولى إلى الطرق المتقدمة'])} desc={t(['Follow the guided path or jump to any topic. Your progress is saved locally — no account needed.', 'اتبع المسار الإرشادي أو انتقل إلى أي موضوع. يُحفظ تقدّمك محليًا — بلا حاجة لحساب.'])} />
        <div className="grid gap-4 md:grid-cols-3">
          {(
            [
              [['Beginner', 'مبتدئ'], ['What ML is, data, features and labels, linear & logistic regression, KNN, K-Means, the bandit problem.', 'ما تعلّم الآلة، والبيانات، والخصائص والتصنيفات، والانحدار الخطي واللوجستي، وKNN، وK-Means، ومسألة قاطع الطريق.']],
              [['Intermediate', 'متوسط'], ['Trees and forests, Naive Bayes, PCA, hierarchical clustering, Q-learning, validation and tuning.', 'الأشجار والغابات، وبايز الساذج، وPCA، والتجميع الهرمي، وتعلّم Q، والتحقق والضبط.']],
              [['Advanced', 'متقدم'], ['SVMs and kernels, density and manifold methods, deep RL, limitations and responsible ML.', 'SVM والنوى، وطرق الكثافة والمتشعبات، والتعلّم المعزّز العميق، والقيود وتعلّم الآلة المسؤول.']],
            ] as const
          ).map(([title, desc], i) => (
            <Link key={i} to="/roadmap" className="group relative rounded-2xl border border-line bg-surface p-6 transition-all hover:border-accent/50">
              <span className="absolute end-5 top-5 font-mono text-5xl font-bold text-line group-hover:text-accent/30">0{i + 1}</span>
              <h3 className="text-lg font-semibold text-ink">{t(title)}</h3>
              <p className="mt-2 max-w-[85%] text-sm text-muted">{t(desc)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Paradigms */}
      <section className="border-y border-line bg-surface-2/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
          <SectionTitle eyebrow={t(['Machine learning paradigms', 'أنماط تعلّم الآلة'])} title={t(['Different problems need different kinds of learning', 'المسائل المختلفة تحتاج أنواعًا مختلفة من التعلّم'])} />
          <div className="grid gap-4 md:grid-cols-3">
            {PARADIGMS.slice(0, 3).map((p, i) => (
              <Link key={p.id} to={`/paradigms/${p.id}`} className="rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-accent/50">
                <div className={`mb-4 h-1 w-12 rounded-full ${['bg-accent', 'bg-purple', 'bg-cyan'][i]}`} />
                <h3 className="text-xl font-semibold text-ink">{t(p.title)}</h3>
                <p className="mt-2 text-muted">{t(p.tagline)}</p>
                <p className="mt-4 text-xs text-subtle">{t(p.feedback)}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {PARADIGMS.slice(3).map((p) => (
              <Link key={p.id} to={`/paradigms/${p.id}`} className="flex items-center justify-between rounded-2xl border border-line bg-surface px-6 py-4 hover:border-accent/50">
                <div>
                  <h3 className="font-semibold text-ink">{t(p.title)}</h3>
                  <p className="text-sm text-muted">{t(p.tagline)}</p>
                </div>
                <ArrowRight size={18} className="text-subtle rtl:-scale-x-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured labs */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow={t(['Featured labs', 'مختبرات مميزة'])} title={t(['Real algorithms, running in front of you', 'خوارزميات حقيقية تعمل أمامك'])} />
          <Link to="/labs" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline">
            {t(['All 12 labs', 'كل المختبرات الـ12'])} <ArrowRight size={15} className="rtl:-scale-x-100" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((a) => (
            <AlgorithmCard key={a.id} a={a} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-line bg-surface-2/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
          <SectionTitle eyebrow={t(['Why ML LAB', 'لماذا ML LAB'])} title={t(['Built for understanding, not memorising', 'مصممة للفهم لا للحفظ'])} />
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                [FlaskConical, ['Real computations', 'حسابات حقيقية'], ['Boundaries, trees, components and policies come from genuine implementations — tested against analytical results.', 'الحدود والأشجار والمكونات والسياسات ناتجة عن تطبيقات حقيقية — مختبرة مقابل نتائج تحليلية.']],
                [Sigma, ['Mathematics made visible', 'رياضيات مرئية'], ['Equations sit next to the visualisation they describe, with live numbers.', 'تقف المعادلات بجوار التصور الذي تصفه، مع أرقام حية.']],
                [Languages, ['Arabic and English', 'العربية والإنجليزية'], ['Every lesson, control and quiz in both languages, with a proper right-to-left layout.', 'كل درس وأداة تحكم واختبار باللغتين، مع تخطيط سليم من اليمين إلى اليسار.']],
                [BookOpenCheck, ['Quizzes & challenges', 'اختبارات وتحديات'], ['Instant feedback, numeric exercises and lab challenges verified by your actions.', 'تغذية راجعة فورية وتمارين عددية وتحديات مختبرية يُتحقق منها بأفعالك.']],
                [BarChart3, ['Evaluation done right', 'تقييم صحيح'], ['Train/test splits, cross-validation, ROC curves and the pitfalls that fool beginners.', 'التقسيم إلى تدريب/اختبار، والتحقق المتقاطع، ومنحنيات ROC، والأخطاء التي تخدع المبتدئين.']],
                [ShieldCheck, ['Private by design', 'خصوصية في التصميم'], ['No account, no tracking, no external AI services. Everything runs locally.', 'بلا حساب ولا تتبّع ولا خدمات ذكاء اصطناعي خارجية. كل شيء يعمل محليًا.']],
              ] as const
            ).map(([Icon, title, desc]) => (
              <div key={title[0]}>
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-accent">
                  <Icon size={21} />
                </span>
                <h3 className="text-base font-semibold text-ink">{t(title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-line bg-surface p-8">
            <GraduationCap className="mb-4 text-accent" size={28} />
            <h2 className="text-2xl font-semibold text-ink">{t(['For students', 'للطلاب'])}</h2>
            <ul className="mt-4 space-y-2 text-muted">
              <li>→ {t(['Build intuition before (or alongside) the equations.', 'ابنِ الحدس قبل المعادلات (أو بجانبها).'])}</li>
              <li>→ {t(['Test ideas instantly: “what if I add an outlier here?”', 'اختبر الأفكار فورًا: «ماذا لو أضفت قيمة شاذة هنا؟»'])}</li>
              <li>→ {t(['Connect each concept to working Python code.', 'اربط كل مفهوم بكود بايثون عامل.'])}</li>
            </ul>
            <Link to="/roadmap" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
              <Compass size={16} /> {t(['Open the roadmap', 'افتح خريطة التعلّم'])}
            </Link>
          </div>
          <div className="rounded-3xl border border-purple/30 bg-purple/5 p-8">
            <Presentation className="mb-4 text-purple" size={28} />
            <h2 className="text-2xl font-semibold text-ink">{t(['For instructors', 'للمحاضرين'])}</h2>
            <ul className="mt-4 space-y-2 text-muted">
              <li>→ {t(['Ten ready-made classroom demonstrations.', 'عشرة عروض صفية جاهزة.'])}</li>
              <li>→ {t(['Large type, full-screen mode, keyboard shortcuts and talking points.', 'خطوط كبيرة، وضع ملء الشاشة، واختصارات لوحة المفاتيح، ونقاط للحديث.'])}</li>
              <li>→ {t(['The same labs your students use afterwards.', 'المختبرات نفسها التي يستخدمها طلابك لاحقًا.'])}</li>
            </ul>
            <Link to="/instructor" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-purple">
              <Users size={16} /> {t(['Enter Instructor Mode', 'ادخل وضع المحاضِر'])}
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 sm:px-6 py-20 text-center">
          <Trophy className="mb-4 text-warn" size={28} />
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink">{t(['An open, growing learning resource', 'مصدر تعليمي مفتوح ومتنامٍ'])}</h2>
          <p className="mt-4 max-w-2xl text-muted">{t(['ML LAB is an open-source educational project. It is designed to keep growing with new labs and lessons, and to be useful to students, educators and curious learners anywhere.', 'ML LAB مشروع تعليمي مفتوح المصدر، صُمم ليستمر في النمو بمختبرات ودروس جديدة، وليكون مفيدًا للطلاب والمعلمين والمتعلمين الشغوفين في كل مكان.'])}</p>
          <Link to="/about" className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink hover:border-accent/50">
            {t(['About the project', 'عن المشروع'])}
          </Link>
        </div>
      </section>
    </>
  );
}
