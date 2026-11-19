import { useMemo, useRef, useState } from 'react';
import { Dices, Eye, EyeOff, Target } from 'lucide-react';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { Button, Callout, Select, Slider, Stat, Toggle, cx } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { BANDIT_PRESETS, createAgent, optimalArm, pullArm, selectArm, simulate, updateAgent, type AgentState } from '@/lib/ml/bandit';
import { mulberry32, type RNG } from '@/lib/ml/random';
import { LabShell, Panel, PlayControls, StatGrid, type LabProps } from './shared/LabUI';
import { labEvent, useLoop, usePresenterKeys } from './shared/hooks';

interface Pull {
  arm: number;
  reward: number;
  explored: boolean;
}
const COMPARE_EPS = [0, 0.01, 0.1, 0.3, 1];
const COMPARE_COLORS = ['var(--c-danger)', 'var(--c-class-1)', 'var(--c-accent)', 'var(--c-purple)', 'var(--c-subtle)'];
const MAX_STEPS = 2000;

export default function BanditLab({ presentation, preset }: LabProps) {
  const { t, num } = useI18n();
  const [envId, setEnvId] = useState(preset ?? 'hidden');
  const env = BANDIT_PRESETS[envId] ?? BANDIT_PRESETS.hidden;
  const k = env.means.length;
  const [epsilon, setEpsilon] = useState(0.1);
  const [seed, setSeed] = useState(1);
  const rng = useRef<RNG>(mulberry32(1));
  const [agent, setAgent] = useState<AgentState>(() => createAgent(k));
  const [history, setHistory] = useState<Pull[]>([]);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [reveal, setReveal] = useState(false);
  const [compare, setCompare] = useState<{ eps: number; avg: number[]; opt: number[] }[] | null>(null);
  const best = optimalArm(env);

  const reset = (s = seed) => {
    setRunning(false);
    rng.current = mulberry32(s);
    setAgent(createAgent(k));
    setHistory([]);
  };
  const pull = (n: number) => {
    let a = agent;
    const h: Pull[] = [];
    for (let i = 0; i < n && a.steps < MAX_STEPS; i++) {
      const { arm, explored } = selectArm(a, epsilon, rng.current);
      const reward = pullArm(env, arm, rng.current);
      a = updateAgent(a, arm, reward);
      h.push({ arm, reward, explored });
    }
    if (a.steps >= MAX_STEPS) setRunning(false);
    setAgent(a);
    setHistory((old) => [...old, ...h]);
    labEvent('bandit', 'pulled');
    if (a.steps >= 200) labEvent('bandit', 'ran-200');
  };
  useLoop(running, () => pull(speed), 90);
  usePresenterKeys(!!presentation, { toggle: () => setRunning((r) => !r), step: () => pull(1), reset: () => reset() });

  const series = useMemo(() => {
    let cum = 0;
    let optCount = 0;
    const cumR: number[] = [];
    const cumOpt: number[] = [];
    const pctOpt: number[] = [];
    history.forEach((p, i) => {
      cum += p.reward;
      if (p.arm === best) optCount++;
      cumR.push(cum);
      cumOpt.push(env.means[best] * (i + 1));
      pctOpt.push(optCount / (i + 1));
    });
    return { cumR, cumOpt, pctOpt };
  }, [history, best, env]);
  const explored = history.filter((p) => p.explored).length;
  const last = history[history.length - 1];
  const regret = history.length ? series.cumOpt[series.cumOpt.length - 1] - series.cumR[series.cumR.length - 1] : 0;
  const expectedRegret = history.reduce((s, p) => s + (env.means[best] - env.means[p.arm]), 0);

  const runCompare = () => {
    setCompare(COMPARE_EPS.map((e) => {
      const r = simulate(env, e, 500, 200, 99);
      return { eps: e, avg: r.avgReward, opt: r.optimalPct };
    }));
    labEvent('bandit', 'compared');
  };

  return (
    <LabShell
      presentation={presentation}
      viz={
        <>
          <div className="grid gap-2 p-1 sm:p-2" style={{ gridTemplateColumns: `repeat(${k}, minmax(0, 1fr))` }}>
            {env.means.map((m, i) => {
              const isLast = last?.arm === i;
              const greedyNow = agent.estimates[i] === Math.max(...agent.estimates) && agent.steps > 0;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    // Manual pull: the learner still updates from the real sampled reward.
                    const reward = pullArm(env, i, rng.current);
                    setAgent((a) => updateAgent(a, i, reward));
                    setHistory((h) => [...h, { arm: i, reward, explored: true }]);
                  }}
                  className={cx('relative rounded-2xl border p-2 sm:p-3 text-center transition-all', isLast ? 'border-accent shadow-[0_0_0_3px_rgba(45,212,191,.25)] -translate-y-0.5' : 'border-line', 'bg-surface-2/60 hover:border-accent/50')}
                  aria-label={`${t(['Arm', 'الذراع'])} ${i + 1}`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{t(['Arm', 'الذراع'])} {i + 1}</div>
                  <div className="my-1 text-2xl sm:text-3xl" aria-hidden>🎰</div>
                  <div className="text-[10px] text-subtle">{t(['estimate Q', 'التقدير Q'])}</div>
                  <div className="ltr font-mono text-base sm:text-lg font-semibold text-ink">{agent.counts[i] ? num(agent.estimates[i], 2) : '—'}</div>
                  <div className="ltr font-mono text-[11px] text-muted">N = {agent.counts[i]}</div>
                  {reveal && (
                    <div className={cx('mt-1 rounded-md px-1 py-0.5 text-[10px] ltr font-mono', i === best ? 'bg-success/15 text-success' : 'bg-surface text-muted')}>
                      μ = {m.toFixed(1)} {i === best && '★'}
                    </div>
                  )}
                  {greedyNow && <span className="absolute -top-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-accent px-1.5 text-[9px] font-bold text-[#04201d]">{t(['GREEDY', 'الأفضل حاليًا'])}</span>}
                  {isLast && (
                    <div className={cx('mt-1 text-[10px] font-semibold', last.explored ? 'text-purple' : 'text-accent')}>
                      {last.explored ? t(['explore', 'استكشاف']) : t(['exploit', 'استغلال'])} · <span className="ltr font-mono">{last.reward >= 0 ? '+' : ''}{last.reward.toFixed(2)}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="px-2 pt-2">
            <div className="mb-1 text-xs text-muted">{t(['Last 60 decisions (number = arm)', 'آخر 60 قرارًا (الرقم = الذراع)'])}</div>
            <div className="flex flex-wrap gap-1" aria-label={t(['Recent decisions', 'القرارات الأخيرة'])}>
              {history.slice(-60).map((p, i) => (
                <span key={i} title={p.explored ? 'explore' : 'exploit'} className={cx('inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-mono font-bold', p.explored ? 'bg-purple/25 text-purple ring-1 ring-purple/50' : 'bg-accent/20 text-accent-ink')}>
                  {p.arm + 1}
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-accent/30" /> {t(['exploit (greedy)', 'استغلال (جشع)'])}</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-purple/30 ring-1 ring-purple/50" /> {t(['explore (random)', 'استكشاف (عشوائي)'])}</span>
            </div>
            <p className="mt-2 text-xs text-subtle">{t(['Tip: click an arm to pull it yourself. Rewards are noisy samples around a hidden mean.', 'تلميح: انقر على أي ذراع لسحبها بنفسك. المكافآت عينات عشوائية حول متوسط مخفي.'])}</p>
          </div>
        </>
      }
      status={
        <>
          <StatGrid>
            <Stat label={t(['Pulls', 'السحبات'])} value={agent.steps} />
            <Stat label={t(['Total reward', 'إجمالي المكافأة'])} value={num(agent.totalReward, 1)} tone="accent" />
            <Stat label={t(['Explored / exploited', 'استكشاف / استغلال'])} value={`${explored} / ${history.length - explored}`} />
            <Stat label={t(['Best arm chosen', 'اختيار الذراع الأفضل'])} value={history.length ? `${num(series.pctOpt[series.pctOpt.length - 1] * 100, 0)}%` : '—'} sub={t(['expected regret', 'الندم المتوقع']) + ` ${num(expectedRegret, 1)}`} />
          </StatGrid>
          {epsilon === 0 && agent.steps > 30 && agent.estimates.indexOf(Math.max(...agent.estimates)) !== best && (
            <Callout tone="warn" title={t(['Stuck exploiting', 'عالق في الاستغلال'])}>
              {t(['With ε = 0 the agent always repeats the arm that looked best early on. It never tries the others again, so it may never discover the truly best arm.', 'مع ε = 0 يكرر الوكيل دائمًا الذراع التي بدت الأفضل في البداية. لا يجرّب البقية مجددًا، فقد لا يكتشف الذراع الأفضل حقًا أبدًا.'])}
            </Callout>
          )}
          {epsilon >= 0.9 && agent.steps > 30 && (
            <Callout tone="info" title={t(['Always exploring', 'استكشاف دائم'])}>
              {t(['With ε close to 1 the agent learns accurate estimates for every arm, but keeps choosing randomly — it rarely uses what it has learned, so its total reward stays low.', 'عندما تقترب ε من 1 يتعلّم الوكيل تقديرات دقيقة لكل ذراع، لكنه يستمر في الاختيار العشوائي — فنادرًا ما يستفيد مما تعلّمه، ويبقى مجموع مكافآته منخفضًا.'])}
            </Callout>
          )}
        </>
      }
      below={
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={t(['Cumulative reward vs. always picking the best arm', 'المكافأة التراكمية مقابل اختيار الذراع الأفضل دائمًا'])}>
            <LineChart
              ariaLabel={t(['Cumulative reward over time', 'المكافأة التراكمية عبر الزمن'])}
              series={[
                { id: 'opt', label: t(['optimal (expected)', 'الأمثل (المتوقع)']), values: series.cumOpt, color: 'var(--c-subtle)', dashed: true },
                { id: 'cum', label: t(['agent', 'الوكيل']), values: series.cumR, color: 'var(--c-accent)' },
              ]}
              xStart={1}
              xLabel={t(['pull', 'السحبة'])}
              emptyText={t(['Press Play to start pulling arms', 'اضغط تشغيل لبدء سحب الأذرع'])}
            />
            <p className="text-xs text-muted">{t(['The gap between the lines is the regret: reward lost by not knowing the best arm in advance. Realised gap now:', 'الفجوة بين الخطين هي الندم: المكافأة المفقودة لعدم معرفة الذراع الأفضل مسبقًا. الفجوة الفعلية الآن:'])} <span className="ltr font-mono">{num(regret, 1)}</span></p>
          </Panel>
          <Panel title={t(['How often each arm was chosen', 'عدد مرات اختيار كل ذراع'])}>
            <BarChart ariaLabel={t(['Pull counts per arm', 'عدد السحبات لكل ذراع'])} bars={agent.counts.map((c, i) => ({ label: `${i + 1}`, value: c, color: i === best && reveal ? 'var(--c-success)' : 'var(--c-accent)' }))} format={(v) => v.toFixed(0)} />
          </Panel>
          <Panel title={t(['Estimated vs true value per arm', 'القيمة المقدَّرة مقابل الحقيقية لكل ذراع'])} className="md:col-span-2">
            <BarChart ariaLabel={t(['Estimated action values', 'قيم الإجراءات المقدَّرة'])} bars={agent.estimates.map((q, i) => ({ label: `${t(['Arm', 'الذراع'])} ${i + 1}`, value: q, color: 'var(--c-purple)', marker: reveal ? env.means[i] : undefined }))} markerLabel={t(['true mean', 'المتوسط الحقيقي'])} yMin={Math.min(0, ...agent.estimates)} />
            {!reveal && <p className="text-xs text-subtle">{t(['Reveal the true means to compare them with the estimates.', 'اكشف المتوسطات الحقيقية لمقارنتها بالتقديرات.'])}</p>}
          </Panel>
          <Panel title={t(['Compare ε values (200 runs × 500 pulls each)', 'قارن قيم ε (200 تشغيل × 500 سحبة لكل منها)'])} className="md:col-span-2" actions={<Button size="sm" variant="primary" icon={<Dices size={15} />} onClick={runCompare}>{t(['Run comparison', 'شغّل المقارنة'])}</Button>}>
            {compare ? (
              <div className="grid gap-4 md:grid-cols-2">
                <LineChart ariaLabel={t(['Average reward per step', 'متوسط المكافأة لكل خطوة'])} series={compare.map((c, i) => ({ id: String(c.eps), label: `ε = ${c.eps}`, values: c.avg, color: COMPARE_COLORS[i] }))} xStart={1} xLabel={t(['pull', 'السحبة'])} yLabel={t(['average reward', 'متوسط المكافأة'])} />
                <LineChart ariaLabel={t(['Percent optimal action', 'نسبة اختيار الإجراء الأمثل'])} series={compare.map((c, i) => ({ id: String(c.eps), label: `ε = ${c.eps}`, values: c.opt.map((v) => v * 100), color: COMPARE_COLORS[i] }))} xStart={1} xLabel={t(['pull', 'السحبة'])} yLabel={t(['% optimal arm', '% الذراع الأمثل'])} yMin={0} yMax={100} />
              </div>
            ) : (
              <p className="text-sm text-muted">{t(['Runs the same environment many times for each ε and averages the results, so the curves show typical behaviour rather than one lucky or unlucky run.', 'يشغّل البيئة نفسها مرات عديدة لكل قيمة ε ويحسب المتوسط، فتُظهر المنحنيات السلوك المعتاد لا تشغيلًا واحدًا محظوظًا أو سيئ الحظ.'])}</p>
            )}
          </Panel>
        </div>
      }
      controls={
        <>
          <Panel title={t(['Experiment', 'التجربة'])}>
            <PlayControls running={running} onToggle={() => setRunning((r) => !r)} onStep={() => pull(1)} onReset={() => reset()} stepLabel={t(['Pull once', 'اسحب مرة'])} disabled={agent.steps >= MAX_STEPS} />
            <Slider label={t(['Exploration rate ε', 'معدل الاستكشاف ε'])} value={epsilon} min={0} max={1} step={0.01} onChange={setEpsilon} format={(v) => v.toFixed(2)} hint={t(['Probability of choosing a random arm instead of the current best estimate.', 'احتمال اختيار ذراع عشوائية بدل أفضل تقدير حالي.'])} />
            <Slider label={t(['Pulls per tick', 'سحبات لكل نبضة'])} value={speed} min={1} max={25} onChange={setSpeed} />
            <Toggle label={t(['Reveal true means', 'اكشف المتوسطات الحقيقية'])} checked={reveal} onChange={setReveal} />
            <p className="flex items-center gap-1 text-xs text-subtle">{reveal ? <Eye size={13} /> : <EyeOff size={13} />}{t(['The agent never sees the true means — only sampled rewards.', 'الوكيل لا يرى المتوسطات الحقيقية أبدًا — بل المكافآت المسحوبة فقط.'])}</p>
          </Panel>
          <Panel title={t(['Reward environment', 'بيئة المكافآت'])}>
            <Select
              label={t(['Preset', 'الإعداد المسبق'])}
              value={envId}
              onChange={(id) => {
                setEnvId(id);
                setCompare(null);
                setRunning(false);
                rng.current = mulberry32(seed);
                setAgent(createAgent(BANDIT_PRESETS[id].means.length));
                setHistory([]);
              }}
              options={[
                { value: 'clear', label: t(['Clear winner', 'فائز واضح']) },
                { value: 'close', label: t(['Close competition', 'منافسة متقاربة']) },
                { value: 'noisy', label: t(['Very noisy rewards', 'مكافآت شديدة الضوضاء']) },
                { value: 'hidden', label: t(['Hidden gem', 'جوهرة مخفية']) },
              ]}
            />
            <Slider label={t(C.seed)} value={seed} min={1} max={99} onChange={(v) => { setSeed(v); reset(v); }} />
            <p className="flex items-center gap-1 text-xs text-subtle"><Target size={13} />{t(['Reward = true mean + Gaussian noise (σ =', 'المكافأة = المتوسط الحقيقي + ضوضاء غاوسية (σ ='])} <span className="ltr font-mono">{env.std}</span>)</p>
          </Panel>
        </>
      }
    />
  );
}
