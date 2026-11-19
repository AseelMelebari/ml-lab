import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { DataLine, Plot2D, usePlot } from '@/components/charts/Plot2D';
import { Button, Slider, Stat, cx } from '@/components/ui/primitives';
import { TeX } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import type { Text } from '@/i18n/types';
import type { FundamentalDemo } from '@/content/fundamentals';
import { BiasVarianceWidget, SplitWidget } from '@/components/evaluation/widgets';

export function FundamentalDemoView({ demo }: { demo: FundamentalDemo }) {
  switch (demo) {
    case 'venn':
      return <VennDemo />;
    case 'how-ml-works':
      return <HowMLWorksDemo />;
    case 'dataset-table':
      return <DatasetTable />;
    case 'features-labels':
      return <FeaturesLabelsDemo />;
    case 'split':
      return <SplitWidget />;
    case 'train-infer':
      return <TrainInferDemo />;
    case 'generalization':
      return <BiasVarianceWidget />;
    case 'lifecycle':
      return <LifecycleDemo />;
    case 'paradigm-sorter':
      return <ParadigmSorter />;
  }
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-ink">Interactive</span>
        {title}
      </div>
      {children}
    </div>
  );
}

/* AI ⊃ ML ⊃ DL */
function VennDemo() {
  const { t } = useI18n();
  const [sel, setSel] = useState<'ai' | 'ml' | 'dl'>('ml');
  const info: Record<string, { title: Text; desc: Text; ex: Text }> = {
    ai: { title: ['Artificial Intelligence', 'الذكاء الاصطناعي'], desc: ['Any technique that makes computers behave intelligently.', 'أي تقنية تجعل الحواسيب تتصرف بذكاء.'], ex: ['Chess search engines, rule-based expert systems, route planners.', 'محركات بحث الشطرنج، والأنظمة الخبيرة القائمة على القواعد، ومخططات المسارات.'] },
    ml: { title: ['Machine Learning', 'تعلّم الآلة'], desc: ['AI that learns patterns from data.', 'ذكاء اصطناعي يتعلّم الأنماط من البيانات.'], ex: ['Spam filters, credit scoring with decision trees, customer clustering.', 'مرشحات الرسائل المزعجة، والتصنيف الائتماني بأشجار القرار، وتجميع العملاء.'] },
    dl: { title: ['Deep Learning', 'التعلّم العميق'], desc: ['ML with multi-layer neural networks.', 'تعلّم آلة بشبكات عصبية متعددة الطبقات.'], ex: ['Image recognition, speech-to-text, large language models.', 'التعرّف على الصور، وتحويل الكلام إلى نص، ونماذج اللغة الكبيرة.'] },
  };
  const ring = (id: 'ai' | 'ml' | 'dl', cx0: number, rx: number, ry: number, color: string, label: string, ly: number) => (
    <g onClick={() => setSel(id)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={label} aria-pressed={sel === id} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(id)}>
      <ellipse cx={cx0} cy={130} rx={rx} ry={ry} fill={color} fillOpacity={sel === id ? 0.28 : 0.1} stroke={color} strokeWidth={sel === id ? 3 : 1.5} />
      <text x={cx0} y={ly} textAnchor="middle" fontSize={15} fontWeight={700} fill={color}>
        {label}
      </text>
    </g>
  );
  return (
    <Frame title={t(['AI ⊃ Machine Learning ⊃ Deep Learning (click a layer)', 'الذكاء الاصطناعي ⊃ تعلّم الآلة ⊃ التعلّم العميق (انقر على طبقة)'])}>
      <div className="grid items-center gap-4 md:grid-cols-2">
        <svg viewBox="0 0 400 260" className="w-full" style={{ direction: 'ltr' }}>
          {ring('ai', 200, 190, 120, 'var(--c-cyan)', 'AI', 34)}
          {ring('ml', 215, 135, 85, 'var(--c-accent)', 'ML', 72)}
          {ring('dl', 235, 70, 46, 'var(--c-purple)', 'DL', 136)}
        </svg>
        <div>
          <h4 className="text-lg font-semibold text-ink">{t(info[sel].title)}</h4>
          <p className="mt-1 text-muted">{t(info[sel].desc)}</p>
          <p className="mt-3 text-sm text-ink">
            <b>{t(['Examples', 'أمثلة'])}:</b> {t(info[sel].ex)}
          </p>
        </div>
      </div>
    </Frame>
  );
}

