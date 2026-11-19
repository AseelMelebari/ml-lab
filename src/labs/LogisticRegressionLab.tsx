import { useMemo, useState } from 'react';
import { Contour, CurvePath, EditablePoints, Heatmap, Marker, Plot2D, Probe, usePlot, type EditMode } from '@/components/charts/Plot2D';
import { blendClasses, classVar, usePalette } from '@/components/charts/colors';
import { LineChart } from '@/components/charts/LineChart';
import { ConfusionMatrix } from '@/components/charts/ConfusionMatrix';
import { Callout, Slider, Stat } from '@/components/ui/primitives';
import { TeX } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { CLASS_DOMAIN, makeClassification, type ClassificationDatasetId } from '@/lib/ml/datasets';
import { linearScore, logLoss, logisticStep, predictProba, sigmoid, type LogisticModel } from '@/lib/ml/logisticRegression';
import { binaryConfusion, binaryScores, rocCurve } from '@/lib/ml/metrics';
import type { ClassPoint } from '@/lib/ml/types';
import { ClassLegend, ClassPicker, DatasetPanel, Hint, LabShell, ModePicker, Panel, PlayControls, PointsTable, StatGrid, type LabProps } from './shared/LabUI';
import { labEvent, useLoop, usePointSet, usePresenterKeys } from './shared/hooks';

const LIMIT = 160;
const LR = [0.01, 0.03, 0.1, 0.3, 1];

