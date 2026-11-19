import { useMemo, useState } from 'react';
import { CurvePath, DataLine, Plot2D, usePlot, Marker } from '@/components/charts/Plot2D';
import { LineChart } from '@/components/charts/LineChart';
import { ConfusionMatrix } from '@/components/charts/ConfusionMatrix';
import { Button, Callout, Segmented, Slider, Stat, Toggle, cx } from '@/components/ui/primitives';
import { TeX } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import { gaussian, mulberry32 } from '@/lib/ml/random';
import { fitPolynomial } from '@/lib/ml/linearRegression';
import { binaryConfusion, binaryScores, regressionScores, rocCurve, accuracy } from '@/lib/ml/metrics';
import { buildTree, predictTree } from '@/lib/ml/decisionTree';
import { knnClassify } from '@/lib/ml/knn';
import { makeClassification, trainTestSplit } from '@/lib/ml/datasets';
import { classVar } from '@/components/charts/colors';

function WidgetFrame({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-ink">Live</span>
        {title}
      </div>
      {children}
      {note && <p className="mt-3 text-xs text-subtle">{note}</p>}
    </div>
  );
}

/* ---------------------------- Bias–variance ---------------------------- */

function noisyCurveData(n: number, seed: number) {
  const rng = mulberry32(seed);
  const f = (x: number) => 5 + 2.6 * Math.sin(x * 0.7) + 0.08 * (x - 5) ** 2;
  const xs = Array.from({ length: n }, () => 0.3 + rng() * 9.4);
  return { xs, ys: xs.map((x) => f(x) + gaussian(rng) * 0.8), f };
}

export function BiasVarianceWidget({ showRidge = false }: { showRidge?: boolean }) {
  const { t, num } = useI18n();
  const [degree, setDegree] = useState(3);
  const [logLambda, setLogLambda] = useState(-6);
  const [n, setN] = useState(16);
  const [seed, setSeed] = useState(4);
  const train = useMemo(() => noisyCurveData(n, seed), [n, seed]);
  const test = useMemo(() => noisyCurveData(200, seed + 100), [seed]);
  const lambda = showRidge ? 10 ** logLambda : 1e-8;
  const model = useMemo(() => fitPolynomial(train.xs, train.ys, degree, lambda), [train, degree, lambda]);
  const errs = useMemo(() => {
    const tr: number[] = [];
    const te: number[] = [];
    for (let d = 1; d <= 12; d++) {
      const m = fitPolynomial(train.xs, train.ys, d, lambda);
      if (!m) {
        tr.push(NaN);
        te.push(NaN);
        continue;
      }
      tr.push(regressionScores(train.ys, train.xs.map(m)).mse);
      te.push(regressionScores(test.ys, test.xs.map(m)).mse);
    }
    return { tr, te };
  }, [train, test, lambda]);
  const curve = model ? Array.from({ length: 200 }, (_, i) => [i / 19.9, Math.max(-5, Math.min(15, model(i / 19.9)))] as const) : [];
  const trMSE = errs.tr[degree - 1];
  const teMSE = errs.te[degree - 1];
  const verdict = degree <= 1 ? t(['Underfitting: too simple', 'نقص ملاءمة: بسيط جدًا']) : teMSE > 2 * trMSE && degree >= 7 ? t(['Overfitting: memorising noise', 'فرط ملاءمة: يحفظ الضوضاء']) : t(['Reasonable fit', 'ملاءمة معقولة']);
  return (
    <WidgetFrame title={showRidge ? t(['Regularization (ridge) on a polynomial model', 'التنظيم (Ridge) على نموذج كثير حدود']) : t(['Under- and overfitting with polynomial regression', 'نقص وفرط الملاءمة مع الانحدار كثير الحدود'])} note={t(['Polynomials are fitted by least squares on the training points (dots). Test error is measured on 200 fresh points from the same noisy curve.', 'تُلاءَم كثيرات الحدود بالمربعات الصغرى على نقاط التدريب (النقاط الظاهرة)، ويُقاس خطأ الاختبار على 200 نقطة جديدة من المنحنى المشوّش نفسه.'])}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <Plot2D domain={{ xMin: 0, xMax: 10, yMin: 0, yMax: 12 }} width={460} height={320} xLabel="x" yLabel="y" ariaLabel={t(['Polynomial fit to noisy data', 'ملاءمة كثير الحدود لبيانات مشوّشة'])}>
            <CurvePath pts={Array.from({ length: 100 }, (_, i) => [i / 9.9, train.f(i / 9.9)] as const)} stroke="var(--c-subtle)" dash="5 4" width={1.5} />
            <CurvePath pts={curve} stroke="var(--c-accent)" width={3} />
            <Dots xs={train.xs} ys={train.ys} />
          </Plot2D>
          <p className="text-xs text-muted">┅ {t(['true underlying curve', 'المنحنى الحقيقي الكامن'])} · ━ {t(['fitted model', 'النموذج الملاءَم'])}</p>
        </div>
        <div className="space-y-3">
          <Slider label={t(['Polynomial degree (model complexity)', 'درجة كثير الحدود (تعقيد النموذج)'])} value={degree} min={1} max={12} onChange={setDegree} />
          {showRidge && <Slider label={t(['Regularization strength λ', 'قوة التنظيم λ'])} value={logLambda} min={-6} max={2} step={0.25} onChange={setLogLambda} format={(v) => `10^${v}`} />}
          <Slider label={t(['Training points', 'نقاط التدريب'])} value={n} min={8} max={60} onChange={setN} />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Slider label={t(['Random seed', 'البذرة العشوائية'])} value={seed} min={1} max={50} onChange={setSeed} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label={t(['Train MSE', 'MSE التدريب'])} value={num(trMSE, 3)} />
            <Stat label={t(['Test MSE', 'MSE الاختبار'])} value={num(teMSE, 3)} tone="accent" />
            <Stat label={t(['Verdict', 'الحكم'])} value={<span className="text-sm">{verdict}</span>} />
          </div>
          <LineChart
            height={190}
            ariaLabel={t(['Error vs degree', 'الخطأ مقابل الدرجة'])}
            series={[
              { id: 'tr', label: t(['train', 'التدريب']), values: errs.tr.map((v) => Math.min(v, 20)), color: 'var(--c-accent)' },
              { id: 'te', label: t(['test', 'الاختبار']), values: errs.te.map((v) => Math.min(v, 20)), color: 'var(--c-class-1)', dashed: true },
            ]}
            xStart={1}
            xLabel={t(['degree', 'الدرجة'])}
            yMin={0}
          />
        </div>
      </div>
    </WidgetFrame>
  );
}

