import { useEffect, useMemo, useState } from 'react';
import { CurvePath, DataLine, EditablePoints, Plot2D, usePlot, type EditMode } from '@/components/charts/Plot2D';
import { BarChart } from '@/components/charts/BarChart';
import { Button, Callout, Segmented, Slider, Stat, Toggle } from '@/components/ui/primitives';
import { TeX } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { fitPCA, pcaInverse, pcaTransform, reconstructionError, sampleCorrelated, varianceAlong, type PCAResult } from '@/lib/ml/pca';
import { columnMeans, columnStds } from '@/lib/ml/linalg';
import { nextId, type Domain } from '@/lib/ml/types';
import { Hint, LabShell, ModePicker, Panel, StatGrid, type LabProps } from './shared/LabUI';
import { labEvent, usePointSet } from './shared/hooks';

const DOM: Domain = { xMin: -6, xMax: 6, yMin: -6, yMax: 6 };
const LIMIT = 250;
interface Pt {
  id: string;
  x: number;
  y: number;
}

function gen2D(rho: number, s1: number, s2: number, n: number, seed: number): Pt[] {
  const X = sampleCorrelated(n, [0, 0], [s1, s2], [[1, rho], [rho, 1]], seed) ?? [];
  return X.map(([x, y]) => ({ id: nextId('pc'), x, y }));
}

export default function PcaLab({ presentation }: LabProps) {
  const { t } = useI18n();
  const [dim, setDim] = useState<'2d' | '3d'>('2d');
  return (
    <div className="space-y-3">
      <div className="max-w-sm">
        <Segmented
          label={t(['Original dimensionality', 'الأبعاد الأصلية'])}
          value={dim}
          onChange={setDim}
          size="sm"
          options={[
            { value: '2d', label: t(['2 features → 1', 'خاصيتان ← 1']) },
            { value: '3d', label: t(['3 features → 2', '3 خصائص ← 2']) },
          ]}
        />
      </div>
      {dim === '2d' ? <Pca2D presentation={presentation} /> : <Pca3D presentation={presentation} />}
    </div>
  );
}