export default function LogisticRegressionLab({ presentation, preset }: LabProps) {
  const { t, num } = useI18n();
  const { classRGB, plotRGB, regionAlpha } = usePalette();
  const initialDs: ClassificationDatasetId = preset === 'imbalanced' ? 'imbalanced' : 'overlap';
  const [dataset, setDataset] = useState<ClassificationDatasetId>(initialDs);
  const [seed, setSeed] = useState(4);
  const [n, setN] = useState(60);
  const ps = usePointSet<ClassPoint>(() => makeClassification(initialDs, 60, 4), LIMIT);
  const [mode, setMode] = useState<EditMode>('add');
  const [addClass, setAddClass] = useState(1);
  const [lrIdx, setLrIdx] = useState(3);
  const [l2, setL2] = useState(0);
  const [model, setModel] = useState<LogisticModel>({ w1: 0, w2: 0, b: 0 });
  const [losses, setLosses] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [threshold, setThreshold] = useState(0.5);
  const [probe, setProbe] = useState<[number, number] | null>([1, -1]);
  const points = ps.points;
  const names = [t(['Class 0 (negative)', 'الفئة 0 (سالبة)']), t(['Class 1 (positive)', 'الفئة 1 (موجبة)'])];
  const hasBoth = points.some((p) => p.label === 0) && points.some((p) => p.label === 1);

  const reset = () => {
    setRunning(false);
    setModel({ w1: 0, w2: 0, b: 0 });
    setLosses([]);
  };
  const regenerate = (d = dataset, s = seed, count = n) => {
    ps.setPoints(makeClassification(d, count, s));
    reset();
  };
  const step = (k: number) => {
    if (!hasBoth) return setRunning(false);
    let m = model;
    const ls: number[] = [];
    for (let i = 0; i < k; i++) {
      m = logisticStep(points, m, LR[lrIdx], l2);
      ls.push(logLoss(points, m, l2));
    }
    setModel(m);
    setLosses((l) => [...l, ...ls].slice(-3000));
    labEvent('logistic-regression', 'trained');
    if (losses.length + k >= 3000) setRunning(false);
  };
  useLoop(running, () => step(4), 50);
  usePresenterKeys(!!presentation, { toggle: () => setRunning((r) => !r), step: () => step(1), reset });

  const probs = points.map((p) => predictProba(model, p.x, p.y));
  const preds = probs.map((p) => (p >= threshold ? 1 : 0));
  const cm = binaryConfusion(points.map((p) => p.label), preds);
  const sc = binaryScores(cm);
  const roc = useMemo(() => rocCurve(probs, points.map((p) => p.label)), [probs.join(','), points]); // eslint-disable-line react-hooks/exhaustive-deps
  const fprAt = cm.fp / Math.max(1, cm.fp + cm.tn);
  const tprAt = cm.tp / Math.max(1, cm.tp + cm.fn);
  const trained = losses.length > 0;
  const version = `${model.w1},${model.w2},${model.b},${classRGB[0][0]}`;

  return (
    <LabShell
      presentation={presentation}
      viz={
        <>
          <Plot2D
            domain={CLASS_DOMAIN}
            xLabel="x₁"
            yLabel="x₂"
            ariaLabel={t(['Two-class data with predicted probability map and decision boundary', 'بيانات بفئتين مع خريطة الاحتمالات وحد القرار'])}
            onBackgroundPointer={mode === 'add' ? (x, y) => ps.add({ x, y, label: addClass }) : mode === 'query' ? (x, y) => setProbe([x, y]) : undefined}
          >
            {trained && <Heatmap version={version} fn={(x, y) => { const p = predictProba(model, x, y); return blendClasses([1 - p, p], classRGB, plotRGB, regionAlpha); }} />}
            {trained && <Contour version={`${version}${threshold}`} fn={(x, y) => predictProba(model, x, y)} level={threshold} stroke="var(--c-text)" width={2.5} />}
            {trained && threshold !== 0.5 && <Contour version={version} fn={(x, y) => predictProba(model, x, y)} level={0.5} stroke="var(--c-text)" width={1.2} dash="5 5" opacity={0.6} />}
            <EditablePoints
              points={points}
              mode={mode}
              onMove={ps.move}
              onRemove={ps.remove}
              colorOf={(p) => classVar(p.label)}
              ringIds={new Set(trained ? points.filter((_, i) => preds[i] !== points[i].label).map((p) => p.id) : [])}
            />
            {probe && <Probe x={probe[0]} y={probe[1]} label={`p=${predictProba(model, probe[0], probe[1]).toFixed(3)}`} />}
          </Plot2D>
          <ClassLegend
            names={names}
            extra={
              trained && (
                <>
                  <span>━ {t(['boundary at threshold', 'الحد عند العتبة'])}</span>
                  <span>◯ {t(['misclassified', 'مصنّف خطأ'])}</span>
                </>
              )
            }
          />
          <Hint>{t(['Add mode places points of the chosen class. Query mode probes the model’s probability anywhere.', 'وضع الإضافة يضع نقاطًا من الفئة المختارة، ووضع الاستعلام يفحص احتمال النموذج في أي موضع.'])}</Hint>
        </>
      }
      status={
        <>
          <StatGrid>
            <Stat label={t(C.accuracy)} value={num(sc.accuracy, 3)} tone="accent" />
            <Stat label={t(C.precision)} value={num(sc.precision, 3)} />
            <Stat label={t(C.recall)} value={num(sc.recall, 3)} />
            <Stat label={t(C.f1)} value={num(sc.f1, 3)} />
          </StatGrid>
          {!hasBoth && <Callout tone="warn">{t(C.needTwoClasses)}</Callout>}
          {(dataset === 'circles' || dataset === 'moons') && trained && (
            <Callout tone="warn" title={t(['A linear boundary', 'حدّ خطي'])}>
              {t(['Logistic regression draws a straight-line boundary (w₁x₁ + w₂x₂ + b = constant). Curved class shapes need engineered features or a non-linear model such as an SVM with an RBF kernel or a tree ensemble.', 'يرسم الانحدار اللوجستي حدًا مستقيمًا (w₁x₁ + w₂x₂ + b = ثابت). الأشكال المنحنية تحتاج إلى خصائص مُهندَسة أو نموذج غير خطي مثل SVM بنواة RBF أو مجموعات الأشجار.'])}
            </Callout>
          )}
          {dataset === 'imbalanced' && (
            <Callout tone="info" title={t(['Imbalanced classes', 'فئات غير متوازنة'])}>
              {t(['Only ~12% of points are positive. Accuracy can look high even when recall is poor — lower the threshold and watch recall rise while precision falls.', 'حوالي 12% فقط من النقاط موجبة. قد تبدو الدقة مرتفعة حتى عندما يكون الاستدعاء ضعيفًا — خفّض العتبة وراقب ارتفاع الاستدعاء وانخفاض الضبط.'])}
            </Callout>
          )}
        </>
      }
      below={
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={t(['Sigmoid: from score z to probability', 'دالة السيني: من الدرجة z إلى الاحتمال'])}>
            <SigmoidView points={points} model={model} threshold={threshold} />
            <p className="text-xs text-muted">
              <TeX tex={`z = ${num(model.w1, 3)}\\,x_1 ${model.w2 >= 0 ? '+' : '-'} ${num(Math.abs(model.w2), 3)}\\,x_2 ${model.b >= 0 ? '+' : '-'} ${num(Math.abs(model.b), 3)},\\quad p = \\sigma(z) = \\frac{1}{1+e^{-z}}`} />
            </p>
          </Panel>
          <Panel title={t(['Confusion matrix at the current threshold', 'مصفوفة الالتباس عند العتبة الحالية'])}>
            <ConfusionMatrix matrix={[[cm.tn, cm.fp], [cm.fn, cm.tp]]} classNames={['0', '1']} />
            <p className="text-xs text-muted ltr">
              TP={cm.tp} · FP={cm.fp} · TN={cm.tn} · FN={cm.fn}
            </p>
          </Panel>
          <Panel title={t(['Training loss (log loss)', 'خسارة التدريب (الخسارة اللوغاريتمية)'])}>
            <LineChart ariaLabel={t(['Log loss per iteration', 'الخسارة اللوغاريتمية لكل تكرار'])} series={[{ id: 'll', label: 'log loss', values: losses, color: 'var(--c-accent)' }]} xLabel={t(C.iteration)} xStart={1} yMin={0} emptyText={t(['Press Play to train', 'اضغط تشغيل للتدريب'])} />
          </Panel>
          <Panel title={`ROC · AUC = ${Number.isFinite(roc.auc) && trained ? num(roc.auc, 3) : '—'}`}>
            <Plot2D domain={{ xMin: 0, xMax: 1, yMin: 0, yMax: 1 }} width={460} height={330} xLabel={t(['False positive rate', 'معدل الإيجابيات الكاذبة'])} yLabel={t(['True positive rate', 'معدل الإيجابيات الصحيحة'])} ariaLabel="ROC curve">
              <CurvePath pts={[[0, 0], [1, 1]]} stroke="var(--c-subtle)" width={1.2} dash="4 4" />
              {trained && <CurvePath pts={roc.points.map((p) => [p.fpr, p.tpr] as const)} />}
              {trained && <RocDot x={fprAt} y={tprAt} />}
            </Plot2D>
          </Panel>
          <div className="md:col-span-2">
            <PointsTable points={points} onUpdate={ps.update} onRemove={ps.remove} labelName={t(C.class)} classNames={['0', '1']} extraColumns={[{ header: 'p(y=1)', value: (p) => num(predictProba(model, p.x, p.y), 3) }]} />
          </div>
        </div>
      }
      controls={
        <>
          <Panel title={t(['Training', 'التدريب'])}>
            <PlayControls running={running} onToggle={() => setRunning((r) => !r)} onStep={() => step(1)} onReset={reset} disabled={!hasBoth} />
            <Slider label={t(C.learningRate)} value={lrIdx} min={0} max={LR.length - 1} onChange={setLrIdx} format={(i) => String(LR[i])} />
            <Slider label={t(['L2 regularization λ', 'التنظيم L2 (λ)'])} value={l2} min={0} max={0.5} step={0.01} onChange={setL2} hint={t(['Penalizes large weights, giving softer probabilities and a simpler model.', 'يعاقب الأوزان الكبيرة، فيعطي احتمالات أنعم ونموذجًا أبسط.'])} />
            <div className="text-xs text-muted ltr font-mono">
              {t(C.iteration)}: {losses.length} · loss: {num(trained ? losses[losses.length - 1] : logLoss(points, model, l2), 4)}
            </div>
          </Panel>
          <Panel title={t(['Decision threshold', 'عتبة القرار'])}>
            <Slider label={t(['Threshold t', 'العتبة t'])} value={threshold} min={0.05} max={0.95} step={0.01} onChange={setThreshold} format={(v) => v.toFixed(2)} hint={t(['Predict class 1 when p(y=1|x) ≥ t.', 'تنبأ بالفئة 1 عندما يكون p(y=1|x) ≥ t.'])} />
            <p className="text-xs text-muted">{t(['Moving the threshold does not retrain the model — it only changes how probabilities become labels.', 'تحريك العتبة لا يعيد تدريب النموذج — بل يغيّر فقط طريقة تحويل الاحتمالات إلى تصنيفات.'])}</p>
          </Panel>
          <DatasetPanel
            dataset={dataset}
            options={[
              { value: 'separable', label: t(['Linearly separable', 'قابلة للفصل خطيًا']) },
              { value: 'overlap', label: t(['Overlapping classes', 'فئات متداخلة']) },
              { value: 'imbalanced', label: t(['Imbalanced', 'غير متوازنة']) },
              { value: 'moons', label: t(['Moons (non-linear)', 'أهلّة (غير خطية)']) },
              { value: 'circles', label: t(['Circles (non-linear)', 'دوائر (غير خطية)']) },
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
            nMax={140}
            seed={seed}
            onSeed={(s) => {
              setSeed(s);
              regenerate(dataset, s);
            }}
            onRegenerate={() => regenerate()}
            count={points.length}
            limit={LIMIT}
          >
            <ModePicker mode={mode} onMode={setMode} modes={['add', 'move', 'remove', 'query']} />
            {mode === 'add' && <ClassPicker value={addClass} onChange={setAddClass} nClasses={2} names={['0', '1']} />}
          </DatasetPanel>
        </>
      }
    />
  );
}

function RocDot({ x, y }: { x: number; y: number }) {
  const { sx, sy } = usePlot();
  return <circle cx={sx(x)} cy={sy(y)} r={7} fill="var(--c-warn)" stroke="var(--c-plot)" strokeWidth={2} />;
}

function SigmoidView({ points, model, threshold }: { points: ClassPoint[]; model: LogisticModel; threshold: number }) {
  const { t } = useI18n();
  const curve = useMemo(() => Array.from({ length: 121 }, (_, i) => [-8 + (i / 120) * 16, sigmoid(-8 + (i / 120) * 16)] as const), []);
  const zt = Math.log(threshold / (1 - threshold));
  return (
    <Plot2D domain={{ xMin: -8, xMax: 8, yMin: -0.05, yMax: 1.05 }} width={460} height={300} xLabel={t(['score z = w·x + b', 'الدرجة z = w·x + b'])} yLabel="σ(z)" ariaLabel={t(['Sigmoid curve with each data point placed at its score', 'منحنى السيني مع وضع كل نقطة عند درجتها'])}>
      <CurvePath pts={[[-8, threshold], [8, threshold]]} stroke="var(--c-warn)" width={1.5} dash="5 4" />
      <CurvePath pts={[[zt, -0.05], [zt, 1.05]]} stroke="var(--c-warn)" width={1.5} dash="5 4" />
      <CurvePath pts={curve} stroke="var(--c-accent)" width={3} />
      <SigmoidPoints points={points} model={model} />
    </Plot2D>
  );
}

function SigmoidPoints({ points, model }: { points: ClassPoint[]; model: LogisticModel }) {
  const { sx, sy } = usePlot();
  return (
    <g>
      {points.map((p) => {
        const z = Math.max(-8, Math.min(8, linearScore(model, p.x, p.y)));
        return <Marker key={p.id} shape={p.label} x={sx(z)} y={sy(sigmoid(z))} r={4.5} fill={classVar(p.label)} opacity={0.85} />;
      })}
    </g>
  );
}
