import { useMemo, useRef, useState } from 'react';
import { Bot, FastForward, Flag, Skull, BrickWall, Eraser, MapPin, Search } from 'lucide-react';
import { LineChart } from '@/components/charts/LineChart';
import { Button, Callout, Segmented, Slider, Stat, Toggle, Select } from '@/components/ui/primitives';
import { TeX } from '@/components/ui/Math';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';
import { mulberry32, type RNG } from '@/lib/ml/random';
import {
  ACTIONS,
  createQ,
  envStep,
  epsilonGreedy,
  greedyAction,
  greedyRollout,
  isTerminal,
  maxQ,
  presetGrid,
  qIndex,
  qUpdate,
  runEpisode,
  startState,
  type Cell,
  type GridWorld,
  type Transition,
} from '@/lib/ml/qlearning';
import { LabShell, Panel, PlayControls, StatGrid, type LabProps } from './shared/LabUI';
import { labEvent, useLoop, usePresenterKeys } from './shared/hooks';

type Tool = Cell | 'inspect';
const ARROWS = ['↑', '→', '↓', '←'];

function movingAverage(v: number[], w = 10) {
  return v.map((_, i) => {
    const s = v.slice(Math.max(0, i - w + 1), i + 1);
    return s.reduce((a, b) => a + b, 0) / s.length;
  });
}