function Pca2D({ presentation }: LabProps) {
  const { t, num } = useI18n();
  const [rho, setRho] = useState(0.8);
  const [s1, setS1] = useState(2);
  const [s2, setS2] = useState(1.2);
  const [n, setN] = useState(80);
  const [seed, setSeed] = useState(3);
  const ps = usePointSet<Pt>(() => gen2D(0.8, 2, 1.2, 80, 3), LIMIT);
  const [mode, setMode] = useState<EditMode>('move');
  const [standardize, setStandardize] = useState(false);
  const [angle, setAngle] = useState(0);
  const [showManual, setShowManual] = useState(true);
  const [k, setK] = useState<1 | 2>(1);
  const [showRecon, setShowRecon] = useState(true);
  const points = ps.points;
  const regen = (r = rho, a = s1, b = s2, nn = n, sd = seed) => ps.setPoints(gen2D(r, a, b, nn, sd));

  // Analysis space: raw (centred for display) or standardized.
  const X = useMemo(() => points.map((p) => [p.x, p.y]), [points]);
  const pca = useMemo<PCAResult | null>(() => (X.length >= 3 ? fitPCA(X, standardize) : null), [X, standardize]);
  useEffect(() => {
    if (pca) labEvent('pca', 'computed');
  }, [pca]);
  const Z = useMemo(() => (pca ? X.map((r) => r.map((v, j) => (v - pca.mean[j]) / pca.scale[j])) : []), [X, pca]);
  const zPts = Z.map((z, i) => ({ id: points[i].id, x: z[0], y: z[1] }));
  const dir = [Math.cos((angle * Math.PI) / 180), Math.sin((angle * Math.PI) / 180)];
  const manualVar = Z.length > 1 ? varianceAlong(Z, dir) : 0;
  const totalVar = pca ? pca.explainedVariance.reduce((a, b) => a + b, 0) : 0;
  const recon = pca ? pcaInverse(pca, pcaTransform(pca, X, k)).map((r) => r.map((v, j) => (v - pca.mean[j]) / pca.scale[j])) : [];
  const err = pca ? reconstructionError(pca, X, k) : 0;
  const scores = pca ? pcaTransform(pca, X, 1).map((s) => s[0]) : [];
  const pc1Angle = pca ? (Math.atan2(pca.components[0][1], pca.components[0][0]) * 180) / Math.PI : 0;
  const snap = () => setAngle(Math.round(((pc1Angle % 180) + 180) % 180));

  return (
    <LabShell
      presentation={presentation}
      viz={
        <>
          <Plot2D
            domain={DOM}
            xLabel={standardize ? t(['x₁ (standardized)', 'x₁ (موحّدة قياسيًا)']) : t(['x₁ (centred)', 'x₁ (بعد التمركز)'])}
            yLabel={standardize ? t(['x₂ (standardized)', 'x₂ (موحّدة قياسيًا)']) : t(['x₂ (centred)', 'x₂ (بعد التمركز)'])}
            ariaLabel={t(['Data with principal component directions and a manual projection axis', 'البيانات مع اتجاهات المكونات الرئيسية ومحور إسقاط يدوي'])}
            onBackgroundPointer={
              mode === 'add' && pca
                ? (x, y) => ps.add({ x: x * pca.scale[0] + pca.mean[0], y: y * pca.scale[1] + pca.mean[1] })
                : undefined
            }
          >
            {showManual && <AxisLine dir={dir} color="var(--c-warn)" dash="7 5" width={2} />}
            {showManual && zPts.map((p) => {
              const s = p.x * dir[0] + p.y * dir[1];
              return <DataLine key={`m${p.id}`} x1={p.x} y1={p.y} x2={s * dir[0]} y2={s * dir[1]} stroke="var(--c-warn)" strokeWidth={0.8} opacity={0.45} />;
            })}
            {pca && showRecon && k === 1 && zPts.map((p, i) => <DataLine key={`r${p.id}`} x1={p.x} y1={p.y} x2={recon[i][0]} y2={recon[i][1]} stroke="var(--c-purple)" strokeWidth={1} opacity={0.6} />)}
            {pca && <AxisLine dir={pca.components[0]} color="var(--c-accent)" width={1} opacity={0.35} />}
            <EditablePoints
              points={zPts}
              mode={mode === 'add' ? 'none' : mode}
              onMove={(id, x, y) => pca && ps.move(id, x * pca.scale[0] + pca.mean[0], y * pca.scale[1] + pca.mean[1])}
              onRemove={ps.remove}
              colorOf={() => 'var(--c-cyan)'}
              shapeOf={() => 0}
              radius={4.5}
            />
            {pca && showRecon && k === 1 && recon.map((r, i) => <ReconDot key={i} x={r[0]} y={r[1]} />)}
            {pca && pca.components.map((c, i) => <Arrow key={i} v={c} len={2 * Math.sqrt(pca.explainedVariance[i])} color={i === 0 ? 'var(--c-accent)' : 'var(--c-purple)'} label={`PC${i + 1}`} />)}
          </Plot2D>
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 pt-1 text-xs text-muted">
            <span>
              <b className="text-accent">━ PC1</b> / <b className="text-purple">━ PC2</b>: {t(['computed eigenvectors (length = 2·√eigenvalue)', 'المتجهات الذاتية المحسوبة (الطول = 2·√القيمة الذاتية)'])}
            </span>
            {showManual && <span className="text-warn">┅ {t(['your manual axis — a demonstration, not a computed component', 'محورك اليدوي — للتوضيح فقط، وليس مكوّنًا محسوبًا'])}</span>}
            {showRecon && k === 1 && <span className="text-purple">● {t(['reconstruction from PC1 only', 'إعادة البناء من PC1 فقط'])}</span>}
          </div>
          <Hint>{t(['Drag points to change the data — principal components are recomputed instantly from the covariance matrix.', 'اسحب النقاط لتغيير البيانات — تُعاد حساب المكونات الرئيسية فورًا من مصفوفة التغاير.'])}</Hint>
        </>
      }
      status={
        pca && (
          <>
            <StatGrid>
              <Stat label={t(['PC1 explained variance', 'التباين المفسَّر لـ PC1'])} value={`${num(pca.explainedVarianceRatio[0] * 100, 1)}%`} tone="accent" />
              <Stat label={t(['Variance on manual axis', 'التباين على المحور اليدوي'])} value={`${num((manualVar / (totalVar || 1)) * 100, 1)}%`} tone={showManual ? 'warn' : undefined} />
              <Stat label={t(['Kept components', 'المكونات المحتفظ بها'])} value={`${k} / 2`} />
              <Stat label={t(['Reconstruction MSE', 'خطأ إعادة البناء MSE'])} value={num(err, 4)} sub={k === 2 ? t(['no information lost', 'لا فقدان للمعلومات']) : undefined} />
            </StatGrid>
            {showManual && Math.abs(manualVar - pca.explainedVariance[0]) < 1e-3 * totalVar && <Callout tone="tip">{t(['Your axis now matches PC1 — no direction captures more variance than this one.', 'محورك يطابق الآن PC1 — لا يوجد اتجاه يلتقط تباينًا أكبر من هذا.'])}</Callout>}
          </>
        )
      }
      below={
        pca && (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title={t(['The mathematics on this data', 'الرياضيات على هذه البيانات'])}>
              <TeX display tex={`\\Sigma = \\begin{pmatrix} ${num(pca.covariance[0][0], 3)} & ${num(pca.covariance[0][1], 3)} \\\\ ${num(pca.covariance[1][0], 3)} & ${num(pca.covariance[1][1], 3)} \\end{pmatrix}`} />
              <TeX display tex={`\\lambda_1 = ${num(pca.explainedVariance[0], 3)},\; \\mathbf{v}_1 = (${num(pca.components[0][0], 3)}, ${num(pca.components[0][1], 3)})`} />
              <TeX display tex={`\\lambda_2 = ${num(pca.explainedVariance[1], 3)},\; \\mathbf{v}_2 = (${num(pca.components[1][0], 3)}, ${num(pca.components[1][1], 3)})`} />
              <p className="text-xs text-muted">{t(['Σv = λv: each principal component is an eigenvector of the covariance matrix and its eigenvalue is the variance along it.', 'Σv = λv: كل مكوّن رئيسي متجه ذاتي لمصفوفة التغاير، وقيمته الذاتية هي التباين على امتداده.'])}</p>
            </Panel>
            <Panel title={t(['Explained variance ratio', 'نسبة التباين المفسَّر'])}>
              <BarChart ariaLabel={t(['Explained variance per component', 'التباين المفسَّر لكل مكوّن'])} bars={pca.explainedVarianceRatio.map((r, i) => ({ label: `PC${i + 1}`, value: r, color: i === 0 ? 'var(--c-accent)' : 'var(--c-purple)', highlight: i < k }))} yMax={1} format={(v) => `${(v * 100).toFixed(1)}%`} />
            </Panel>
            <Panel title={t(['1-D projection: the new feature (PC1 score)', 'الإسقاط أحادي البُعد: الخاصية الجديدة (درجة PC1)'])} className="md:col-span-2">
              <Strip values={scores} />
              <p className="text-xs text-muted">{t(['Each point is now described by one number instead of two. The spread kept here is exactly λ₁; the remaining λ₂ is the information lost.', 'كل نقطة موصوفة الآن برقم واحد بدل رقمين. الانتشار المحفوظ هنا يساوي λ₁ تمامًا، وλ₂ المتبقية هي المعلومات المفقودة.'])}</p>
            </Panel>
          </div>
        )
      }
      controls={
        <>
          <Panel title={t(['Projection', 'الإسقاط'])}>
            <Toggle label={t(['Show manual axis', 'إظهار المحور اليدوي'])} checked={showManual} onChange={setShowManual} />
            <Slider label={t(['Manual axis angle', 'زاوية المحور اليدوي'])} value={angle} min={0} max={179} onChange={(v) => { setAngle(v); labEvent('pca', 'rotated'); }} format={(v) => `${v}°`} disabled={!showManual} />
            <Button size="sm" onClick={snap} disabled={!showManual || !pca}>
              {t(['Snap to PC1', 'طابِق PC1'])}
            </Button>
            <Segmented label={t(['Components kept (k)', 'المكونات المحتفظ بها (k)'])} value={k} onChange={setK} size="sm" options={[{ value: 1, label: '1' }, { value: 2, label: '2' }]} />
            <Toggle label={t(['Show reconstruction', 'إظهار إعادة البناء'])} checked={showRecon} onChange={setShowRecon} />
            <Toggle label={t(['Standardize features first', 'توحيد الخصائص قياسيًا أولًا'])} checked={standardize} onChange={setStandardize} hint={t(['PCA on the correlation matrix: features with large units no longer dominate.', 'PCA على مصفوفة الارتباط: لا تعود الخصائص ذات الوحدات الكبيرة مهيمنة.'])} />
          </Panel>
          <Panel title={t(['Generate correlated data', 'توليد بيانات مترابطة'])}>
            <Slider label={t(['Correlation ρ', 'معامل الارتباط ρ'])} value={rho} min={-0.95} max={0.95} step={0.05} onChange={(v) => { setRho(v); regen(v); }} format={(v) => v.toFixed(2)} />
            <Slider label={t(['Spread of x₁ (σ₁)', 'انتشار x₁ (σ₁)'])} value={s1} min={0.3} max={3} step={0.1} onChange={(v) => { setS1(v); regen(rho, v); }} format={(v) => v.toFixed(1)} />
            <Slider label={t(['Spread of x₂ (σ₂)', 'انتشار x₂ (σ₂)'])} value={s2} min={0.3} max={3} step={0.1} onChange={(v) => { setS2(v); regen(rho, s1, v); }} format={(v) => v.toFixed(1)} />
            <Slider label={t(C.samples)} value={n} min={10} max={200} onChange={(v) => { setN(v); regen(rho, s1, s2, v); }} />
            <Slider label={t(C.seed)} value={seed} min={1} max={99} onChange={(v) => { setSeed(v); regen(rho, s1, s2, n, v); }} />
            <ModePicker mode={mode} onMode={setMode} />
            <p className="text-[11px] text-subtle ltr font-mono">{points.length}/{LIMIT}</p>
          </Panel>
        </>
      }
    />
  );
}

