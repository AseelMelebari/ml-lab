import { useMemo, useState } from 'react';
import { Contour, DataLine, EditablePoints, Heatmap, Marker, Plot2D, usePlot, type EditMode } from '@/components/charts/Plot2D';
import { LineChart } from '@/components/charts/LineChart';
import { Callout, Slider, Stat, Toggle } from '@/components/ui/primitives';
import { TeX } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { REG_DOMAIN, makeRegression, type RegressionDatasetId } from '@/lib/ml/datasets';
import { closedFormLine, gradientStep, lineGradient, lineMSE, predictLine, type LineModel } from '@/lib/ml/linearRegression';
import { regressionScores } from '@/lib/ml/metrics';
import type { RegPoint } from '@/lib/ml/types';
import { DatasetPanel, LabShell, ModePicker, Panel, PlayControls, PointsTable, StatGrid, Hint, type LabProps } from './shared/LabUI';
import { labEvent, useLoop, usePointSet, usePresenterKeys } from './shared/hooks';

const LR_STEPS = [0.0005, 0.001, 0.003, 0.005, 0.01, 0.02, 0.03, 0.05];
const LIMIT = 120;
const W_DOM = { xMin: -1.5, xMax: 2.5, yMin: -4, yMax: 10 };

const PRESETS: Record<string, { dataset: RegressionDatasetId; lrIdx: number; seed: number }> = {
  learn: { dataset: 'noisy', lrIdx: 4, seed: 7 },
  diverge: { dataset: 'linear', lrIdx: 7, seed: 3 },
  underfit: { dataset: 'curved', lrIdx: 4, seed: 5 },
};

