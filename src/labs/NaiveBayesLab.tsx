import { useEffect, useMemo, useState } from 'react';
import { CurvePath, EditablePoints, Heatmap, Plot2D, Probe, usePlot, type EditMode } from '@/components/charts/Plot2D';
import { blendClasses, classVar, usePalette } from '@/components/charts/colors';
import { BarChart } from '@/components/charts/BarChart';
import { Callout, Slider, Stat, Toggle, Select } from '@/components/ui/primitives';
import { TeX } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { explainNB, fitGaussianNB, gaussianPdf, type GaussianNBModel } from '@/lib/ml/naiveBayes';
import { gaussian, mulberry32 } from '@/lib/ml/random';
import { clamp, nextId, type ClassPoint, type Domain } from '@/lib/ml/types';
import type { Text } from '@/i18n/types';
import { ClassLegend, ClassPicker, Hint, LabShell, ModePicker, Panel, PointsTable, StatGrid, type LabProps } from './shared/LabUI';
import { labEvent, usePointSet } from './shared/hooks';

const DOMAIN: Domain = { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
const LIMIT = 150;
type NBData = 'fruit' | 'balanced' | 'imbalanced';

const CLASSES: Record<NBData, Text[]> = {
  fruit: [['Apple', 'تفاح'], ['Orange', 'برتقال'], ['Lemon', 'ليمون']],
  balanced: [['Class A', 'الفئة أ'], ['Class B', 'الفئة ب']],
  imbalanced: [['Common class', 'الفئة الشائعة'], ['Rare class', 'الفئة النادرة']],
};
const FEATURES: Record<NBData, [Text, Text]> = {
  fruit: [['sweetness (0–10)', 'الحلاوة (0–10)'], ['acidity (0–10)', 'الحموضة (0–10)']],
  balanced: [['feature x₁', 'الخاصية x₁'], ['feature x₂', 'الخاصية x₂']],
  imbalanced: [['feature x₁', 'الخاصية x₁'], ['feature x₂', 'الخاصية x₂']],
};

function makeNBData(id: NBData, seed: number): ClassPoint[] {
  const rng = mulberry32(seed);
  const spec: { c: number; mx: number; my: number; sx: number; sy: number; n: number }[] =
    id === 'fruit'
      ? [
          { c: 0, mx: 7, my: 3.2, sx: 0.9, sy: 0.8, n: 22 },
          { c: 1, mx: 6, my: 5.6, sx: 0.8, sy: 0.9, n: 22 },
          { c: 2, mx: 2.4, my: 8.2, sx: 0.8, sy: 0.7, n: 16 },
        ]
      : id === 'balanced'
        ? [
            { c: 0, mx: 3.8, my: 4, sx: 1.2, sy: 1.5, n: 30 },
            { c: 1, mx: 6.2, my: 6, sx: 1.3, sy: 1.2, n: 30 },
          ]
        : [
            { c: 0, mx: 4, my: 4.2, sx: 1.4, sy: 1.4, n: 51 },
            { c: 1, mx: 6.3, my: 6.2, sx: 1.2, sy: 1.2, n: 9 },
          ];
  const pts: ClassPoint[] = [];
  for (const s of spec)
    for (let i = 0; i < s.n; i++)
      pts.push({ id: nextId('nb'), x: clamp(s.mx + gaussian(rng) * s.sx, 0.1, 9.9), y: clamp(s.my + gaussian(rng) * s.sy, 0.1, 9.9), label: s.c });
  return pts;
}

export default function NaiveBayesLab({ presentation }: LabProps) {
  const { t, num } = useI18n();
  const { classRGB, plotRGB, regionAlpha } = usePalette();
  const [data, setData] = useState<NBData>('fruit');
  const [seed, setSeed] = useState(2);
  const ps = usePointSet<ClassPoint>(() => makeNBData('fruit', 2), LIMIT);
  const [mode, setMode] = useState<EditMode>('query');
  const [addClass, setAddClass] = useState(0);
  const [q, setQ] = useState<[number, number]>([5.2, 5]);
  const [uniformPrior, setUniformPrior] = useState(false);
  const [showEllipses, setShowEllipses] = useState(true);
  const points = ps.points;
  const nClasses = CLASSES[data].length;
  const cNames = CLASSES[data].map((c) => t(c));
  const fNames = FEATURES[data].map((f) => t(f));

  const model = useMemo<GaussianNBModel | null>(() => {
    const counts = new Array(nClasses).fill(0);
    points.forEach((p) => p.label < nClasses && counts[p.label]++);
    if (counts.some((c) => c < 2)) return null;
    const m = fitGaussianNB(points.filter((p) => p.label < nClasses).map((p) => [p.x, p.y]), points.filter((p) => p.label < nClasses).map((p) => p.label), nClasses);
    return uniformPrior ? { ...m, priors: m.priors.map(() => 1 / nClasses) } : m;
  }, [points, nClasses, uniformPrior]);
  const ex = model ? explainNB(model, q) : null;
  useEffect(() => {
    if (model) labEvent('naive-bayes', 'trained');
  }, [model]);
  const version = `${points.reduce((a, p) => a + p.x * 7 + p.y * 3 + p.label, 0)}|${points.length}|${uniformPrior}|${classRGB[0][0]}`;
  const reset = (d = data, s = seed) => ps.setPoints(makeNBData(d, s));
  const products = ex ? ex.classes.map((c) => c.prior * c.likelihoods[0] * c.likelihoods[1]) : [];
  const evidence = products.reduce((a, b) => a + b, 0);

  return (
    <LabShell
      presentation={presentation}
      viz={
        <>
          <Plot2D
            domain={DOMAIN}
            xLabel={fNames[0]}
            yLabel={fNames[1]}
            ariaLabel={t(['Gaussian Naive Bayes posterior map with class distributions', 'خريطة الاحتمال اللاحق لبايز الساذج الغاوسي مع توزيعات الفئات'])}
            onBackgroundPointer={mode === 'add' ? (x, y) => ps.add({ x, y, label: addClass }) : mode === 'query' ? (x, y) => { setQ([x, y]); labEvent('naive-bayes', 'queried'); } : undefined}
          >
            {model && <Heatmap version={version} res={80} fn={(x, y) => blendClasses(explainNB(model, [x, y]).classes.map((c) => c.posterior), classRGB, plotRGB, regionAlpha)} />}
            {model && showEllipses && <ClassEllipses model={model} />}
            <EditablePoints points={points} mode={mode} onMove={ps.move} onRemove={ps.remove} colorOf={(p) => classVar(p.label)} />
            {ex && <Probe x={q[0]} y={q[1]} color={classVar(ex.prediction)} label={cNames[ex.prediction]} />}
          </Plot2D>
          <ClassLegend names={cNames} extra={showEllipses && <span>◌ {t(['1σ and 2σ of each class Gaussian (axis-aligned = independence)', '1σ و2σ لتوزيع غاوس لكل فئة (موازية للمحاور = الاستقلال)'])}</span>} />
          <Hint>{t(['Query mode: click to place the sample to classify, or use the sliders. Data: synthetic, for illustration only.', 'وضع الاستعلام: انقر لوضع العينة المراد تصنيفها أو استخدم المنزلقات. البيانات اصطناعية للتوضيح فقط.'])}</Hint>
        </>
      }
      status={
        <>
          <StatGrid>
            <Stat label={t(C.prediction)} value={ex ? cNames[ex.prediction] : '—'} tone="accent" />
            {ex?.classes.slice(0, 3).map((c, i) => <Stat key={i} label={`P(${cNames[i]} | x)`} value={num(c.posterior, 4)} />)}
          </StatGrid>
          {!model && <Callout tone="warn">{t(['Each class needs at least 2 points to estimate a mean and variance.', 'تحتاج كل فئة إلى نقطتين على الأقل لتقدير المتوسط والتباين.'])}</Callout>}
        </>
      }
      below={
        model &&
        ex && (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title={t(['Bayes’ theorem, step by step', 'نظرية بايز خطوة بخطوة'])} className="md:col-span-2">
              <TeX display tex="P(c \mid x_1, x_2) = \frac{P(c)\; p(x_1 \mid c)\; p(x_2 \mid c)}{\sum_{k} P(k)\, p(x_1 \mid k)\, p(x_2 \mid k)}" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted">
                    <tr>
                      <th className="py-1 text-start">{t(C.class)}</th>
                      <th>{t(['prior', 'الاحتمال المسبق'])} P(c)</th>
                      <th className="ltr">p(x₁ | c)</th>
                      <th className="ltr">p(x₂ | c)</th>
                      <th>{t(['product', 'حاصل الضرب'])}</th>
                      <th>{t(['posterior', 'الاحتمال اللاحق'])}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-center">
                    {ex.classes.map((c, i) => (
                      <tr key={i} className={`border-t border-line ${i === ex.prediction ? 'bg-accent/5' : ''}`}>
                        <td className="py-1.5 text-start font-sans">
                          <span className="me-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ background: classVar(i) }} />
                          {cNames[i]}
                        </td>
                        <td>{num(c.prior, 3)}</td>
                        <td>{c.likelihoods[0].toExponential(2)}</td>
                        <td>{c.likelihoods[1].toExponential(2)}</td>
                        <td>{products[i].toExponential(2)}</td>
                        <td className="font-semibold text-ink">{num(c.posterior, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted">
                {t(['Evidence (denominator) =', 'الدليل (المقام) ='])} <span className="ltr font-mono">{evidence.toExponential(3)}</span>. {t(['Computed in log space for numerical stability; the table shows the equivalent plain values.', 'تُجرى الحسابات في الفضاء اللوغاريتمي للاستقرار العددي، ويعرض الجدول القيم المكافئة.'])}
              </p>
            </Panel>
            {[0, 1].map((j) => (
              <Panel key={j} title={`${t(['Likelihood of', 'الأرجحية لـ'])} ${fNames[j]}`}>
                <LikelihoodPlot model={model} feature={j} value={q[j]} label={fNames[j]} />
              </Panel>
            ))}
            <Panel title={t(['Learned parameters', 'المعاملات المتعلَّمة'])}>
              <table className="w-full text-xs font-mono">
                <thead className="text-muted font-sans">
                  <tr>
                    <th className="text-start py-1">{t(C.class)}</th>
                    <th>n</th>
                    <th>μ₁</th>
                    <th>σ₁</th>
                    <th>μ₂</th>
                    <th>σ₂</th>
                  </tr>
                </thead>
                <tbody>
                  {model.means.map((mu, c) => (
                    <tr key={c} className="border-t border-line/60 text-center">
                      <td className="py-1 text-start font-sans">{cNames[c]}</td>
                      <td>{model.classCounts[c]}</td>
                      <td>{num(mu[0], 2)}</td>
                      <td>{num(Math.sqrt(model.variances[c][0]), 2)}</td>
                      <td>{num(mu[1], 2)}</td>
                      <td>{num(Math.sqrt(model.variances[c][1]), 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
            <Panel title={t(['Posterior probabilities', 'الاحتمالات اللاحقة'])}>
              <BarChart ariaLabel={t(['Posterior per class', 'الاحتمال اللاحق لكل فئة'])} bars={ex.classes.map((c, i) => ({ label: cNames[i], value: c.posterior, color: classVar(i), highlight: i === ex.prediction }))} yMax={1} format={(v) => v.toFixed(2)} />
            </Panel>
            <div className="md:col-span-2">
              <PointsTable points={points} onUpdate={ps.update} onRemove={ps.remove} xName={fNames[0]} yName={fNames[1]} labelName={t(C.class)} classNames={cNames} />
            </div>
          </div>
        )
      }
      controls={
        <>
          <Panel title={t(['Sample to classify (evidence)', 'العينة المراد تصنيفها (الدليل)'])}>
            <Slider label={fNames[0]} value={q[0]} min={0} max={10} step={0.1} onChange={(v) => setQ([v, q[1]])} format={(v) => v.toFixed(1)} />
            <Slider label={fNames[1]} value={q[1]} min={0} max={10} step={0.1} onChange={(v) => setQ([q[0], v])} format={(v) => v.toFixed(1)} />
            <Toggle label={t(['Ignore class frequencies (uniform prior)', 'تجاهل تكرار الفئات (احتمال مسبق منتظم)'])} checked={uniformPrior} onChange={setUniformPrior} hint={t(['Compare predictions with and without the prior to see how much base rates matter.', 'قارن التنبؤات مع الاحتمال المسبق وبدونه لترى أهمية المعدلات الأساسية.'])} />
            <Toggle label={t(['Show class Gaussians', 'إظهار توزيعات غاوس للفئات'])} checked={showEllipses} onChange={setShowEllipses} />
          </Panel>
          <Panel title={t(C.dataset)}>
            <Select
              label={t(C.dataset)}
              value={data}
              onChange={(d) => {
                setData(d);
                reset(d);
              }}
              options={[
                { value: 'fruit', label: t(['Fruit sorter (3 classes)', 'فرز الفاكهة (3 فئات)']) },
                { value: 'balanced', label: t(['Two balanced classes', 'فئتان متوازنتان']) },
                { value: 'imbalanced', label: t(['Rare class (85% / 15%)', 'فئة نادرة (85% / 15%)']) },
              ]}
            />
            <Slider label={t(C.seed)} value={seed} min={1} max={99} onChange={(s) => { setSeed(s); reset(data, s); }} />
            <ModePicker mode={mode} onMode={setMode} modes={['query', 'add', 'move', 'remove']} />
            {mode === 'add' && <ClassPicker value={addClass} onChange={setAddClass} nClasses={nClasses} names={cNames} />}
            <p className="text-[11px] text-subtle ltr font-mono">{points.length}/{LIMIT}</p>
            <p className="text-[11px] text-subtle">{t(C.synthetic)}</p>
          </Panel>
        </>
      }
    />
  );
}

function ClassEllipses({ model }: { model: GaussianNBModel }) {
  const { sx, sy } = usePlot();
  return (
    <g pointerEvents="none">
      {model.means.map((mu, c) =>
        [1, 2].map((k) => {
          const rx = Math.abs(sx(mu[0] + k * Math.sqrt(model.variances[c][0])) - sx(mu[0]));
          const ry = Math.abs(sy(mu[1] + k * Math.sqrt(model.variances[c][1])) - sy(mu[1]));
          return <ellipse key={`${c}-${k}`} cx={sx(mu[0])} cy={sy(mu[1])} rx={rx} ry={ry} fill="none" stroke={classVar(c)} strokeWidth={k === 1 ? 2 : 1.2} strokeDasharray={k === 2 ? '5 4' : undefined} />;
        }),
      )}
    </g>
  );
}

function LikelihoodPlot({ model, feature, value, label }: { model: GaussianNBModel; feature: number; value: number; label: string }) {
  const { t } = useI18n();
  const curves = model.means.map((mu, c) => Array.from({ length: 101 }, (_, i) => [i / 10, gaussianPdf(i / 10, mu[feature], model.variances[c][feature])] as const));
  const yMax = Math.max(...curves.flat().map((p) => p[1])) * 1.1;
  return (
    <Plot2D domain={{ xMin: 0, xMax: 10, yMin: 0, yMax }} width={460} height={240} xLabel={label} yLabel={t(['density', 'الكثافة'])} ariaLabel={t(['Class-conditional densities for this feature', 'الكثافات الشرطية للفئات لهذه الخاصية'])}>
      {curves.map((pts, c) => <CurvePath key={c} pts={pts} stroke={classVar(c)} width={2.5} />)}
      <CurvePath pts={[[value, 0], [value, yMax]]} stroke="var(--c-text)" width={1.5} dash="4 3" />
      <LikelihoodDots model={model} feature={feature} value={value} />
    </Plot2D>
  );
}

function LikelihoodDots({ model, feature, value }: { model: GaussianNBModel; feature: number; value: number }) {
  const { sx, sy } = usePlot();
  return (
    <g>
      {model.means.map((mu, c) => (
        <circle key={c} cx={sx(value)} cy={sy(gaussianPdf(value, mu[feature], model.variances[c][feature]))} r={5} fill={classVar(c)} stroke="var(--c-plot)" strokeWidth={2} />
      ))}
    </g>
  );
}