function Dots({ xs, ys, color = 'var(--c-cyan)' }: { xs: number[]; ys: number[]; color?: string }) {
  const { sx, sy } = usePlot();
  return (
    <g>
      {xs.map((x, i) => (
        <circle key={i} cx={sx(x)} cy={sy(ys[i])} r={5} fill={color} stroke="var(--c-plot)" strokeWidth={1.5} />
      ))}
    </g>
  );
}

/* -------------------------- Gradient descent 1-D -------------------------- */

export function GradientDescentWidget() {
  const { t, num } = useI18n();
  const [lr, setLr] = useState(0.2);
  const [start, setStart] = useState(-3);
  const [path, setPath] = useState<number[]>([-3]);
  const J = (w: number) => (w - 2) ** 2 + 1;
  const dJ = (w: number) => 2 * (w - 2);
  const w = path[path.length - 1];
  const step = (k = 1) => {
    const p = [...path];
    for (let i = 0; i < k; i++) {
      const cur = p[p.length - 1];
      const nxt = cur - lr * dJ(cur);
      if (!Number.isFinite(nxt) || Math.abs(nxt) > 1e6) break;
      p.push(nxt);
    }
    setPath(p);
  };
  const reset = (s = start) => setPath([s]);
  const curve = Array.from({ length: 121 }, (_, i) => [-4 + i * 0.1, J(-4 + i * 0.1)] as const);
  return (
    <WidgetFrame title={t(['Gradient descent on J(w) = (w − 2)² + 1', 'الانحدار التدرّجي على J(w) = (w − 2)² + 1'])}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Plot2D domain={{ xMin: -4, xMax: 8, yMin: 0, yMax: 40 }} width={460} height={300} xLabel="w" yLabel="J(w)" ariaLabel={t(['Loss curve with gradient steps', 'منحنى الخسارة مع خطوات التدرّج'])}>
          <CurvePath pts={curve} stroke="var(--c-accent)" width={3} />
          <StepPath path={path.filter((v) => v > -4 && v < 8)} J={J} />
        </Plot2D>
        <div className="space-y-3">
          <Slider label={t(['Learning rate α', 'معدل التعلّم α'])} value={lr} min={0.02} max={1.1} step={0.02} onChange={(v) => { setLr(v); reset(); }} format={(v) => v.toFixed(2)} />
          <Slider label={t(['Starting w', 'قيمة w الابتدائية'])} value={start} min={-4} max={7} step={0.5} onChange={(v) => { setStart(v); reset(v); }} />
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => step(1)}>{t(['Step', 'خطوة'])}</Button>
            <Button onClick={() => step(10)}>+10</Button>
            <Button variant="ghost" onClick={() => reset()}>{t(['Reset', 'إعادة ضبط'])}</Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label={t(['step', 'الخطوة'])} value={path.length - 1} />
            <Stat label="w" value={num(w, 4)} tone="accent" />
            <Stat label="J(w)" value={num(J(w), 4)} />
          </div>
          <p className="text-sm text-muted ltr">
            <TeX tex={`w \\leftarrow w - \\alpha \\cdot 2(w-2) = ${num(w, 3)} - ${lr.toFixed(2)}\\cdot ${num(dJ(w), 3)}`} />
          </p>
          {lr > 1 && <Callout tone="danger">{t(['α > 1 here: every step overshoots further than the last — the iterates diverge.', 'α > 1 هنا: كل خطوة تتجاوز الهدف أكثر من سابقتها — فتتباعد القيم.'])}</Callout>}
          {lr > 0.5 && lr <= 1 && <Callout tone="warn">{t(['Large α: the iterates jump back and forth across the minimum (oscillation) before settling.', 'α كبير: تقفز القيم ذهابًا وإيابًا حول النقطة الدنيا (تذبذب) قبل أن تستقر.'])}</Callout>}
          {lr < 0.1 && <Callout tone="info">{t(['Small α: safe but slow — many steps are needed.', 'α صغير: آمن لكنه بطيء — يحتاج خطوات كثيرة.'])}</Callout>}
        </div>
      </div>
    </WidgetFrame>
  );
}

