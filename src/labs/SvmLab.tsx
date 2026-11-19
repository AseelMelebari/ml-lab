import { useEffect, useMemo, useState } from 'react';
import { Contour, EditablePoints, Heatmap, Plot2D, type EditMode } from '@/components/charts/Plot2D';
import { classVar, usePalette } from '@/components/charts/colors';
import { Callout, Segmented, Slider, Stat, Toggle } from '@/components/ui/primitives';
import { TeX } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { CLASS_DOMAIN, makeClassification, type ClassificationDatasetId } from '@/lib/ml/datasets';
import { marginWidth, svmDecision, svmPredict01, trainSVM, type KernelType } from '@/lib/ml/svm';
import { accuracy } from '@/lib/ml/metrics';
import type { ClassPoint } from '@/lib/ml/types';
import { ClassLegend, ClassPicker, DatasetPanel, Hint, LabShell, ModePicker, Panel, PointsTable, StatGrid, type LabProps } from './shared/LabUI';
import { labEvent, usePointSet } from './shared/hooks';

const LIMIT = 120;
const logSlider = (v: number) => 10 ** v;

export default function SvmLab({ presentation, preset }: LabProps) {
  const { t, num } = useI18n();
  const { classRGB, plotRGB, regionAlpha } = usePalette();
  const initDs: ClassificationDatasetId = preset === 'rbf' ? 'circles' : 'separable';
  const [dataset, setDataset] = useState<ClassificationDatasetId>(initDs);
  const [seed, setSeed] = useState(5);
  const [n, setN] = useState(50);
  const ps = usePointSet<ClassPoint>(() => makeClassification(initDs, 50, 5), LIMIT);
  const [mode, setMode] = useState<EditMode>('move');
  const [addClass, setAddClass] = useState(0);
  const [kernel, setKernel] = useState<KernelType>(preset === 'rbf' ? 'rbf' : 'linear');
  const [logC, setLogC] = useState(0);
  const [logGamma, setLogGamma] = useState(-0.5);
  const [showMargins, setShowMargins] = useState(true);
  const points = ps.points;
  const C_ = logSlider(logC);
  const gamma = logSlider(logGamma);
  const hasBoth = points.some((p) => p.label === 0) && points.some((p) => p.label === 1);
  const binary = points.every((p) => p.label <= 1);

  const model = useMemo(() => {
    if (!hasBoth || !binary) return null;
    return trainSVM(
      points.map((p) => [p.x, p.y]),
      points.map((p) => p.label),
      { C: C_, kernel, gamma, tol: 1e-3, maxIter: 40000 },
    );
  }, [points, C_, kernel, gamma, hasBoth, binary]);
  useEffect(() => {
    if (model) labEvent('svm', 'trained');
    if (model && kernel === 'rbf') labEvent('svm', 'rbf');
  }, [model, kernel]);

  const svIds = new Set(model ? model.supportIdx.map((i) => points[i].id) : []);
  const acc = model ? accuracy(points.map((p) => p.label), points.map((p) => svmPredict01(model, [p.x, p.y]))) : 0;
  const margin = model ? marginWidth(model) : null;
  const atBound = model ? model.supportIdx.filter((i) => model.alpha[i] >= C_ - 1e-6).length : 0;
  const version = `${points.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)},${p.label}`).join(';')}|${C_}|${kernel}|${gamma}|${classRGB[0][0]}`;
  const regenerate = (d = dataset, s = seed, count = n) => ps.setPoints(makeClassification(d, count, s));
  const f = (x: number, y: number) => (model ? svmDecision(model, [x, y]) : 0);

  return (
    <LabShell
      presentation={presentation}
      viz={
        <>
          <Plot2D domain={CLASS_DOMAIN} xLabel="x₁" yLabel="x₂" ariaLabel={t(['SVM decision boundary with margins and support vectors', 'حد قرار SVM مع الهوامش ومتجهات الدعم'])} onBackgroundPointer={mode === 'add' ? (x, y) => ps.add({ x, y, label: addClass }) : undefined}>
            {model && (
              <Heatmap
                version={version}
                res={80}
                fn={(x, y) => {
                  const v = f(x, y);
                  const s = Math.tanh(Math.abs(v)) * 0.75 + 0.25;
                  const c = classRGB[v >= 0 ? 1 : 0];
                  const a = regionAlpha * s;
                  return [plotRGB[0] * (1 - a) + c[0] * a, plotRGB[1] * (1 - a) + c[1] * a, plotRGB[2] * (1 - a) + c[2] * a];
                }}
              />
            )}
            {model && showMargins && <Contour version={version} fn={f} level={1} stroke="var(--c-class-1)" width={1.8} dash="6 5" />}
            {model && showMargins && <Contour version={version} fn={f} level={-1} stroke="var(--c-class-0)" width={1.8} dash="6 5" />}
            {model && <Contour version={version} fn={f} level={0} stroke="var(--c-text)" width={3} />}
            <EditablePoints points={points} mode={mode} onMove={ps.move} onRemove={ps.remove} colorOf={(p) => classVar(p.label)} ringIds={svIds} />
          </Plot2D>
          <ClassLegend names={[`${t(C.class)} 0 (y = −1)`, `${t(C.class)} 1 (y = +1)`]} extra={<><span>━ f(x) = 0</span><span>┅ f(x) = ±1 ({t(['margin', 'الهامش'])})</span><span>◯ {t(['support vector', 'متجه دعم'])}</span></>} />
          <Hint>{t(['Drag points across the margin and watch which ones become support vectors. Only support vectors define the boundary.', 'اسحب النقاط عبر الهامش ولاحظ أيها يصبح متجهات دعم. متجهات الدعم وحدها تحدد الحد.'])}</Hint>
        </>
      }
      status={
        <>
          <StatGrid>
            <Stat label={t(['Support vectors', 'متجهات الدعم'])} value={model ? `${model.supportIdx.length} / ${points.length}` : '—'} tone="accent" sub={model ? `${atBound} ${t(['at α = C', 'عند α = C'])}` : undefined} />
            <Stat label={t(['Margin width', 'عرض الهامش'])} value={margin ? num(margin, 3) : kernel === 'rbf' ? t(['(in kernel space)', '(في فضاء النواة)']) : '—'} />
            <Stat label={t(['Training accuracy', 'دقة التدريب'])} value={num(acc, 3)} />
            <Stat label={t(['SMO iterations', 'تكرارات SMO'])} value={model ? model.iterations : '—'} sub={model ? (model.converged ? t(['KKT satisfied ✓', 'شروط KKT محققة ✓']) : t(['iteration cap reached', 'تم بلوغ حد التكرارات'])) : undefined} />
          </StatGrid>
          {!binary && <Callout tone="warn">{t(['This lab trains a binary SVM; use classes 0 and 1 only.', 'يدرّب هذا المختبر SVM ثنائيًا؛ استخدم الفئتين 0 و1 فقط.'])}</Callout>}
          {!hasBoth && <Callout tone="warn">{t(C.needTwoClasses)}</Callout>}
          {model && !model.converged && <Callout tone="warn">{t(['The optimizer hit its iteration cap before meeting the tolerance; the boundary is approximate.', 'وصل المُحسِّن إلى حد التكرارات قبل بلوغ دقة التوقف؛ الحد تقريبي.'])}</Callout>}
        </>
      }
      below={
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={t(['The learned model', 'النموذج المتعلَّم'])}>
            {model?.w ? (
              <TeX display tex={`f(\\mathbf{x}) = ${num(model.w[0], 3)}\\,x_1 ${model.w[1] >= 0 ? '+' : '-'} ${num(Math.abs(model.w[1]), 3)}\\,x_2 ${model.b >= 0 ? '+' : '-'} ${num(Math.abs(model.b), 3)}`} />
            ) : (
              <TeX display tex={`f(\\mathbf{x}) = \\sum_{i \\in SV} \\alpha_i y_i \\, e^{-${num(gamma, 3)}\\lVert \\mathbf{x}_i - \\mathbf{x}\\rVert^2} ${model && model.b >= 0 ? '+' : '-'} ${num(Math.abs(model?.b ?? 0), 3)}`} />
            )}
            <p className="text-sm text-muted">{t(['Class +1 if f(x) ≥ 0, otherwise class −1. Points with α = 0 have no influence at all — delete one and the boundary does not move.', 'الفئة +1 إذا كانت f(x) ≥ 0، وإلا فالفئة −1. النقاط التي α = 0 لا تؤثر إطلاقًا — احذف إحداها ولن يتحرك الحد.'])}</p>
            {model && <p className="text-xs text-muted ltr font-mono">dual objective = {num(model.dualObjective, 4)} · KKT gap = {num(model.gap, 5)}</p>}
          </Panel>
          <Panel title={t(['Support vectors and their α', 'متجهات الدعم وقيم α'])}>
            <div className="max-h-56 overflow-auto">
              <table className="w-full text-xs font-mono">
                <thead className="text-muted font-sans">
                  <tr>
                    <th className="text-start py-1">(x₁, x₂)</th>
                    <th>y</th>
                    <th>α</th>
                    <th>y·f(x)</th>
                  </tr>
                </thead>
                <tbody>
                  {model?.supportIdx.map((i) => (
                    <tr key={i} className="border-t border-line/60 text-center">
                      <td className="py-1 text-start ltr">({num(points[i].x, 2)}, {num(points[i].y, 2)})</td>
                      <td>{model.y[i] > 0 ? '+1' : '−1'}</td>
                      <td className={model.alpha[i] >= C_ - 1e-6 ? 'text-warn' : 'text-ink'}>{num(model.alpha[i], 3)}</td>
                      <td>{num(model.y[i] * svmDecision(model, [points[i].x, points[i].y]), 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">{t(['y·f(x) = 1 → exactly on the margin; < 1 → inside the margin or misclassified (allowed by the soft margin, with α = C).', 'y·f(x) = 1 ← على الهامش تمامًا؛ أقل من 1 ← داخل الهامش أو مصنّفة خطأ (يسمح بها الهامش المرن، مع α = C).'])}</p>
          </Panel>
          <div className="md:col-span-2">
            <PointsTable points={points} onUpdate={ps.update} onRemove={ps.remove} labelName={t(C.class)} classNames={['0', '1']} />
          </div>
        </div>
      }
      controls={
        <>
          <Panel title={t(C.parameters)}>
            <Segmented
              label={t(['Kernel', 'النواة'])}
              value={kernel}
              onChange={setKernel}
              size="sm"
              options={[
                { value: 'linear', label: t(['Linear', 'خطية']) },
                { value: 'rbf', label: 'RBF' },
              ]}
            />
            <Slider label={t(['Regularization C', 'معامل التنظيم C'])} value={logC} min={-2} max={3} step={0.1} onChange={(v) => { setLogC(v); labEvent('svm', 'changed-c'); }} format={(v) => num(logSlider(v), v < 0 ? 3 : 1)} hint={t(['Small C: wide, tolerant margin. Large C: narrow margin that tries hard to classify every point.', 'C صغير: هامش عريض متسامح. C كبير: هامش ضيق يحاول تصنيف كل نقطة بدقة.'])} />
            <Slider label={t(['RBF gamma γ', 'معامل γ لنواة RBF'])} value={logGamma} min={-2} max={1} step={0.1} onChange={setLogGamma} disabled={kernel !== 'rbf'} format={(v) => num(logSlider(v), 3)} hint={t(['Large γ: each point influences only a tiny neighbourhood → wiggly boundary.', 'γ كبير: كل نقطة تؤثر في جوار صغير جدًا ← حد متعرّج.'])} />
            <Toggle label={t(['Show margins', 'إظهار الهوامش'])} checked={showMargins} onChange={setShowMargins} />
            <p className="text-xs text-subtle">{t(['The model retrains automatically (SMO solver) whenever data or parameters change.', 'يُعاد تدريب النموذج تلقائيًا (بخوارزمية SMO) عند تغيّر البيانات أو المعاملات.'])}</p>
          </Panel>
          <DatasetPanel
            dataset={dataset}
            options={[
              { value: 'separable', label: t(['Linearly separable', 'قابلة للفصل خطيًا']) },
              { value: 'overlap', label: t(['Overlapping', 'متداخلة']) },
              { value: 'circles', label: t(['Circles (needs RBF)', 'دوائر (تحتاج RBF)']) },
              { value: 'moons', label: t(['Moons', 'أهلّة']) },
              { value: 'xor', label: t(['XOR pattern', 'نمط XOR']) },
            ]}
            onDataset={(d) => {
              setDataset(d);
              regenerate(d);
            }}
            n={n}
            onN={(v) => {
              setN(v);
              regenerate(dataset, seed, v);
            }}
            nMax={LIMIT}
            seed={seed}
            onSeed={(s) => {
              setSeed(s);
              regenerate(dataset, s);
            }}
            onRegenerate={() => regenerate()}
            count={points.length}
            limit={LIMIT}
          >
            <ModePicker mode={mode} onMode={setMode} />
            {mode === 'add' && <ClassPicker value={addClass} onChange={setAddClass} nClasses={2} names={['0', '1']} />}
          </DatasetPanel>
        </>
      }
    />
  );
}