function AxisLine({ dir, color, dash, width = 2, opacity = 1 }: { dir: readonly number[]; color: string; dash?: string; width?: number; opacity?: number }) {
  return <CurvePath pts={[[-10 * dir[0], -10 * dir[1]], [10 * dir[0], 10 * dir[1]]]} stroke={color} dash={dash} width={width} opacity={opacity} />;
}

function Arrow({ v, len, color, label }: { v: readonly number[]; len: number; color: string; label: string }) {
  const { sx, sy } = usePlot();
  const x2 = sx(v[0] * len);
  const y2 = sy(v[1] * len);
  const x1 = sx(0);
  const y1 = sy(0);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h = 11;
  return (
    <g pointerEvents="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${x2 - h * Math.cos(ang - 0.4)},${y2 - h * Math.sin(ang - 0.4)} ${x2 - h * Math.cos(ang + 0.4)},${y2 - h * Math.sin(ang + 0.4)}`} fill={color} />
      <text x={x2 + 8 * Math.cos(ang)} y={y2 + 8 * Math.sin(ang) + 4} fontSize={13} fontWeight={700} fill={color} textAnchor={Math.cos(ang) >= 0 ? 'start' : 'end'}>
        {label}
      </text>
    </g>
  );
}

function ReconDot({ x, y }: { x: number; y: number }) {
  const { sx, sy } = usePlot();
  return <circle cx={sx(x)} cy={sy(y)} r={2.6} fill="var(--c-purple)" pointerEvents="none" />;
}