function StepPath({ path, J }: { path: number[]; J: (w: number) => number }) {
  const { sx, sy } = usePlot();
  return (
    <g>
      {path.map((w, i) =>
        i > 0 ? <line key={`l${i}`} x1={sx(path[i - 1])} y1={sy(Math.min(40, J(path[i - 1])))} x2={sx(w)} y2={sy(Math.min(40, J(w)))} stroke="var(--c-warn)" strokeWidth={1.8} /> : null,
      )}
      {path.map((w, i) => (
        <circle key={i} cx={sx(w)} cy={sy(Math.min(40, J(w)))} r={i === path.length - 1 ? 7 : 4} fill="var(--c-warn)" stroke="var(--c-plot)" strokeWidth={1.5} />
      ))}
    </g>
  );
}

/* ---------------------------- Threshold & ROC ---------------------------- */

export function ThresholdRocWidget() {
  const { t, num } = useI18n();
  const [sep, setSep] = useState(1.6);
  const [prev, setPrev] = useState(0.5);
  const [thr, setThr] = useState(0);
  const data = useMemo(() => {
    const rng = mulberry32(7);
    const n = 300;
    const nPos = Math.round(n * prev);
    const scores: number[] = [];
    const labels: number[] = [];
    for (let i = 0; i < n; i++) {
      const pos = i < nPos;
      scores.push((pos ? sep / 2 : -sep / 2) + gaussian(rng));
      labels.push(pos ? 1 : 0);
    }
    return { scores, labels };
  }, [sep, prev]);
  const pred = data.scores.map((s) => (s >= thr ? 1 : 0));
  const cm = binaryConfusion(data.labels, pred);
  const sc = binaryScores(cm);
  const roc = useMemo(() => rocCurve(data.scores, data.labels), [data]);
  const fpr = cm.fp / Math.max(1, cm.fp + cm.tn);
  const tpr = cm.tp / Math.max(1, cm.tp + cm.fn);
  const bins = 30;
  const hist = (lab: number) => {
    const h = new Array(bins).fill(0);
    data.scores.forEach((s, i) => {
      if (data.labels[i] !== lab) return;
      const b = Math.floor(((s + 5) / 10) * bins);
      if (b >= 0 && b < bins) h[b]++;
    });
    return h;
  };
  const h0 = hist(0);
  const h1 = hist(1);
  const hMax = Math.max(1, ...h0, ...h1);
  return (
    <WidgetFrame title={t(['Decision threshold, confusion matrix and ROC', 'عتبة القرار ومصفوفة الالتباس ومنحنى ROC'])} note={t(['Scores for 300 synthetic cases are drawn from two overlapping Gaussian distributions. Everything below is recomputed from those scores.', 'تُسحب درجات 300 حالة اصطناعية من توزيعين غاوسيين متداخلين، ويُعاد حساب كل ما يلي من هذه الدرجات.'])}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3">
          <Slider label={t(['Threshold', 'العتبة'])} value={thr} min={-3} max={3} step={0.05} onChange={setThr} format={(v) => v.toFixed(2)} />
          <Slider label={t(['Class separation', 'الفصل بين الفئتين'])} value={sep} min={0} max={4} step={0.1} onChange={setSep} format={(v) => v.toFixed(1)} />
          <Slider label={t(['Share of positives (prevalence)', 'نسبة الحالات الموجبة'])} value={prev} min={0.05} max={0.5} step={0.05} onChange={setPrev} format={(v) => `${Math.round(v * 100)}%`} />
          <ConfusionMatrix matrix={[[cm.tn, cm.fp], [cm.fn, cm.tp]]} classNames={[t(['neg', 'سالب']), t(['pos', 'موجب'])]} />
        </div>
        <div>
          <svg viewBox="0 0 420 240" className="block w-full" role="img" aria-label={t(['Score distributions per class', 'توزيعات الدرجات لكل فئة'])} style={{ direction: 'ltr' }}>
            <rect x={10} y={10} width={400} height={200} rx={6} fill="var(--c-plot)" />
            {h0.map((v, i) => (
              <rect key={`a${i}`} x={10 + (i * 400) / bins + 1} y={210 - (v / hMax) * 190} width={400 / bins - 2} height={(v / hMax) * 190} fill={classVar(0)} opacity={0.6} />
            ))}
            {h1.map((v, i) => (
              <rect key={`b${i}`} x={10 + (i * 400) / bins + 1} y={210 - (v / hMax) * 190} width={400 / bins - 2} height={(v / hMax) * 190} fill={classVar(1)} opacity={0.6} />
            ))}
            <line x1={10 + ((thr + 5) / 10) * 400} x2={10 + ((thr + 5) / 10) * 400} y1={10} y2={210} stroke="var(--c-text)" strokeWidth={2.5} />
            <text x={14} y={230} fontSize={11} fill="var(--c-muted)">← {t(['predicted negative', 'متنبأ سالب'])}</text>
            <text x={406} y={230} fontSize={11} fill="var(--c-muted)" textAnchor="end">{t(['predicted positive', 'متنبأ موجب'])} →</text>
          </svg>
          <p className="text-xs text-muted">
            <span style={{ color: classVar(0) }}>■</span> {t(['negatives', 'السالبة'])} · <span style={{ color: classVar(1) }}>■</span> {t(['positives', 'الموجبة'])}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Stat label={t(['Accuracy', 'الدقة'])} value={num(sc.accuracy, 3)} />
            <Stat label={t(['Precision', 'الضبط'])} value={num(sc.precision, 3)} />
            <Stat label={t(['Recall (TPR)', 'الاستدعاء (TPR)'])} value={num(sc.recall, 3)} tone="accent" />
            <Stat label="F1" value={num(sc.f1, 3)} />
          </div>
        </div>
        <div>
          <Plot2D domain={{ xMin: 0, xMax: 1, yMin: 0, yMax: 1 }} width={380} height={340} xLabel={t(['False positive rate', 'معدل الإيجابيات الكاذبة'])} yLabel={t(['True positive rate', 'معدل الإيجابيات الصحيحة'])} ariaLabel="ROC">
            <CurvePath pts={[[0, 0], [1, 1]]} stroke="var(--c-subtle)" dash="4 4" width={1.2} />
            <CurvePath pts={roc.points.map((p) => [p.fpr, p.tpr] as const)} />
            <RocMarker x={fpr} y={tpr} />
          </Plot2D>
          <p className="text-sm text-ink">
            AUC = <span className="ltr font-mono font-semibold">{num(roc.auc, 3)}</span>
          </p>
          <p className="text-xs text-muted">{t(['AUC is the probability that a random positive gets a higher score than a random negative. 0.5 = guessing, 1 = perfect ranking.', 'AUC هي احتمال أن تحصل حالة موجبة عشوائية على درجة أعلى من حالة سالبة عشوائية. 0.5 = تخمين، و1 = ترتيب مثالي.'])}</p>
        </div>
      </div>
    </WidgetFrame>
  );
}