export default function QLearningLab({ presentation }: LabProps) {
  const { t, num } = useI18n();
  const [presetId, setPresetId] = useState('classic');
  const [env, setEnv] = useState<GridWorld>(() => presetGrid('classic'));
  const Q = useRef<Float64Array>(createQ(env));
  const rng = useRef<RNG>(mulberry32(1));
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);
  const [alpha, setAlpha] = useState(0.5);
  const [gamma, setGamma] = useState(0.95);
  const [epsilon, setEpsilon] = useState(0.2);
  const [decay, setDecay] = useState(false);
  const [epsNow, setEpsNow] = useState(0.2);
  const [maxSteps, setMaxSteps] = useState(100);
  const [mode, setMode] = useState<'watch' | 'fast'>('watch');
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(6);
  const [returns, setReturns] = useState<number[]>([]);
  const [lengths, setLengths] = useState<number[]>([]);
  const [agent, setAgent] = useState<{ s: number; trail: number[]; ret: number; last?: Transition } | null>(null);
  const [tool, setTool] = useState<Tool>('inspect');
  const [inspect, setInspect] = useState<number | null>(null);
  const [showValues, setShowValues] = useState(!!presentation);
  const [showPath, setShowPath] = useState(true);
  const [seed, setSeed] = useState(1);

  const resetAll = (e: GridWorld = env, s = seed) => {
    setRunning(false);
    Q.current = createQ(e);
    rng.current = mulberry32(s);
    setReturns([]);
    setLengths([]);
    setAgent(null);
    setEpsNow(epsilon);
    bump();
  };

  const finishEpisode = (ret: number, len: number) => {
    setReturns((r) => [...r, ret]);
    setLengths((l) => [...l, len]);
    if (decay) setEpsNow((e) => Math.max(0.01, e * 0.97));
  };

  const watchStep = () => {
    const eps = decay ? epsNow : epsilon;
    let a = agent;
    if (!a || isTerminal(env, a.s) || a.trail.length > maxSteps) a = { s: startState(env), trail: [startState(env)], ret: 0 };
    const { action, explored } = epsilonGreedy(Q.current, a.s, eps, rng.current);
    const { next, reward, done } = envStep(env, a.s, action);
    const td = qUpdate(Q.current, a.s, action, reward, next, done, alpha, gamma);
    const tr: Transition = { s: a.s, a: action, r: reward, s2: next, done, explored, td };
    const na = { s: next, trail: [...a.trail, next], ret: a.ret + reward, last: tr };
    if (done || na.trail.length > maxSteps) {
      finishEpisode(na.ret, na.trail.length - 1);
      if (done && env.cells[next] === 'goal') labEvent('q-learning', 'reached-goal');
    }
    labEvent('q-learning', 'trained');
    setAgent(na);
    bump();
  };

  const fastEpisodes = (k: number) => {
    const rs: number[] = [];
    const ls: number[] = [];
    let e = decay ? epsNow : epsilon;
    for (let i = 0; i < k; i++) {
      const r = runEpisode(env, Q.current, { alpha, gamma, epsilon: e, maxSteps }, rng.current);
      rs.push(r.totalReward);
      ls.push(r.transitions.length);
      if (decay) e = Math.max(0.01, e * 0.97);
    }
    setEpsNow(e);
    setReturns((r) => [...r, ...rs]);
    setLengths((l) => [...l, ...ls]);
    setAgent(null);
    labEvent('q-learning', 'trained');
    if (greedyRollout(env, Q.current, 200).outcome === 'goal') labEvent('q-learning', 'policy-goal');
    bump();
  };

  useLoop(running, () => (mode === 'watch' ? watchStep() : fastEpisodes(speed)), mode === 'watch' ? Math.max(30, 420 - speed * 35) : 120);
  usePresenterKeys(!!presentation, { toggle: () => setRunning((r) => !r), step: watchStep, reset: () => resetAll() });

  const rollout = useMemo(() => greedyRollout(env, Q.current, 200), [env, returns.length, agent]); // eslint-disable-line react-hooks/exhaustive-deps
  const qMaxAbs = Math.max(1, ...Array.from(Q.current).map(Math.abs));
  const paint = (s: number) => {
    if (tool === 'inspect') return setInspect(s);
    const cells = env.cells.slice();
    if (tool === 'start') for (let i = 0; i < cells.length; i++) if (cells[i] === 'start') cells[i] = 'empty';
    if (cells[s] === 'start' && tool !== 'start') return;
    cells[s] = tool;
    const e = { ...env, cells };
    setEnv(e);
    resetAll(e);
  };
  const early = returns.slice(0, 10);
  const late = returns.slice(-10);
  const avg = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN);
  const outcomeText = {
    goal: t(['reaches the goal', 'يصل إلى الهدف']),
    pit: t(['falls into a pit', 'يسقط في حفرة']),
    loop: t(['gets stuck in a loop', 'يعلق في حلقة']),
    timeout: t(['wanders without reaching the goal', 'يتجول دون الوصول إلى الهدف']),
  }[rollout.outcome];

  const toolOpts: { value: Tool; label: React.ReactNode }[] = [
    { value: 'inspect', label: <><Search size={13} />{t(['Inspect', 'افحص'])}</> },
    { value: 'wall', label: <><BrickWall size={13} />{t(['Wall', 'جدار'])}</> },
    { value: 'pit', label: <><Skull size={13} />{t(['Pit', 'حفرة'])}</> },
    { value: 'goal', label: <><Flag size={13} />{t(['Goal', 'هدف'])}</> },
    { value: 'start', label: <><MapPin size={13} />{t(['Start', 'بداية'])}</> },
    { value: 'empty', label: <><Eraser size={13} />{t(['Erase', 'مسح'])}</> },
  ];

  return (
    <LabShell
      presentation={presentation}
      viz={
        <>
          <GridView env={env} Q={Q.current} qMaxAbs={qMaxAbs} agent={agent} rolloutPath={showPath ? rollout.path : null} showValues={showValues} inspect={inspect} onCell={paint} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 pt-2 text-xs text-muted">
            <span>{t(['Cell colour = max Q(s, a): teal positive, red negative.', 'لون الخلية = أكبر Q(s, a): الأخضر المزرق موجب والأحمر سالب.'])}</span>
            <span>{t(['Arrow = greedy action.', 'السهم = الإجراء الجشع.'])}</span>
            {showPath && <span className="text-warn">┅ {t(['path the greedy policy would take now', 'المسار الذي ستسلكه السياسة الجشعة الآن'])}</span>}
          </div>
          <p className="px-2 pt-1 text-xs text-subtle">
            {t(['Rewards:', 'المكافآت:'])} <span className="ltr font-mono">goal +{env.goalReward}, pit {env.pitReward}, step {env.stepReward}</span>
          </p>
        </>
      }
      status={
        <>
          <StatGrid>
            <Stat label={t(['Episodes', 'الحلقات'])} value={returns.length} />
            <Stat label={t(['Current ε', 'قيمة ε الحالية'])} value={num(decay ? epsNow : epsilon, 3)} />
            <Stat label={t(['Avg return: first 10 → last 10', 'متوسط العائد: أول 10 ← آخر 10'])} value={returns.length >= 2 ? `${num(avg(early), 1)} → ${num(avg(late), 1)}` : '—'} tone="accent" />
            <Stat label={t(['Greedy policy', 'السياسة الجشعة'])} value={rollout.outcome === 'goal' ? `✓ ${rollout.path.length - 1} ${t(['steps', 'خطوة'])}` : '✗'} sub={outcomeText} tone={rollout.outcome === 'goal' ? 'accent' : 'warn'} />
          </StatGrid>
          {agent?.last && (
            <Panel title={t(['Last Q-learning update', 'آخر تحديث لتعلّم Q'])}>
              <TeX
                display
                tex={`Q(s,${ACTIONS[agent.last.a]}) \\leftarrow Q(s,${ACTIONS[agent.last.a]}) + ${alpha}\\,[\\,${num(agent.last.r, 2)} + ${gamma}\\cdot ${agent.last.done ? '0' : num(maxQ(Q.current, agent.last.s2), 3)} - Q_{old}\\,] \\quad (\\delta = ${num(agent.last.td, 3)})`}
              />
              <p className="text-xs text-muted">{agent.last.explored ? t(['This move was exploratory (random action, probability ε).', 'كانت هذه الحركة استكشافية (إجراء عشوائي باحتمال ε).']) : t(['This move was greedy (the best-known action).', 'كانت هذه الحركة جشعة (أفضل إجراء معروف).'])}</p>
            </Panel>
          )}
          {returns.length === 0 && <Callout tone="info">{t(['The Q-table starts at zero, so the untrained agent has no preference: it moves randomly. Press Play to watch it learn from rewards.', 'يبدأ جدول Q بأصفار، لذلك لا يملك الوكيل غير المدرَّب أي تفضيل: يتحرك عشوائيًا. اضغط تشغيل لتراه يتعلّم من المكافآت.'])}</Callout>}
        </>
      }
      below={
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={t(['Return per episode', 'العائد لكل حلقة'])}>
            <LineChart
              ariaLabel={t(['Total reward collected in each episode', 'مجموع المكافآت في كل حلقة'])}
              series={[
                { id: 'r', label: t(['return', 'العائد']), values: returns, color: 'var(--c-subtle)', width: 1 },
                { id: 'ma', label: t(['moving average (10)', 'المتوسط المتحرك (10)']), values: movingAverage(returns), color: 'var(--c-accent)', width: 2.5 },
              ]}
              xStart={1}
              xLabel={t(['episode', 'الحلقة'])}
              emptyText={t(['No episodes yet', 'لا توجد حلقات بعد'])}
            />
          </Panel>
          <Panel title={t(['Steps per episode', 'الخطوات لكل حلقة'])}>
            <LineChart ariaLabel={t(['Episode length', 'طول الحلقة'])} series={[{ id: 'l', label: 'steps', values: lengths, color: 'var(--c-purple)' }]} xStart={1} xLabel={t(['episode', 'الحلقة'])} yMin={0} emptyText={t(['No episodes yet', 'لا توجد حلقات بعد'])} />
          </Panel>
          {inspect !== null && (
            <Panel title={`${t(['Q-values of cell', 'قيم Q للخلية'])} (${Math.floor(inspect / env.cols)}, ${inspect % env.cols})`} className="md:col-span-2">
              <div className="grid grid-cols-4 gap-2">
                {ACTIONS.map((a, i) => {
                  const best = greedyAction(Q.current, inspect) === i && maxQ(Q.current, inspect) !== 0;
                  return (
                    <div key={a} className={`rounded-xl border px-3 py-2 text-center ${best ? 'border-accent bg-accent/10' : 'border-line'}`}>
                      <div className="text-lg">{ARROWS[i]}</div>
                      <div className="ltr font-mono text-sm text-ink">{num(Q.current[qIndex(inspect, i)], 3)}</div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>
      }
      controls={
        <>
          <Panel title={t(['Training', 'التدريب'])}>
            <Segmented
              label={t(['Run mode', 'نمط التشغيل'])}
              value={mode}
              onChange={(m) => { setMode(m); setRunning(false); }}
              size="sm"
              options={[
                { value: 'watch', label: <><Bot size={14} />{t(['Watch moves', 'شاهد الحركات'])}</> },
                { value: 'fast', label: <><FastForward size={14} />{t(['Fast episodes', 'حلقات سريعة'])}</> },
              ]}
            />
            <PlayControls running={running} onToggle={() => setRunning((r) => !r)} onStep={watchStep} onReset={() => resetAll()} stepLabel={t(['One move', 'حركة واحدة'])} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => fastEpisodes(1)} disabled={running}>
                +1 {t(['episode', 'حلقة'])}
              </Button>
              <Button size="sm" onClick={() => fastEpisodes(50)} disabled={running}>
                +50 {t(['episodes', 'حلقة'])}
              </Button>
            </div>
            <Slider label={t(C.speed)} value={speed} min={1} max={10} onChange={setSpeed} />
          </Panel>
          <Panel title={t(C.parameters)}>
            <Slider label={t(['Learning rate α', 'معدل التعلّم α'])} value={alpha} min={0.05} max={1} step={0.05} onChange={setAlpha} format={(v) => v.toFixed(2)} hint={t(['How far each update moves Q toward the new target.', 'مقدار تحريك كل تحديث لقيمة Q نحو الهدف الجديد.'])} />
            <Slider label={t(['Discount factor γ', 'معامل الخصم γ'])} value={gamma} min={0} max={0.99} step={0.01} onChange={setGamma} format={(v) => v.toFixed(2)} hint={t(['How much future rewards count. γ = 0: only the immediate reward matters.', 'مدى أهمية المكافآت المستقبلية. γ = 0: المكافأة الفورية فقط هي المهمة.'])} />
            <Slider label={t(['Exploration ε', 'الاستكشاف ε'])} value={epsilon} min={0} max={1} step={0.01} onChange={(v) => { setEpsilon(v); setEpsNow(v); }} format={(v) => v.toFixed(2)} />
            <Toggle label={t(['Decay ε each episode (×0.97)', 'تخفيض ε كل حلقة (×0.97)'])} checked={decay} onChange={setDecay} />
            <Slider label={t(['Max steps per episode', 'أقصى خطوات للحلقة'])} value={maxSteps} min={20} max={300} step={10} onChange={setMaxSteps} />
            <Slider label={t(C.seed)} value={seed} min={1} max={99} onChange={(v) => { setSeed(v); resetAll(env, v); }} />
          </Panel>
          <Panel title={t(['Environment', 'البيئة'])}>
            <Select
              label={t(['Layout', 'التخطيط'])}
              value={presetId}
              onChange={(id) => {
                setPresetId(id);
                const e = presetGrid(id);
                setEnv(e);
                resetAll(e);
              }}
              options={[
                { value: 'classic', label: t(['Classic 5×5', 'الكلاسيكي 5×5']) },
                { value: 'cliff', label: t(['Cliff walk', 'حافة الجرف']) },
                { value: 'maze', label: t(['Maze 6×6', 'متاهة 6×6']) },
                { value: 'open', label: t(['Open field', 'حقل مفتوح']) },
              ]}
            />
            <Segmented label={t(['Click tool', 'أداة النقر'])} value={tool} onChange={setTool} size="sm" options={toolOpts} />
            <Toggle label={t(['Show Q-values in cells', 'إظهار قيم Q في الخلايا'])} checked={showValues} onChange={setShowValues} />
            <Toggle label={t(['Show greedy path', 'إظهار المسار الجشع'])} checked={showPath} onChange={setShowPath} />
            <p className="text-[11px] text-subtle">{t(['Editing the grid resets the Q-table.', 'تعديل الشبكة يعيد ضبط جدول Q.'])}</p>
          </Panel>
        </>
      }
    />
  );
}

function GridView({
  env,
  Q,
  qMaxAbs,
  agent,
  rolloutPath,
  showValues,
  inspect,
  onCell,
}: {
  env: GridWorld;
  Q: Float64Array;
  qMaxAbs: number;
  agent: { s: number; trail: number[] } | null;
  rolloutPath: number[] | null;
  showValues: boolean;
  inspect: number | null;
  onCell: (s: number) => void;
}) {
  const { t } = useI18n();
  const S = 76;
  const W = env.cols * S;
  const H = env.rows * S;
  const cxy = (s: number) => [(s % env.cols) * S + S / 2, Math.floor(s / env.cols) * S + S / 2];
  const tint = (v: number) => {
    const a = Math.min(1, Math.abs(v) / qMaxAbs);
    return v >= 0 ? `color-mix(in oklab, var(--c-accent) ${a * 55}%, var(--c-plot))` : `color-mix(in oklab, var(--c-danger) ${a * 55}%, var(--c-plot))`;
  };
  return (
    <svg viewBox={`-2 -2 ${W + 4} ${H + 4}`} className="mx-auto block w-full max-w-[640px]" role="grid" aria-label={t(['Grid world environment', 'بيئة عالم الشبكة'])} style={{ direction: 'ltr' }}>
      <defs>
        <pattern id="wall-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="10" height="10" fill="var(--c-surface-2)" />
          <line x1="0" y1="0" x2="0" y2="10" stroke="var(--c-subtle)" strokeWidth="3" opacity="0.6" />
        </pattern>
      </defs>
      {env.cells.map((cell, s) => {
        const [x, y] = cxy(s);
        const v = maxQ(Q, s);
        const visited = Q[s * 4] !== 0 || Q[s * 4 + 1] !== 0 || Q[s * 4 + 2] !== 0 || Q[s * 4 + 3] !== 0;
        const fill = cell === 'wall' ? 'url(#wall-hatch)' : cell === 'goal' ? 'color-mix(in oklab, var(--c-success) 45%, var(--c-plot))' : cell === 'pit' ? 'color-mix(in oklab, var(--c-danger) 45%, var(--c-plot))' : tint(v);
        const a = greedyAction(Q, s);
        return (
          <g key={s} role="gridcell" aria-label={`${cell} (${Math.floor(s / env.cols)}, ${s % env.cols})`} onClick={() => onCell(s)} style={{ cursor: 'pointer' }}>
            <rect x={x - S / 2 + 1} y={y - S / 2 + 1} width={S - 2} height={S - 2} rx={8} fill={fill} stroke={inspect === s ? 'var(--c-warn)' : 'var(--c-border)'} strokeWidth={inspect === s ? 3 : 1} />
            {cell === 'goal' && <text x={x} y={y + 8} textAnchor="middle" fontSize={24}>🏁</text>}
            {cell === 'pit' && <text x={x} y={y + 8} textAnchor="middle" fontSize={22}>☠</text>}
            {cell === 'start' && <text x={x} y={y - S / 2 + 14} textAnchor="middle" fontSize={10} fill="var(--c-muted)">START</text>}
            {cell !== 'wall' && cell !== 'goal' && cell !== 'pit' && visited && !showValues && (
              <text x={x} y={y + 9} textAnchor="middle" fontSize={26} fontWeight={700} fill="var(--c-text)" opacity={0.85}>
                {ARROWS[a]}
              </text>
            )}
            {cell !== 'wall' && cell !== 'goal' && cell !== 'pit' && showValues && (
              <g fontSize={10} fill="var(--c-text)" textAnchor="middle" fontFamily="JetBrains Mono Variable, monospace">
                <text x={x} y={y - S / 2 + 13} fontWeight={a === 0 && visited ? 700 : 400}>{Q[qIndex(s, 0)].toFixed(1)}</text>
                <text x={x + S / 2 - 15} y={y + 4} fontWeight={a === 1 && visited ? 700 : 400}>{Q[qIndex(s, 1)].toFixed(1)}</text>
                <text x={x} y={y + S / 2 - 6} fontWeight={a === 2 && visited ? 700 : 400}>{Q[qIndex(s, 2)].toFixed(1)}</text>
                <text x={x - S / 2 + 15} y={y + 4} fontWeight={a === 3 && visited ? 700 : 400}>{Q[qIndex(s, 3)].toFixed(1)}</text>
                {visited && <text x={x} y={y + 6} fontSize={16} fontWeight={700}>{ARROWS[a]}</text>}
              </g>
            )}
          </g>
        );
      })}
      {rolloutPath && rolloutPath.length > 1 && (
        <polyline points={rolloutPath.map((s) => cxy(s).join(',')).join(' ')} fill="none" stroke="var(--c-warn)" strokeWidth={3} strokeDasharray="7 5" strokeLinecap="round" pointerEvents="none" opacity={0.9} />
      )}
      {agent && agent.trail.length > 1 && <polyline points={agent.trail.slice(-25).map((s) => cxy(s).join(',')).join(' ')} fill="none" stroke="var(--c-cyan)" strokeWidth={2} opacity={0.6} pointerEvents="none" />}
      {agent && (
        <g transform={`translate(${cxy(agent.s)[0]} ${cxy(agent.s)[1]})`} style={{ transition: 'transform 160ms ease' }} pointerEvents="none">
          <circle r={17} fill="var(--c-cyan)" stroke="var(--c-plot)" strokeWidth={3} />
          <text y={6} textAnchor="middle" fontSize={17}>🤖</text>
        </g>
      )}
    </svg>
  );
}