function Strip({ values }: { values: number[] }) {
  const max = Math.max(1, ...values.map(Math.abs)) * 1.1;
  return (
    <svg viewBox="0 0 560 60" className="block w-full" role="img" aria-label="PC1 scores" style={{ direction: 'ltr' }}>
      <line x1={20} x2={540} y1={30} y2={30} stroke="var(--c-axis)" />
      {values.map((v, i) => (
        <circle key={i} cx={280 + (v / max) * 260} cy={30} r={4} fill="var(--c-accent)" opacity={0.55} />
      ))}
      <text x={540} y={52} textAnchor="end" fontSize={11} fill="var(--c-muted)">
        PC1 →
      </text>
    </svg>
  );
}

/* --------------------------------- 3-D mode --------------------------------- */

function Pca3D({ presentation }: LabProps) {
  const { t, num } = useI18n();
  const [r12, setR12] = useState(0.8);
  const [r13, setR13] = useState(0.5);
  const [r23, setR23] = useState(0.3);
  const [s3, setS3] = useState(0.6);
  const [seed, setSeed] = useState(4);
  const [az, setAz] = useState(35);
  const [el, setEl] = useState(20);
  const [k, setK] = useState(2);
  const [standardize, setStandardize] = useState(false);
  const X = useMemo(() => sampleCorrelated(120, [0, 0, 0], [2, 1.5, s3], [[1, r12, r13], [r12, 1, r23], [r13, r23, 1]], seed), [r12, r13, r23, s3, seed]);
  const pca = useMemo(() => (X ? fitPCA(X, standardize) : null), [X, standardize]);
  useEffect(() => {
    if (pca) labEvent('pca', 'computed-3d');
  }, [pca]);
  const scores = pca && X ? pcaTransform(pca, X, 2) : [];
  const cum = pca ? pca.explainedVarianceRatio.slice(0, k).reduce((a, b) => a + b, 0) : 0;
  const err = pca && X ? reconstructionError(pca, X, k) : 0;
  const Zs = useMemo(() => {
    if (!X || !pca) return [];
    return X.map((r) => r.map((v, j) => (v - pca.mean[j]) / pca.scale[j]));
  }, [X, pca]);
  const stds = X ? columnStds(X, columnMeans(X)) : [];
  return (
    <LabShell
      presentation={presentation}
      viz={
        !X || !pca ? (
          <Callout tone="danger" title={t(['Impossible correlations', 'ارتباطات مستحيلة'])}>
            {t(['These three correlations cannot all hold at once (the correlation matrix is not positive definite). For example, if x₁~x₂ and x₁~x₃ are both strongly positive, x₂ and x₃ cannot be strongly negative. Adjust a slider.', 'لا يمكن أن تتحقق هذه الارتباطات الثلاثة معًا (مصفوفة الارتباط ليست موجبة التعريف). مثلًا إذا كان x₁~x₂ وx₁~x₃ موجبين بقوة فلا يمكن أن يكون x₂ وx₃ سالبين بقوة. عدّل أحد المنزلقات.'])}
          </Callout>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="px-2 pb-1 text-sm font-semibold text-ink">{t(['Original 3-D data (rotate with the sliders)', 'البيانات الأصلية ثلاثية الأبعاد (دوّرها بالمنزلقات)'])}</div>
              <Scatter3D pts={Zs} pca={pca} az={az} el={el} />
            </div>
            <div>
              <div className="px-2 pb-1 text-sm font-semibold text-ink">{t(['Projected onto PC1 & PC2', 'مُسقطة على PC1 وPC2'])}</div>
              <Plot2D domain={{ xMin: -6, xMax: 6, yMin: -6, yMax: 6 }} xLabel="PC1" yLabel="PC2" ariaLabel={t(['Data in principal component coordinates', 'البيانات بإحداثيات المكونات الرئيسية'])}>
                {scores.map((s, i) => (
                  <ScoreDot key={i} x={s[0]} y={s[1]} />
                ))}
              </Plot2D>
            </div>
          </div>
        )
      }
      status={
        pca && (
          <StatGrid>
            {pca.explainedVarianceRatio.map((r, i) => (
              <Stat key={i} label={`PC${i + 1}`} value={`${num(r * 100, 1)}%`} tone={i < k ? 'accent' : undefined} />
            ))}
            <Stat label={t(['Kept / lost (k = ', 'المحفوظ / المفقود (k = ']) + k + ')'} value={`${num(cum * 100, 1)}% / ${num((1 - cum) * 100, 1)}%`} sub={`MSE ${num(err, 4)}`} />
          </StatGrid>
        )
      }
      below={
        pca && (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title={t(['Explained variance (bars) and cumulative', 'التباين المفسَّر (الأعمدة) والتراكمي'])}>
              <BarChart
                ariaLabel={t(['Explained variance ratio per component', 'نسبة التباين المفسَّر لكل مكوّن'])}
                bars={pca.explainedVarianceRatio.map((r, i) => ({ label: `PC${i + 1}`, value: r, color: i < k ? 'var(--c-accent)' : 'var(--c-subtle)', marker: pca.explainedVarianceRatio.slice(0, i + 1).reduce((a, b) => a + b, 0) }))}
                yMax={1}
                markerLabel={t(['cumulative', 'تراكمي'])}
                format={(v) => `${(v * 100).toFixed(0)}%`}
              />
            </Panel>
            <Panel title={t(['Covariance matrix and components', 'مصفوفة التغاير والمكونات'])}>
              <TeX display tex={`\\Sigma=\\begin{pmatrix}${pca.covariance.map((r) => r.map((v) => num(v, 2)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`} />
              {pca.components.map((c, i) => (
                <TeX key={i} display tex={`\\lambda_${i + 1} = ${num(pca.explainedVariance[i], 3)},\; \\mathbf{v}_${i + 1} = (${c.map((v) => num(v, 3)).join(', ')})`} />
              ))}
              <p className="text-xs text-muted ltr font-mono">sample σ = ({stds.map((s) => num(s, 2)).join(', ')})</p>
            </Panel>
          </div>
        )
      }
      controls={
        <>
          <Panel title={t(['View & projection', 'العرض والإسقاط'])}>
            <Slider label={t(['Rotate (azimuth)', 'التدوير (السمت)'])} value={az} min={0} max={359} onChange={setAz} format={(v) => `${v}°`} />
            <Slider label={t(['Tilt (elevation)', 'الإمالة (الارتفاع)'])} value={el} min={-80} max={80} onChange={setEl} format={(v) => `${v}°`} />
            <Segmented label={t(['Components kept (k)', 'المكونات المحتفظ بها (k)'])} value={k} onChange={setK} size="sm" options={[1, 2, 3].map((v) => ({ value: v, label: String(v) }))} />
            <Toggle label={t(['Standardize features first', 'توحيد الخصائص قياسيًا أولًا'])} checked={standardize} onChange={setStandardize} />
          </Panel>
          <Panel title={t(['Relationships between features', 'العلاقات بين الخصائص'])}>
            <Slider label="ρ(x₁, x₂)" value={r12} min={-0.95} max={0.95} step={0.05} onChange={setR12} format={(v) => v.toFixed(2)} />
            <Slider label="ρ(x₁, x₃)" value={r13} min={-0.95} max={0.95} step={0.05} onChange={setR13} format={(v) => v.toFixed(2)} />
            <Slider label="ρ(x₂, x₃)" value={r23} min={-0.95} max={0.95} step={0.05} onChange={setR23} format={(v) => v.toFixed(2)} />
            <Slider label={t(['Spread of x₃ (σ₃)', 'انتشار x₃ (σ₃)'])} value={s3} min={0.2} max={3} step={0.1} onChange={setS3} format={(v) => v.toFixed(1)} />
            <Slider label={t(C.seed)} value={seed} min={1} max={99} onChange={setSeed} />
          </Panel>
        </>
      }
    />
  );
}