function RocMarker({ x, y }: { x: number; y: number }) {
  const { sx, sy } = usePlot();
  return <circle cx={sx(x)} cy={sy(y)} r={7} fill="var(--c-warn)" stroke="var(--c-plot)" strokeWidth={2} />;
}

/* --------------------------- Class imbalance --------------------------- */

export function ImbalanceWidget() {
  const { t, num } = useI18n();
  const [rate, setRate] = useState(0.05);
  const n = 1000;
  const pos = Math.round(n * rate);
  const labels = Array.from({ length: n }, (_, i) => (i < pos ? 1 : 0));
  const lazy = labels.map(() => 0);
  const cm = binaryConfusion(labels, lazy);
  const sc = binaryScores(cm);
  return (
    <WidgetFrame title={t(['The accuracy paradox', 'مفارقة الدقة'])}>
      <Slider label={t(['Share of positive cases (e.g. fraud)', 'نسبة الحالات الموجبة (مثل الاحتيال)'])} value={rate} min={0.01} max={0.5} step={0.01} onChange={setRate} format={(v) => `${Math.round(v * 100)}%`} />
      <p className="mt-3 text-sm text-muted">{t(['A “model” that always predicts negative, on 1,000 cases:', '«نموذج» يتنبأ دائمًا بالسالب، على 1,000 حالة:'])}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t(['Accuracy', 'الدقة'])} value={num(sc.accuracy, 3)} tone="accent" />
        <Stat label={t(['Recall', 'الاستدعاء'])} value={num(sc.recall, 3)} tone="danger" />
        <Stat label={t(['Precision', 'الضبط'])} value={num(sc.precision, 3)} />
        <Stat label={t(['Missed positives', 'الحالات الموجبة المفقودة'])} value={cm.fn} tone="danger" />
      </div>
      <p className="mt-3 text-sm text-muted">{t(['With rare positives, accuracy looks excellent while the model catches nothing. Use recall, precision, F1, PR/ROC curves, and consider class weights or resampling.', 'مع ندرة الحالات الموجبة تبدو الدقة ممتازة بينما لا يلتقط النموذج شيئًا. استخدم الاستدعاء والضبط وF1 ومنحنيات PR/ROC، وفكّر في أوزان الفئات أو إعادة المعاينة.'])}</p>
    </WidgetFrame>
  );
}

/* ------------------------------- Scaling ------------------------------- */