export default function LinearRegressionLab({ presentation, preset }: LabProps) {
  const { t, num } = useI18n();
  const P = PRESETS[preset ?? ''] ?? { dataset: 'linear' as RegressionDatasetId, lrIdx: 4, seed: 7 };
  const [dataset, setDataset] = useState<RegressionDatasetId>(P.dataset);
  const [seed, setSeed] = useState(P.seed);
  const [n, setN] = useState(30);
  const ps = usePointSet<RegPoint>(() => makeRegression(P.dataset, 30, P.seed), LIMIT);
  const [mode, setMode] = useState<EditMode>('add');
  const [lrIdx, setLrIdx] = useState(P.lrIdx);
  const lr = LR_STEPS[lrIdx];
  const [maxIter, setMaxIter] = useState(400);
  const [model, setModel] = useState<LineModel>({ w: 0, b: 0 });
  const [history, setHistory] = useState<{ losses: number[]; path: LineModel[] }>({ losses: [], path: [{ w: 0, b: 0 }] });
  const [running, setRunning] = useState(false);
  const [diverged, setDiverged] = useState(false);
  const [converged, setConverged] = useState(false);
  const [showOLS, setShowOLS] = useState(false);
  const [showResid, setShowResid] = useState(true);
  const [xNew, setXNew] = useState(6);
  const [speed, setSpeed] = useState(3);

  const points = ps.points;
  const iter = history.losses.length;
  const ols = useMemo(() => closedFormLine(points), [points]);
  const loss = lineMSE(points, model);
  const grad = lineGradient(points, model);
  const scores = regressionScores(points.map((p) => p.y), points.map((p) => predictLine(model, p.x)));
  const olsScores = ols ? regressionScores(points.map((p) => p.y), points.map((p) => predictLine(ols, p.x))) : null;

  const regenerate = (d = dataset, s = seed, count = n) => {
    ps.setPoints(makeRegression(d, count, s));
    resetModel();
  };
  const resetModel = () => {
    setRunning(false);
    setModel({ w: 0, b: 0 });
    setHistory({ losses: [], path: [{ w: 0, b: 0 }] });
    setDiverged(false);
    setConverged(false);
  };

  const doSteps = (k: number) => {
    if (points.length < 2) {
      setRunning(false);
      return;
    }
    let m = model;
    const losses: number[] = [];
    const path: LineModel[] = [];
    let div = false;
    let conv = false;
    for (let i = 0; i < k && iter + i < maxIter; i++) {
      const r = gradientStep(points, m, lr);
      m = r.model;
      losses.push(r.loss);
      path.push(m);
      if (r.diverged) {
        div = true;
        break;
      }
      const g = lineGradient(points, m);
      if (Math.hypot(g.dw, g.db) < 1e-4) {
        conv = true;
        break;
      }
    }
    setModel(m);
    setHistory((h) => ({ losses: [...h.losses, ...losses], path: [...h.path, ...path] }));
    labEvent('linear-regression', 'trained');
    if (div) {
      setDiverged(true);
      setRunning(false);
      labEvent('linear-regression', 'diverged');
    } else if (conv) {
      setConverged(true);
      setRunning(false);
      labEvent('linear-regression', 'converged');
    } else if (iter + losses.length >= maxIter) setRunning(false);
  };

  useLoop(running, () => doSteps(speed), 60);
  usePresenterKeys(!!presentation, { toggle: () => setRunning((r) => !r), step: () => doSteps(1), reset: resetModel });

  const statusText = diverged
    ? t(['Diverged: the learning rate is too large, so each step overshoots the minimum. Reset and lower α.', 'تباعد: معدل التعلّم كبير جدًا، فكل خطوة تتجاوز النقطة الدنيا. أعد الضبط وخفّض α.'])
    : converged
      ? t(['Converged: the gradient is ≈ 0, so the parameters stopped changing.', 'تقارب: التدرّج ≈ 0، لذلك توقفت المعاملات عن التغيّر.'])
      : iter >= maxIter
        ? t(['Reached the iteration limit. Increase iterations to continue.', 'تم بلوغ حد التكرارات. زِد عدد التكرارات للمتابعة.'])
        : null;

  return (
    <LabShell
      presentation={presentation}
      viz={
        <>
          <Plot2D
            domain={REG_DOMAIN}
            xLabel={t(['x (input feature)', 'x (خاصية الإدخال)'])}
            yLabel={t(['y (target)', 'y (الهدف)'])}
            ariaLabel={t(['Scatter plot of the regression data with the current fitted line', 'مخطط انتشار لبيانات الانحدار مع الخط الحالي'])}
            onBackgroundPointer={mode === 'add' ? (x, y) => ps.add({ x, y }) : undefined}
          >
            {showResid &&
              points.map((p) => <DataLine key={`r${p.id}`} x1={p.x} y1={p.y} x2={p.x} y2={predictLine(model, p.x)} stroke="var(--c-danger)" strokeWidth={1.2} opacity={0.55} strokeDasharray="2 2" />)}
            {showOLS && ols && <DataLine x1={0} y1={ols.b} x2={10} y2={predictLine(ols, 10)} stroke="var(--c-purple)" strokeWidth={2} strokeDasharray="7 5" />}
            {Number.isFinite(model.w) && <DataLine x1={0} y1={model.b} x2={10} y2={predictLine(model, 10)} stroke="var(--c-accent)" strokeWidth={3} />}
            <EditablePoints points={points} mode={mode} onMove={ps.move} onRemove={ps.remove} colorOf={() => 'var(--c-cyan)'} shapeOf={() => 0} />
            <PredictionMarker x={xNew} y={predictLine(model, xNew)} />
          </Plot2D>
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 pt-1 text-xs text-muted">
            <Legend color="var(--c-accent)" label={t(['Gradient-descent line', 'خط الانحدار التدرّجي'])} />
            {showOLS && <Legend color="var(--c-purple)" dashed label={t(['Closed-form (OLS) line', 'خط الحل المغلق (OLS)'])} />}
            {showResid && <Legend color="var(--c-danger)" dashed label={t(['Residuals (errors)', 'البواقي (الأخطاء)'])} />}
            <Legend color="var(--c-warn)" label={t(['Prediction for new x', 'التنبؤ لقيمة x جديدة'])} />
          </div>
          <Hint>{t(C.hintTapPlot)}</Hint>
        </>
      }
      status={
        <>
          <StatGrid>
            <Stat label={t(['slope w', 'الميل w'])} value={num(model.w, 4)} />
            <Stat label={t(['intercept b', 'المقطع b'])} value={num(model.b, 4)} />
            <Stat label={`MSE · ${t(C.iteration)} ${iter}`} value={num(loss, 4)} tone={diverged ? 'danger' : 'accent'} />
            <Stat label="‖∇J‖" value={num(Math.hypot(grad.dw, grad.db), 4)} />
          </StatGrid>
          {statusText && <Callout tone={diverged ? 'danger' : 'tip'}>{statusText}</Callout>}
          {dataset === 'curved' && (
            <Callout tone="warn" title={t(['Underfitting', 'نقص الملاءمة'])}>
              {t(['This data follows a curve, but a straight line can only capture a linear trend. Even the best line (closed-form) leaves large structured residuals — the model is too simple.', 'تتبع هذه البيانات منحنى، بينما يلتقط الخط المستقيم اتجاهًا خطيًا فقط. حتى أفضل خط (الحل المغلق) يترك بواقي كبيرة ذات نمط واضح — فالنموذج أبسط من اللازم.'])}
            </Callout>
          )}
        </>
      }
      below={
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={t(['Training loss curve (MSE)', 'منحنى خسارة التدريب (MSE)'])}>
            <LineChart
              ariaLabel={t(['Loss per iteration', 'الخسارة لكل تكرار'])}
              series={[{ id: 'mse', label: 'MSE', values: history.losses.map((v) => Math.min(v, 1e6)), color: 'var(--c-accent)' }]}
              xLabel={t(C.iteration)}
              xStart={1}
              yMin={0}
              refLines={showOLS && ols ? [{ y: lineMSE(points, ols), label: t(['OLS minimum', 'الحد الأدنى OLS']), color: 'var(--c-purple)' }] : undefined}
              emptyText={t(['Press Play or Step to start gradient descent', 'اضغط تشغيل أو خطوة لبدء الانحدار التدرّجي'])}
            />
          </Panel>
          <Panel title={t(['Loss surface J(w, b) and descent path', 'سطح الخسارة J(w, b) ومسار النزول'])}>
            <LossSurface points={points} path={history.path} ols={ols} />
            <p className="text-xs text-subtle">
              {t(['Brighter = lower loss. Each dot is one gradient step; the ✕ marks the exact least-squares minimum.', 'الأفتح = خسارة أقل. كل نقطة تمثل خطوة تدرّج واحدة، وعلامة ✕ تحدد الحد الأدنى الدقيق للمربعات الصغرى.'])}
            </p>
          </Panel>
          <Panel title={t(['Evaluation on the current data', 'التقييم على البيانات الحالية'])} className="md:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm ltr">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-1 text-start">{t(['Model', 'النموذج'])}</th>
                    <th>MAE</th>
                    <th>MSE</th>
                    <th>RMSE</th>
                    <th>R²</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-center">
                  <tr className="border-t border-line">
                    <td className="py-1.5 text-start font-sans">{t(['Gradient descent', 'الانحدار التدرّجي'])}</td>
                    <td>{num(scores.mae, 3)}</td>
                    <td>{num(scores.mse, 3)}</td>
                    <td>{num(scores.rmse, 3)}</td>
                    <td>{num(scores.r2, 3)}</td>
                  </tr>
                  {olsScores && (
                    <tr className="border-t border-line">
                      <td className="py-1.5 text-start font-sans">{t(['Closed form (OLS)', 'الحل المغلق (OLS)'])}</td>
                      <td>{num(olsScores.mae, 3)}</td>
                      <td>{num(olsScores.mse, 3)}</td>
                      <td>{num(olsScores.rmse, 3)}</td>
                      <td>{num(olsScores.r2, 3)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {ols && (
              <p className="text-xs text-muted">
                {t(['Closed form:', 'الحل المغلق:'])} <TeX tex={`\\hat w = ${ols.w.toFixed(4)},\; \\hat b = ${ols.b.toFixed(4)}`} />
              </p>
            )}
          </Panel>
          <div className="md:col-span-2">
            <PointsTable points={points} onUpdate={ps.update} onRemove={ps.remove} xName="x" yName="y" extraColumns={[{ header: 'ŷ', value: (p) => num(predictLine(model, p.x), 3) }]} />
          </div>
        </div>
      }
      controls={
        <>
          <Panel title={t(['Gradient descent', 'الانحدار التدرّجي'])}>
            <PlayControls running={running} onToggle={() => (diverged ? undefined : setRunning((r) => !r))} onStep={() => doSteps(1)} onReset={resetModel} disabled={points.length < 2 || diverged} />
            <Slider label={t(C.learningRate)} value={lrIdx} min={0} max={LR_STEPS.length - 1} onChange={(v) => setLrIdx(v)} format={(i) => String(LR_STEPS[i])} hint={t(['How big each step is. Too small = slow; too large = overshoot and diverge.', 'حجم كل خطوة. الصغير جدًا بطيء، والكبير جدًا يتجاوز الهدف ويتباعد.'])} />
            <Slider label={t(['Max iterations', 'أقصى عدد للتكرارات'])} value={maxIter} min={50} max={3000} step={50} onChange={setMaxIter} />
            <Slider label={t(['Steps per frame', 'خطوات لكل إطار'])} value={speed} min={1} max={25} onChange={setSpeed} />
            <Toggle label={t(['Show closed-form solution', 'إظهار الحل المغلق'])} checked={showOLS} onChange={setShowOLS} />
            <Toggle label={t(['Show residuals', 'إظهار البواقي'])} checked={showResid} onChange={setShowResid} />
            {points.length < 2 && <p className="text-xs text-warn">{t(C.noData)}</p>}
          </Panel>
          <Panel title={t(['Predict a new input', 'تنبؤ لمدخل جديد'])}>
            <Slider label={t(['new x', 'x الجديد'])} value={xNew} min={0} max={10} step={0.1} onChange={setXNew} />
            <div className="ltr text-sm">
              <TeX tex={`\\hat y = ${num(model.w, 3)}\\times ${xNew.toFixed(1)} ${model.b >= 0 ? '+' : '-'} ${num(Math.abs(model.b), 3)} = ${num(predictLine(model, xNew), 3)}`} />
            </div>
          </Panel>
          <DatasetPanel
            dataset={dataset}
            options={[
              { value: 'linear', label: t(['Linear trend', 'اتجاه خطي']) },
              { value: 'noisy', label: t(['Noisy linear', 'خطي مع ضوضاء']) },
              { value: 'outliers', label: t(['With outliers', 'مع قيم شاذة']) },
              { value: 'curved', label: t(['Curved (underfitting)', 'منحني (نقص ملاءمة)']) },
              { value: 'flat', label: t(['No relationship', 'لا توجد علاقة']) },
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
            nMax={100}
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
          </DatasetPanel>
        </>
      }
    />
  );
}

function PredictionMarker({ x, y }: { x: number; y: number }) {
  const { sx, sy } = usePlot();
  if (!Number.isFinite(y)) return null;
  return (
    <g pointerEvents="none">
      <line x1={sx(x)} x2={sx(x)} y1={sy(0)} y2={sy(Math.max(0, Math.min(10, y)))} stroke="var(--c-warn)" strokeDasharray="3 3" />
      <Marker shape={3} x={sx(x)} y={sy(y)} r={7} fill="var(--c-warn)" />
    </g>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="18" height="6" aria-hidden>
        <line x1="1" x2="17" y1="3" y2="3" stroke={color} strokeWidth="2.5" strokeDasharray={dashed ? '4 3' : undefined} />
      </svg>
      {label}
    </span>
  );
}

function LossSurface({ points, path, ols }: { points: RegPoint[]; path: LineModel[]; ols: LineModel | null }) {
  const { t } = useI18n();
  const version = points;
  const { minL, maxL } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i <= 20; i++)
      for (let j = 0; j <= 20; j++) {
        const L = Math.log1p(lineMSE(points, { w: W_DOM.xMin + (i / 20) * 4, b: W_DOM.yMin + (j / 20) * 14 }));
        lo = Math.min(lo, L);
        hi = Math.max(hi, L);
      }
    return { minL: lo, maxL: hi };
  }, [points]);
  const color = (w: number, b: number): [number, number, number] => {
    const L = Math.log1p(lineMSE(points, { w, b }));
    const s = 1 - Math.min(1, Math.max(0, (L - minL) / (maxL - minL || 1)));
    // single-hue sequential ramp (teal): dark → bright
    return [10 + s * 35, 19 + s * 190, 38 + s * 150];
  };
  const visible = path.filter((m) => Number.isFinite(m.w) && Math.abs(m.w) < 100 && Math.abs(m.b) < 100);
  return (
    <Plot2D domain={W_DOM} width={460} height={330} xLabel={t(['w (slope)', 'w (الميل)'])} yLabel={t(['b (intercept)', 'b (المقطع)'])} ariaLabel={t(['Contour map of the loss over slope and intercept', 'خريطة كنتورية للخسارة بدلالة الميل والمقطع'])}>
      {points.length >= 2 && <Heatmap fn={color} res={64} version={version} />}
      {points.length >= 2 && [0.25, 0.5, 0.75].map((q) => <Contour key={q} fn={(w, b) => Math.log1p(lineMSE(points, { w, b }))} level={minL + q * (maxL - minL)} version={version} stroke="rgba(255,255,255,.35)" width={1} res={50} />)}
      <SurfacePath path={visible} />
      {ols && <SurfaceMarker m={ols} />}
    </Plot2D>
  );
}

function SurfacePath({ path }: { path: LineModel[] }) {
  const { sx, sy } = usePlot();
  if (path.length === 0) return null;
  const stride = Math.max(1, Math.floor(path.length / 150));
  const pts = path.filter((_, i) => i % stride === 0 || i === path.length - 1);
  const d = pts.map((m, i) => `${i ? 'L' : 'M'}${sx(m.w).toFixed(1)},${sy(m.b).toFixed(1)}`).join('');
  const last = path[path.length - 1];
  return (
    <g pointerEvents="none">
      <path d={d} fill="none" stroke="var(--c-warn)" strokeWidth={2} />
      {pts.map((m, i) => (
        <circle key={i} cx={sx(m.w)} cy={sy(m.b)} r={2} fill="var(--c-warn)" />
      ))}
      <circle cx={sx(last.w)} cy={sy(last.b)} r={6} fill="var(--c-warn)" stroke="var(--c-plot)" strokeWidth={2} />
    </g>
  );
}

function SurfaceMarker({ m }: { m: LineModel }) {
  const { sx, sy } = usePlot();
  const x = sx(m.w);
  const y = sy(m.b);
  return (
    <g stroke="#fff" strokeWidth={2.5} pointerEvents="none">
      <line x1={x - 6} x2={x + 6} y1={y - 6} y2={y + 6} />
      <line x1={x - 6} x2={x + 6} y1={y + 6} y2={y - 6} />
    </g>
  );
}
