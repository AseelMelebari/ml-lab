/** Multi-armed bandit with Gaussian rewards and an ε-greedy, sample-average agent. */
import { gaussian, mulberry32, randInt, type RNG } from './random';

export interface BanditEnv {
  /** True (hidden) mean reward of each arm. */
  means: number[];
  /** Reward noise standard deviation. */
  std: number;
}

export const BANDIT_PRESETS: Record<string, BanditEnv> = {
  clear: { means: [1.0, 2.0, 4.0, 1.5, 0.5], std: 1 },
  close: { means: [2.6, 3.0, 2.8, 2.4, 2.9], std: 1 },
  noisy: { means: [1.0, 2.5, 1.5, 3.0, 2.0], std: 3 },
  hidden: { means: [2.0, 1.8, 2.2, 1.9, 3.6], std: 2 },
};

export const optimalArm = (env: BanditEnv) => env.means.indexOf(Math.max(...env.means));

export function pullArm(env: BanditEnv, arm: number, rng: RNG): number {
  return env.means[arm] + env.std * gaussian(rng);
}

export interface AgentState {
  /** Estimated value Q(a) = sample mean of observed rewards. */
  estimates: number[];
  counts: number[];
  totalReward: number;
  steps: number;
}

export const createAgent = (k: number, initial = 0): AgentState => ({
  estimates: new Array<number>(k).fill(initial),
  counts: new Array<number>(k).fill(0),
  totalReward: 0,
  steps: 0,
});

/** ε-greedy selection: explore uniformly with probability ε, else pick argmax Q (random tie-break). */
export function selectArm(agent: AgentState, epsilon: number, rng: RNG): { arm: number; explored: boolean } {
  const k = agent.estimates.length;
  if (rng() < epsilon) return { arm: randInt(rng, k), explored: true };
  const m = Math.max(...agent.estimates);
  const best = agent.estimates.map((q, i) => (Math.abs(q - m) < 1e-12 ? i : -1)).filter((i) => i >= 0);
  return { arm: best[randInt(rng, best.length)], explored: false };
}

/** Incremental sample-average update: Q ← Q + (r − Q)/N. Returns a new state. */
export function updateAgent(agent: AgentState, arm: number, reward: number): AgentState {
  const counts = agent.counts.slice();
  const estimates = agent.estimates.slice();
  counts[arm] += 1;
  estimates[arm] += (reward - estimates[arm]) / counts[arm];
  return { estimates, counts, totalReward: agent.totalReward + reward, steps: agent.steps + 1 };
}

export interface SimulationSummary {
  avgReward: number[];
  optimalPct: number[];
  finalAvgReward: number;
}

/** Average over many independent runs (the standard 10-armed-testbed methodology). */
export function simulate(env: BanditEnv, epsilon: number, steps: number, runs: number, seed: number): SimulationSummary {
  const avgReward = new Array<number>(steps).fill(0);
  const optimalPct = new Array<number>(steps).fill(0);
  const best = optimalArm(env);
  for (let r = 0; r < runs; r++) {
    const rng = mulberry32(seed + r * 7919);
    let agent = createAgent(env.means.length);
    for (let t = 0; t < steps; t++) {
      const { arm } = selectArm(agent, epsilon, rng);
      const reward = pullArm(env, arm, rng);
      agent = updateAgent(agent, arm, reward);
      avgReward[t] += reward / runs;
      if (arm === best) optimalPct[t] += 1 / runs;
    }
  }
  return { avgReward, optimalPct, finalAvgReward: avgReward.slice(-Math.min(100, steps)).reduce((a, b) => a + b, 0) / Math.min(100, steps) };
}