export function ScalingWidget() {
  const { t, num } = useI18n();
  const [outlier, setOutlier] = useState(false);
  const base = [52, 61, 58, 70, 66, 49, 75, 63];
  const xs = outlier ? [...base, 240] : base;
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  const mm = xs.map((x) => (x - min) / (max - min));
  const z = xs.map((x) => (x - mean) / sd);
  return (
    <WidgetFrame title={t(['Normalization vs standardization', 'التطبيع مقابل التوحيد القياسي'])}>
      <Toggle label={t(['Add an outlier (240)', 'أضف قيمة شاذة (240)'])} checked={outlier} onChange={setOutlier} />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 text-start">{t(['raw value x', 'القيمة الخام x'])}</th>
              <th>{t(['min–max', 'الحد الأدنى–الأعلى'])} <TeX tex="\frac{x-\min}{\max-\min}" /></th>
              <th>z-score <TeX tex="\frac{x-\mu}{\sigma}" /></th>
            </tr>
          </thead>
          <tbody className="font-mono text-center">
            {xs.map((x, i) => (
              <tr key={i} className={cx('border-t border-line/60', x === 240 && 'text-warn')}>
                <td className="py-1 text-start">{x}</td>
                <td>{num(mm[i], 3)}</td>
                <td>{num(z[i], 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted">
        {outlier
          ? t(['With the outlier, min–max squeezes all normal values into a tiny range near 0; z-scores are also affected but keep more spread. Robust scaling (median/IQR) resists outliers best.', 'مع القيمة الشاذة يضغط تطبيع الحد الأدنى–الأعلى كل القيم العادية في نطاق صغير قرب 0؛ وتتأثر درجات z أيضًا لكنها تحتفظ بانتشار أكبر. والتحجيم المتين (الوسيط/المدى الربيعي) هو الأكثر مقاومة للقيم الشاذة.'])
          : t(['Min–max maps values to [0, 1]; standardization centres them at 0 with standard deviation 1. Fit the scaler on training data only.', 'يحوّل تطبيع الحد الأدنى–الأعلى القيم إلى [0, 1]، ويمركزها التوحيد القياسي حول 0 بانحراف معياري 1. لاءم أداة التحجيم على بيانات التدريب فقط.'])}
      </p>
    </WidgetFrame>
  );
}

/* --------------------------- Missing values --------------------------- */

export function MissingValuesWidget() {
  const { t, num } = useI18n();
  const [strategy, setStrategy] = useState<'drop' | 'mean' | 'median'>('median');
  const raw: (number | null)[] = [3.1, null, 2.8, 3.4, 9.9, null, 3.0, 2.9, null, 3.3];
  const present = raw.filter((v): v is number => v !== null);
  const mean = present.reduce((a, b) => a + b, 0) / present.length;
  const sorted = [...present].sort((a, b) => a - b);
  const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const filled = strategy === 'drop' ? present : raw.map((v) => v ?? (strategy === 'mean' ? mean : median));
  return (
    <WidgetFrame title={t(['Handling missing values', 'التعامل مع القيم المفقودة'])}>
      <Segmented
        label={t(['Strategy', 'الاستراتيجية'])}
        value={strategy}
        onChange={setStrategy}
        size="sm"
        options={[
          { value: 'drop', label: t(['Drop rows', 'حذف الصفوف']) },
          { value: 'mean', label: t(['Fill with mean', 'التعبئة بالمتوسط']) },
          { value: 'median', label: t(['Fill with median', 'التعبئة بالوسيط']) },
        ]}
      />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {raw.map((v, i) => (
          <span key={i} className={cx('ltr rounded-lg border px-2 py-1 font-mono text-sm', v === null ? (strategy === 'drop' ? 'border-danger/40 text-danger line-through' : 'border-accent/50 bg-accent/10 text-accent-ink') : v > 9 ? 'border-warn/50 text-warn' : 'border-line text-ink')}>
            {v === null ? (strategy === 'drop' ? 'NaN' : num(strategy === 'mean' ? mean : median, 2)) : v}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">
        {t(['Rows kept:', 'الصفوف المحتفظ بها:'])} <span className="ltr font-mono">{filled.length}/10</span>. {t(['Mean of observed values', 'متوسط القيم الملاحظة'])} <span className="ltr font-mono">{num(mean, 2)}</span> {t(['is pulled up by the outlier 9.9; the median', 'يرتفع بسبب القيمة الشاذة 9.9؛ أما الوسيط'])} <span className="ltr font-mono">{num(median, 2)}</span> {t(['is robust.', 'فمتين.'])}
      </p>
    </WidgetFrame>
  );
}

/* --------------------------- Categorical encoding --------------------------- */

export function EncodingWidget() {
  const { t } = useI18n();
  const [mode, setMode] = useState<'label' | 'onehot'>('onehot');
  const colors = ['red', 'green', 'blue', 'green', 'red'];
  const cats = ['blue', 'green', 'red'];
  return (
    <WidgetFrame title={t(['Encoding categorical variables', 'ترميز المتغيرات الفئوية'])}>
      <Segmented label={t(['Encoding', 'الترميز'])} value={mode} onChange={setMode} size="sm" options={[{ value: 'onehot', label: 'One-hot' }, { value: 'label', label: t(['Integer (label)', 'عددي (تصنيفي)']) }]} />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm ltr font-mono">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 text-start">colour</th>
              {mode === 'onehot' ? cats.map((c) => <th key={c}>is_{c}</th>) : <th>colour_id</th>}
            </tr>
          </thead>
          <tbody>
            {colors.map((c, i) => (
              <tr key={i} className="border-t border-line/60 text-center">
                <td className="py-1 text-start">{c}</td>
                {mode === 'onehot' ? cats.map((k) => <td key={k} className={k === c ? 'text-accent font-bold' : 'text-subtle'}>{k === c ? 1 : 0}</td>) : <td>{cats.indexOf(c)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted">
        {mode === 'label'
          ? t(['Integer codes invent an order (blue < green < red) and distances that do not exist. Fine for tree models or truly ordinal data, risky for linear models and KNN.', 'الترميز العددي يخترع ترتيبًا (أزرق < أخضر < أحمر) ومسافات غير موجودة. مقبول لنماذج الأشجار أو البيانات الترتيبية فعلًا، ومحفوف بالمخاطر للنماذج الخطية وKNN.'])
          : t(['One-hot encoding creates one binary column per category, so no false order is implied.', 'الترميز الأحادي ينشئ عمودًا ثنائيًا لكل فئة، فلا يُفترض ترتيب زائف.'])}
      </p>
    </WidgetFrame>
  );
}

/* ------------------------------ Train/test split ------------------------------ */

export function SplitWidget({ withValidation = true }: { withValidation?: boolean }) {
  const { t } = useI18n();
  const [trainPct, setTrainPct] = useState(70);
  const [valPct, setValPct] = useState(withValidation ? 15 : 0);
  const [seed, setSeed] = useState(3);
  const n = 60;
  const order = useMemo(() => {
    const rng = mulberry32(seed);
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, [seed]);
  const nTrain = Math.round((n * trainPct) / 100);
  const nVal = Math.min(n - nTrain, Math.round((n * valPct) / 100));
  const setOf = new Array(n).fill('test');
  order.forEach((p, rank) => (setOf[p] = rank < nTrain ? 'train' : rank < nTrain + nVal ? 'val' : 'test'));
  const color = { train: 'var(--c-accent)', val: 'var(--c-purple)', test: 'var(--c-class-1)' } as Record<string, string>;
  const shape = { train: 0, val: 1, test: 2 } as Record<string, number>;
  return (
    <WidgetFrame title={withValidation ? t(['Train / validation / test split', 'التقسيم إلى تدريب / تحقق / اختبار']) : t(['Train / test split', 'التقسيم إلى تدريب / اختبار'])}>
      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        <div>
          <svg viewBox="0 0 600 120" className="block w-full" role="img" aria-label={t(['60 examples assigned to sets', '60 مثالًا موزعة على المجموعات'])} style={{ direction: 'ltr' }}>
            {Array.from({ length: n }, (_, i) => (
              <Marker key={i} shape={shape[setOf[i]]} x={20 + (i % 20) * 28.5} y={22 + Math.floor(i / 20) * 36} r={8} fill={color[setOf[i]]} />
            ))}
          </svg>
          <div className="mt-2 flex h-4 overflow-hidden rounded-full">
            <div style={{ width: `${(nTrain / n) * 100}%`, background: color.train }} />
            <div style={{ width: `${(nVal / n) * 100}%`, background: color.val }} />
            <div style={{ width: `${((n - nTrain - nVal) / n) * 100}%`, background: color.test }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
            <span>● {t(['train', 'تدريب'])} {nTrain}</span>
            {withValidation && <span>■ {t(['validation', 'تحقق'])} {nVal}</span>}
            <span>▲ {t(['test', 'اختبار'])} {n - nTrain - nVal}</span>
          </div>
        </div>
        <div className="space-y-3">
          <Slider label={t(['Training %', 'نسبة التدريب %'])} value={trainPct} min={40} max={90} step={5} onChange={(v) => { setTrainPct(v); if (v + valPct > 95) setValPct(Math.max(0, 95 - v)); }} format={(v) => `${v}%`} />
          {withValidation && <Slider label={t(['Validation %', 'نسبة التحقق %'])} value={valPct} min={0} max={Math.max(0, 95 - trainPct)} step={5} onChange={setValPct} format={(v) => `${v}%`} />}
          <Slider label={t(['Shuffle seed', 'بذرة الخلط'])} value={seed} min={1} max={50} onChange={setSeed} />
        </div>
      </div>
    </WidgetFrame>
  );
}

/* ---------------------------- Regression metrics ---------------------------- */

export function RegressionMetricsWidget() {
  const { t, num } = useI18n();
  const [bias, setBias] = useState(0);
  const [outlier, setOutlier] = useState(false);
  const y = [3, 5, 4, 7, 6, 8, 7, 9];
  const yTrue = outlier ? [...y.slice(0, 7), 16] : y;
  const yPred = y.map((v, i) => v + 0.6 * Math.sin(i * 1.7) + bias);
  const s = regressionScores(yTrue, yPred);
  return (
    <WidgetFrame title={t(['MAE, MSE, RMSE and R² on the same predictions', 'MAE وMSE وRMSE وR² على التنبؤات نفسها'])}>
      <div className="grid gap-4 md:grid-cols-2">
        <Plot2D domain={{ xMin: 0, xMax: 9, yMin: 0, yMax: 18 }} width={420} height={260} xLabel={t(['example', 'المثال'])} yLabel="y" ariaLabel={t(['True values and predictions', 'القيم الحقيقية والتنبؤات'])}>
          {yTrue.map((v, i) => (
            <DataLine key={`e${i}`} x1={i + 1} y1={v} x2={i + 1} y2={yPred[i]} stroke="var(--c-danger)" strokeWidth={1.5} strokeDasharray="3 2" />
          ))}
          <Dots xs={yTrue.map((_, i) => i + 1)} ys={yTrue} />
          <Dots xs={yPred.map((_, i) => i + 1)} ys={yPred} color="var(--c-warn)" />
        </Plot2D>
        <div className="space-y-3">
          <Slider label={t(['Shift all predictions (bias)', 'إزاحة كل التنبؤات (انحياز)'])} value={bias} min={-3} max={3} step={0.1} onChange={setBias} format={(v) => v.toFixed(1)} />
          <Toggle label={t(['Make the last true value an outlier', 'اجعل القيمة الحقيقية الأخيرة شاذة'])} checked={outlier} onChange={setOutlier} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="MAE" value={num(s.mae, 3)} />
            <Stat label="MSE" value={num(s.mse, 3)} />
            <Stat label="RMSE" value={num(s.rmse, 3)} />
            <Stat label="R²" value={num(s.r2, 3)} tone="accent" />
          </div>
          <p className="text-xs text-muted">{t(['Watch MSE react much more strongly than MAE to the outlier — squaring amplifies large errors.', 'لاحظ كيف يتفاعل MSE بقوة أكبر بكثير من MAE مع القيمة الشاذة — فالتربيع يضخّم الأخطاء الكبيرة.'])}</p>
        </div>
      </div>
    </WidgetFrame>
  );
}

/* ------------------------------ Cross-validation ------------------------------ */

export function CrossValidationWidget() {
  const { t, num } = useI18n();
  const [k, setK] = useState(5);
  const [neighbors, setNeighbors] = useState(5);
  const data = useMemo(() => makeClassification('moons', 100, 21), []);
  const folds = useMemo(() => {
    const { train } = trainTestSplit(data.length, 0, 3);
    const order = train;
    const res: number[] = [];
    for (let f = 0; f < k; f++) {
      const testIdx = order.filter((_, i) => i % k === f);
      const trainIdx = order.filter((_, i) => i % k !== f);
      const X = trainIdx.map((i) => [data[i].x, data[i].y]);
      const y = trainIdx.map((i) => data[i].label);
      const yPred = testIdx.map((i) => knnClassify(X, y, 2, [data[i].x, data[i].y], neighbors, 'euclidean').label);
      res.push(accuracy(testIdx.map((i) => data[i].label), yPred));
    }
    return res;
  }, [k, neighbors, data]);
  const mean = folds.reduce((a, b) => a + b, 0) / folds.length;
  const sd = Math.sqrt(folds.reduce((a, b) => a + (b - mean) ** 2, 0) / folds.length);
  return (
    <WidgetFrame title={t(['k-fold cross-validation (KNN on 100 points)', 'التحقق المتقاطع k-fold (KNN على 100 نقطة)'])}>
      <div className="grid gap-4 md:grid-cols-[1fr_240px]">
        <div className="space-y-1.5">
          {folds.map((acc, f) => (
            <div key={f} className="flex items-center gap-2">
              <span className="w-16 text-xs text-muted">{t(['Fold', 'الطية'])} {f + 1}</span>
              <div className="flex h-5 flex-1 overflow-hidden rounded">
                {Array.from({ length: k }, (_, j) => (
                  <div key={j} className="flex-1 border-e border-bg" style={{ background: j === f ? 'var(--c-class-1)' : 'var(--c-accent)', opacity: j === f ? 1 : 0.45 }} />
                ))}
              </div>
              <span className="ltr w-14 text-end font-mono text-xs text-ink">{num(acc, 3)}</span>
            </div>
          ))}
          <p className="pt-1 text-xs text-muted">
            <span style={{ color: 'var(--c-class-1)' }}>■</span> {t(['validation fold', 'طية التحقق'])} · <span style={{ color: 'var(--c-accent)' }}>■</span> {t(['training folds', 'طيات التدريب'])}
          </p>
        </div>
        <div className="space-y-3">
          <Slider label={t(['Number of folds k', 'عدد الطيات k'])} value={k} min={2} max={10} onChange={setK} />
          <Slider label={t(['KNN neighbours', 'عدد جيران KNN'])} value={neighbors} min={1} max={25} onChange={setNeighbors} />
          <Stat label={t(['CV accuracy (mean ± sd)', 'دقة التحقق المتقاطع (المتوسط ± الانحراف)'])} value={`${num(mean, 3)} ± ${num(sd, 3)}`} tone="accent" />
        </div>
      </div>
      <p className="mt-3 text-xs text-subtle">{t(['Each point is used for validation exactly once. The mean is a more stable estimate than a single split; the spread shows how much it varies.', 'تُستخدم كل نقطة للتحقق مرة واحدة بالضبط. المتوسط تقدير أكثر ثباتًا من تقسيم واحد، والانتشار يُظهر مدى تفاوته.'])}</p>
    </WidgetFrame>
  );
}

/* ------------------------------ Grid / random search ------------------------------ */

export function SearchWidget() {
  const { t, num } = useI18n();
  const depths = [1, 2, 3, 4, 5, 6, 8, 10];
  const splits = [2, 5, 10, 20, 40];
  const [mode, setMode] = useState<'grid' | 'random'>('grid');
  const [budget, setBudget] = useState(10);
  const [seed, setSeed] = useState(1);
  const data = useMemo(() => makeClassification('moons', 160, 33), []);
  const scores = useMemo(() => {
    const k = 4;
    const order = trainTestSplit(data.length, 0, 5).train;
    return depths.map((d) =>
      splits.map((ms) => {
        let tot = 0;
        for (let f = 0; f < k; f++) {
          const te = order.filter((_, i) => i % k === f);
          const tr = order.filter((_, i) => i % k !== f);
          const tree = buildTree(tr.map((i) => [data[i].x, data[i].y]), tr.map((i) => data[i].label), 2, { maxDepth: d, minSamplesSplit: ms, criterion: 'gini' });
          tot += accuracy(te.map((i) => data[i].label), te.map((i) => predictTree(tree.root, [data[i].x, data[i].y])));
        }
        return tot / k;
      }),
    );
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const sampled = useMemo(() => {
    const rng = mulberry32(seed);
    const all = depths.flatMap((_, i) => splits.map((__, j) => [i, j] as const));
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return new Set(all.slice(0, budget).map(([i, j]) => `${i},${j}`));
  }, [seed, budget]); // eslint-disable-line react-hooks/exhaustive-deps
  const evaluated = (i: number, j: number) => mode === 'grid' || sampled.has(`${i},${j}`);
  let best: [number, number] = [0, 0];
  depths.forEach((_, i) => splits.forEach((__, j) => evaluated(i, j) && (!evaluated(best[0], best[1]) || scores[i][j] > scores[best[0]][best[1]]) && (best = [i, j])));
  const lo = Math.min(...scores.flat());
  const hi = Math.max(...scores.flat());
  return (
    <WidgetFrame title={t(['Hyperparameter search for a decision tree (4-fold CV accuracy)', 'البحث عن المعاملات الفائقة لشجرة قرار (دقة تحقق متقاطع بـ4 طيات)'])}>
      <div className="grid gap-4 md:grid-cols-[1fr_240px]">
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="p-1 text-muted">depth ↓ / min_split →</th>
                {splits.map((s) => (
                  <th key={s} className="p-1 font-mono text-muted">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {depths.map((d, i) => (
                <tr key={d}>
                  <th className="p-1 font-mono text-muted">{d}</th>
                  {splits.map((s, j) => {
                    const ev = evaluated(i, j);
                    const a = (scores[i][j] - lo) / (hi - lo || 1);
                    const isBest = best[0] === i && best[1] === j;
                    return (
                      <td key={s} className={cx('ltr h-9 w-14 rounded text-center font-mono', isBest && 'ring-2 ring-warn')} style={{ background: ev ? `color-mix(in oklab, var(--c-accent) ${15 + a * 70}%, var(--c-surface))` : 'var(--c-surface-2)' }}>
                        {ev ? num(scores[i][j], 2) : '·'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3">
          <Segmented label={t(['Search strategy', 'استراتيجية البحث'])} value={mode} onChange={setMode} size="sm" options={[{ value: 'grid', label: t(['Grid', 'شبكي']) }, { value: 'random', label: t(['Random', 'عشوائي']) }]} />
          {mode === 'random' && (
            <>
              <Slider label={t(['Budget (configurations)', 'الميزانية (عدد الإعدادات)'])} value={budget} min={3} max={40} onChange={setBudget} />
              <Slider label={t(['Random seed', 'البذرة العشوائية'])} value={seed} min={1} max={50} onChange={setSeed} />
            </>
          )}
          <Stat label={t(['Best found', 'الأفضل الموجود'])} value={`depth=${depths[best[0]]}, split=${splits[best[1]]}`} sub={`CV acc = ${num(scores[best[0]][best[1]], 3)}`} tone="accent" />
          <p className="text-xs text-muted">{mode === 'grid' ? t(['Grid search tries all 40 combinations.', 'يجرّب البحث الشبكي كل التوليفات الأربعين.']) : t(['Random search tries only a sample — often finding a near-best configuration at a fraction of the cost.', 'يجرّب البحث العشوائي عينة فقط — وغالبًا يجد إعدادًا قريبًا من الأفضل بجزء من الكلفة.'])}</p>
        </div>
      </div>
    </WidgetFrame>
  );
}