function ScoreDot({ x, y }: { x: number; y: number }) {
  const { sx, sy } = usePlot();
  return <circle cx={sx(x)} cy={sy(y)} r={4} fill="var(--c-cyan)" opacity={0.85} />;
}

function Scatter3D({ pts, pca, az, el }: { pts: number[][]; pca: PCAResult; az: number; el: number }) {
  const W = 560;
  const H = 420;
  const a = (az * Math.PI) / 180;
  const e = (el * Math.PI) / 180;
  const S = 38;
  const proj = (p: readonly number[]) => {
    const x1 = p[0] * Math.cos(a) - p[1] * Math.sin(a);
    const y1 = p[0] * Math.sin(a) + p[1] * Math.cos(a);
    const z1 = p[2];
    const y2 = y1 * Math.cos(e) - z1 * Math.sin(e);
    const depth = y1 * Math.sin(e) + z1 * Math.cos(e);
    return { x: W / 2 + x1 * S, y: H / 2 - depth * S, d: y2 };
  };
  const axes: [number[], string][] = [
    [[5, 0, 0], 'x₁'],
    [[0, 5, 0], 'x₂'],
    [[0, 0, 5], 'x₃'],
  ];
  const sorted = pts.map((p) => proj(p)).sort((p, q) => q.d - p.d);
  const o = proj([0, 0, 0]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-xl" style={{ background: 'var(--c-plot)', direction: 'ltr' }} role="img" aria-label="3-D scatter plot">
      {axes.map(([v, l]) => {
        const q = proj(v);
        const qn = proj(v.map((x) => -x));
        return (
          <g key={l}>
            <line x1={qn.x} y1={qn.y} x2={q.x} y2={q.y} stroke="var(--c-axis)" strokeWidth={1} />
            <text x={q.x} y={q.y - 4} fontSize={12} fill="var(--c-muted)">
              {l}
            </text>
          </g>
        );
      })}
      {sorted.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.6} fill="var(--c-cyan)" opacity={0.75} />
      ))}
      {pca.components.map((c, i) => {
        const L = 2 * Math.sqrt(pca.explainedVariance[i]);
        const q = proj(c.map((v) => v * L));
        const col = ['var(--c-accent)', 'var(--c-purple)', 'var(--c-warn)'][i];
        return (
          <g key={i}>
            <line x1={o.x} y1={o.y} x2={q.x} y2={q.y} stroke={col} strokeWidth={4} strokeLinecap="round" />
            <text x={q.x + 5} y={q.y - 5} fontSize={13} fontWeight={700} fill={col}>
              PC{i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