/* Data, model, loss, optimiser — a live 5-point example */
const PTS = [
  [1, 2.1],
  [2, 2.9],
  [3, 4.2],
  [4, 4.8],
  [5, 6.1],
];
function HowMLWorksDemo() {
  const { t, num } = useI18n();
  const [w, setW] = useState(0.3);
  const [b, setB] = useState(1);
  const mse = PTS.reduce((s, [x, y]) => s + (w * x + b - y) ** 2, 0) / PTS.length;
  const best = mse < 0.08;
  return (
    <Frame title={t(['Be the optimiser: adjust the parameters to reduce the loss', 'كن أنت المُحسِّن: اضبط المعاملات لخفض الخسارة'])}>
      <div className="grid gap-4 md:grid-cols-2">
        <Plot2D domain={{ xMin: 0, xMax: 6, yMin: 0, yMax: 8 }} width={420} height={280} xLabel="x" yLabel="y" ariaLabel={t(['Five data points and a line', 'خمس نقاط بيانات وخط'])}>
          {PTS.map(([x, y], i) => (
            <DataLine key={i} x1={x} y1={y} x2={x} y2={w * x + b} stroke="var(--c-danger)" strokeWidth={1.5} strokeDasharray="3 2" />
          ))}
          <DataLine x1={0} y1={b} x2={6} y2={w * 6 + b} stroke="var(--c-accent)" strokeWidth={3} />
          <PtsLayer />
        </Plot2D>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1 text-center text-[11px]">
            {[
              ['Data', 'البيانات'],
              ['Model', 'النموذج'],
              ['Loss', 'الخسارة'],
              ['Optimiser', 'المُحسِّن'],
            ].map((s, i) => (
              <div key={i} className={cx('rounded-lg border px-1 py-2', i === 3 ? 'border-warn/60 bg-warn/10 text-warn' : 'border-line text-muted')}>
                {t(s as unknown as Text)}
                {i === 3 && <div className="text-[10px]">= {t(['you', 'أنت'])}</div>}
              </div>
            ))}
          </div>
          <Slider label={t(['slope w', 'الميل w'])} value={w} min={-1} max={2.5} step={0.01} onChange={setW} format={(v) => v.toFixed(2)} />
          <Slider label={t(['intercept b', 'المقطع b'])} value={b} min={-2} max={5} step={0.01} onChange={setB} format={(v) => v.toFixed(2)} />
          <Stat label={t(['Loss (mean squared error)', 'الخسارة (متوسط مربع الخطأ)'])} value={num(mse, 4)} tone={best ? 'accent' : undefined} sub={best ? t(['Excellent — close to the least-squares minimum (≈0.065).', 'ممتاز — قريب من الحد الأدنى للمربعات الصغرى (≈0.065).']) : t(['Make the red residuals shorter.', 'اجعل البواقي الحمراء أقصر.'])} />
          <p className="text-sm text-muted">
            <TeX tex="\hat y = w x + b" /> · {t(['Gradient descent automates exactly this search.', 'الانحدار التدرّجي يؤتمت هذا البحث تحديدًا.'])}{' '}
            <Link to="/labs/linear-regression" className="text-accent-ink underline">
              {t(['Open the lab', 'افتح المختبر'])}
            </Link>
          </p>
        </div>
      </div>
    </Frame>
  );
}
function PtsLayer() {
  const { sx, sy } = usePlot();
  return (
    <g>
      {PTS.map(([x, y], i) => (
        <circle key={i} cx={sx(x)} cy={sy(y)} r={6} fill="var(--c-cyan)" stroke="var(--c-plot)" strokeWidth={1.5} />
      ))}
    </g>
  );
}

/* Small tabular dataset */
const HOUSES = [
  { size: 85, rooms: 2, age: 12, district: 'north', price: 210 },
  { size: 120, rooms: 3, age: 5, district: 'centre', price: 340 },
  { size: 64, rooms: 1, age: 30, district: 'south', price: 140 },
  { size: 150, rooms: 4, age: 8, district: 'north', price: 395 },
  { size: 98, rooms: 3, age: 20, district: 'south', price: 230 },
];
type Col = keyof (typeof HOUSES)[number];
const COLS: { key: Col; label: Text; type: 'num' | 'cat' }[] = [
  { key: 'size', label: ['size (m²)', 'المساحة (م²)'], type: 'num' },
  { key: 'rooms', label: ['rooms', 'الغرف'], type: 'num' },
  { key: 'age', label: ['age (years)', 'العمر (سنوات)'], type: 'num' },
  { key: 'district', label: ['district', 'الحي'], type: 'cat' },
  { key: 'price', label: ['price (k)', 'السعر (ألف)'], type: 'num' },
];

function DatasetTable({ target, onTarget }: { target?: Col; onTarget?: (c: Col) => void }) {
  const { t } = useI18n();
  return (
    <Frame title={onTarget ? t(['Click a column header to make it the label (target)', 'انقر على عنوان عمود لجعله التصنيف (الهدف)']) : t(['A small tabular dataset (synthetic)', 'مجموعة بيانات جدولية صغيرة (اصطناعية)'])}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-start text-xs text-subtle">#</th>
              {COLS.map((c) => (
                <th key={c.key} className="p-1">
                  <button
                    type="button"
                    disabled={!onTarget}
                    onClick={() => onTarget?.(c.key)}
                    className={cx('w-full rounded-lg px-2 py-1.5 text-start text-xs font-semibold', target === c.key ? 'bg-warn/20 text-warn' : target ? 'bg-accent/10 text-accent-ink' : 'text-muted', onTarget && 'hover:ring-1 hover:ring-accent/50')}
                  >
                    {t(c.label)}
                    <span className="ms-1 font-normal opacity-70">({c.type === 'num' ? t(['numeric', 'عددي']) : t(['category', 'فئوي'])})</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOUSES.map((h, i) => (
              <tr key={i} className="border-t border-line/60">
                <td className="p-2 font-mono text-xs text-subtle">{i + 1}</td>
                {COLS.map((c) => (
                  <td key={c.key} className={cx('ltr p-2 font-mono', target === c.key ? 'text-warn' : 'text-ink')}>
                    {String(h[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!onTarget && <p className="mt-2 text-xs text-muted">{t(['5 rows (examples) × 5 columns (properties).', '5 صفوف (أمثلة) × 5 أعمدة (خصائص).'])}</p>}
    </Frame>
  );
}

function FeaturesLabelsDemo() {
  const { t } = useI18n();
  const [target, setTarget] = useState<Col>('price');
  const col = COLS.find((c) => c.key === target)!;
  const feats = COLS.filter((c) => c.key !== target).map((c) => t(c.label));
  return (
    <div className="space-y-3">
      <DatasetTable target={target} onTarget={setTarget} />
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-4 text-sm">
        <span className="rounded-lg bg-accent/10 px-2 py-1 text-accent-ink">x = [{feats.join(', ')}]</span>
        <ArrowRight size={16} className="text-subtle rtl:-scale-x-100" />
        <span className="rounded-lg border border-line px-2 py-1 text-ink">{t(['model', 'النموذج'])}</span>
        <ArrowRight size={16} className="text-subtle rtl:-scale-x-100" />
        <span className="rounded-lg bg-warn/15 px-2 py-1 text-warn">ŷ = {t(col.label)}</span>
        <span className="ms-auto font-semibold text-ink">
          → {col.type === 'num' ? t(['Regression task', 'مهمة انحدار']) : t(['Classification task', 'مهمة تصنيف'])}
        </span>
      </div>
    </div>
  );
}

function TrainInferDemo() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'train' | 'infer'>('train');
  return (
    <Frame title={t(['Two phases of every ML system', 'المرحلتان في كل نظام تعلّم آلة'])}>
      <div className="mb-4 flex gap-2">
        <Button variant={phase === 'train' ? 'primary' : 'secondary'} onClick={() => setPhase('train')}>
          1 · {t(['Training', 'التدريب'])}
        </Button>
        <Button variant={phase === 'infer' ? 'primary' : 'secondary'} onClick={() => setPhase('infer')}>
          2 · {t(['Inference', 'الاستدلال'])}
        </Button>
      </div>
      {phase === 'train' ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Box tone="accent">{t(['Labelled data (x, y)', 'بيانات مصنّفة (x, y)'])}</Box>
          <ArrowRight size={16} className="rtl:-scale-x-100" />
          <Box>{t(['Algorithm adjusts parameters θ to reduce loss', 'الخوارزمية تضبط المعاملات θ لخفض الخسارة'])}</Box>
          <ArrowRight size={16} className="rtl:-scale-x-100" />
          <Box tone="purple">{t(['Trained model f_θ (saved)', 'نموذج مدرَّب f_θ (محفوظ)'])}</Box>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Box tone="accent">{t(['New input x (no label)', 'مُدخل جديد x (بلا تصنيف)'])}</Box>
          <ArrowRight size={16} className="rtl:-scale-x-100" />
          <Box tone="purple">{t(['Frozen model f_θ', 'نموذج مثبّت f_θ'])}</Box>
          <ArrowRight size={16} className="rtl:-scale-x-100" />
          <Box tone="warn">{t(['Prediction ŷ', 'التنبؤ ŷ'])}</Box>
        </div>
      )}
      <p className="mt-4 text-sm text-muted">{phase === 'train' ? t(['Slow, computationally heavy, done once or periodically.', 'بطيء ومكلف حسابيًا، ويُجرى مرة واحدة أو دوريًا.']) : t(['Fast, repeated for every request; parameters do not change.', 'سريع ويتكرر مع كل طلب؛ ولا تتغير المعاملات.'])}</p>
    </Frame>
  );
}
function Box({ children, tone }: { children: React.ReactNode; tone?: 'accent' | 'purple' | 'warn' }) {
  const tones = { accent: 'border-accent/40 bg-accent/10', purple: 'border-purple/40 bg-purple/10', warn: 'border-warn/40 bg-warn/10' };
  return <span className={cx('rounded-xl border px-3 py-2 text-ink', tone ? tones[tone] : 'border-line')}>{children}</span>;
}

function LifecycleDemo() {
  const { t } = useI18n();
  const stages: [Text, Text][] = [
    [['Define the problem', 'تحديد المشكلة'], ['Agree on the goal, constraints and a measurable success metric.', 'الاتفاق على الهدف والقيود ومقياس نجاح قابل للقياس.']],
    [['Collect data', 'جمع البيانات'], ['Gather representative data with consent; document its source.', 'جمع بيانات ممثِّلة بموافقة أصحابها، وتوثيق مصدرها.']],
    [['Prepare data', 'تجهيز البيانات'], ['Clean, handle missing values, encode, scale, split.', 'التنظيف، ومعالجة القيم المفقودة، والترميز، والتحجيم، والتقسيم.']],
    [['Train', 'التدريب'], ['Start with a simple baseline, then try stronger models.', 'البدء بنموذج مرجعي بسيط ثم تجربة نماذج أقوى.']],
    [['Evaluate', 'التقييم'], ['Validate, tune hyperparameters, test once, check fairness.', 'التحقق، وضبط المعاملات الفائقة، والاختبار مرة واحدة، وفحص العدالة.']],
    [['Deploy', 'النشر'], ['Serve predictions in a real product or workflow.', 'تقديم التنبؤات في منتج أو سير عمل حقيقي.']],
    [['Monitor', 'المراقبة'], ['Track performance and drift; collect new data; retrain.', 'متابعة الأداء والانجراف، وجمع بيانات جديدة، وإعادة التدريب.']],
  ];
  const [sel, setSel] = useState(0);
  const R = 105;
  return (
    <Frame title={t(['The ML lifecycle (click a stage)', 'دورة حياة تعلّم الآلة (انقر على مرحلة)'])}>
      <div className="grid items-center gap-4 md:grid-cols-2">
        <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-[320px]" style={{ direction: 'ltr' }}>
          <circle cx={150} cy={150} r={R} fill="none" stroke="var(--c-border)" strokeWidth={2} strokeDasharray="4 4" />
          {stages.map((s, i) => {
            const a = (i / stages.length) * 2 * Math.PI - Math.PI / 2;
            const x = 150 + R * Math.cos(a);
            const y = 150 + R * Math.sin(a);
            return (
              <g key={i} onClick={() => setSel(i)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={t(s[0])} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(i)}>
                <circle cx={x} cy={y} r={20} fill={sel === i ? 'var(--c-accent)' : 'var(--c-surface-2)'} stroke="var(--c-accent)" strokeWidth={2} />
                <text x={x} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={sel === i ? '#04201d' : 'var(--c-text)'}>
                  {i + 1}
                </text>
              </g>
            );
          })}
          <text x={150} y={146} textAnchor="middle" fontSize={13} fill="var(--c-muted)">
            ML
          </text>
          <text x={150} y={164} textAnchor="middle" fontSize={13} fill="var(--c-muted)">
            ↻
          </text>
        </svg>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-accent">
            {t(['Stage', 'المرحلة'])} {sel + 1}/7
          </div>
          <h4 className="mt-1 text-lg font-semibold text-ink">{t(stages[sel][0])}</h4>
          <p className="mt-1 text-muted">{t(stages[sel][1])}</p>
        </div>
      </div>
    </Frame>
  );
}

type P = 'supervised' | 'unsupervised' | 'reinforcement' | 'semi' | 'self';
const SCENARIOS: { s: Text; a: P }[] = [
  { s: ['Predict house prices from past sales with known prices.', 'التنبؤ بأسعار المنازل من مبيعات سابقة بأسعار معروفة.'], a: 'supervised' },
  { s: ['Group customers by purchasing behaviour, no categories given.', 'تجميع العملاء حسب سلوك الشراء دون فئات معطاة.'], a: 'unsupervised' },
  { s: ['Teach a robot to walk by rewarding forward progress.', 'تعليم روبوت المشي بمكافأته على التقدّم للأمام.'], a: 'reinforcement' },
  { s: ['Classify photos when only 1% of them are labelled.', 'تصنيف الصور عندما يكون 1% منها فقط مصنّفًا.'], a: 'semi' },
  { s: ['Pre-train a language model by predicting masked words.', 'التدريب المسبق لنموذج لغوي بالتنبؤ بالكلمات المحجوبة.'], a: 'self' },
  { s: ['Detect spam using emails already marked spam / not spam.', 'كشف الرسائل المزعجة باستخدام رسائل مصنّفة مسبقًا.'], a: 'supervised' },
  { s: ['Reduce 100 sensor readings to 2 dimensions to visualise them.', 'تقليل 100 قراءة مستشعر إلى بُعدين لتصورها.'], a: 'unsupervised' },
  { s: ['Learn to play a game from the final score only.', 'تعلّم لعب لعبة من النتيجة النهائية فقط.'], a: 'reinforcement' },
];
function ParadigmSorter() {
  const { t } = useI18n();
  const names: Record<P, Text> = {
    supervised: ['Supervised', 'موجَّه'],
    unsupervised: ['Unsupervised', 'غير موجَّه'],
    reinforcement: ['Reinforcement', 'معزّز'],
    semi: ['Semi-supervised', 'شبه موجَّه'],
    self: ['Self-supervised', 'ذاتي الإشراف'],
  };
  const [ans, setAns] = useState<(P | '')[]>(SCENARIOS.map(() => ''));
  const [checked, setChecked] = useState(false);
  const score = ans.filter((a, i) => a === SCENARIOS[i].a).length;
  return (
    <Frame title={t(['Sort each scenario into a learning paradigm', 'صنّف كل سيناريو ضمن نمط تعلّم'])}>
      <div className="space-y-2">
        {SCENARIOS.map((sc, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-line px-3 py-2 sm:flex-row sm:items-center">
            <span className="flex-1 text-sm text-ink">{t(sc.s)}</span>
            <select
              aria-label={t(sc.s)}
              value={ans[i]}
              onChange={(e) => {
                setChecked(false);
                setAns((a) => a.map((v, j) => (j === i ? (e.target.value as P) : v)));
              }}
              className="h-9 rounded-lg border border-line bg-surface-2 px-2 text-sm"
            >
              <option value="">—</option>
              {(Object.keys(names) as P[]).map((p) => (
                <option key={p} value={p}>
                  {t(names[p])}
                </option>
              ))}
            </select>
            {checked && (ans[i] === sc.a ? <Check size={18} className="text-success" aria-label="correct" /> : <span className="inline-flex items-center gap-1 text-xs text-danger"><X size={16} /> {t(names[sc.a])}</span>)}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="primary" onClick={() => setChecked(true)} disabled={ans.some((a) => !a)}>
          {t(['Check', 'تحقق'])}
        </Button>
        {checked && <span className="ltr font-mono text-sm text-ink">{score} / {SCENARIOS.length}</span>}
      </div>
    </Frame>
  );
}
