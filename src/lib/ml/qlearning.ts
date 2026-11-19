/** Tabular Q-Learning in a deterministic grid world. */
import { randInt, type RNG } from './random';

export type Cell = 'empty' | 'wall' | 'goal' | 'pit' | 'start';
export const ACTIONS = ['up', 'right', 'down', 'left'] as const;
export type Action = 0 | 1 | 2 | 3;
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

export interface GridWorld {
  rows: number;
  cols: number;
  cells: Cell[];
  stepReward: number;
  goalReward: number;
  pitReward: number;
}

export function startState(env: GridWorld): number {
  const s = env.cells.indexOf('start');
  return s >= 0 ? s : 0;
}

export const isTerminal = (env: GridWorld, s: number) => env.cells[s] === 'goal' || env.cells[s] === 'pit';

export interface StepResult {
  next: number;
  reward: number;
  done: boolean;
}

/** Moving into a wall or off the grid leaves the agent in place (and still costs the step reward). */
export function envStep(env: GridWorld, s: number, a: Action): StepResult {
  const r = Math.floor(s / env.cols);
  const c = s % env.cols;
  const nr = r + DR[a];
  const nc = c + DC[a];
  let next = s;
  if (nr >= 0 && nr < env.rows && nc >= 0 && nc < env.cols && env.cells[nr * env.cols + nc] !== 'wall') {
    next = nr * env.cols + nc;
  }
  const cell = env.cells[next];
  if (cell === 'goal') return { next, reward: env.goalReward, done: true };
  if (cell === 'pit') return { next, reward: env.pitReward, done: true };
  return { next, reward: env.stepReward, done: false };
}

export const createQ = (env: GridWorld) => new Float64Array(env.rows * env.cols * 4);
export const qIndex = (s: number, a: number) => s * 4 + a;

export function maxQ(Q: Float64Array, s: number): number {
  return Math.max(Q[s * 4], Q[s * 4 + 1], Q[s * 4 + 2], Q[s * 4 + 3]);
}

/** Greedy action; ties broken uniformly at random when rng is given, otherwise lowest index. */
export function greedyAction(Q: Float64Array, s: number, rng?: RNG): Action {
  const m = maxQ(Q, s);
  const best: Action[] = [];
  for (let a = 0; a < 4; a++) if (Math.abs(Q[s * 4 + a] - m) < 1e-12) best.push(a as Action);
  return rng ? best[randInt(rng, best.length)] : best[0];
}

export function epsilonGreedy(Q: Float64Array, s: number, epsilon: number, rng: RNG): { action: Action; explored: boolean } {
  if (rng() < epsilon) return { action: randInt(rng, 4) as Action, explored: true };
  return { action: greedyAction(Q, s, rng), explored: false };
}

/**
 * Q-learning update: Q(s,a) ← Q(s,a) + α [r + γ·maxₐ' Q(s',a') − Q(s,a)].
 * For terminal transitions the bootstrap term is 0. Returns the TD error.
 */
export function qUpdate(
  Q: Float64Array,
  s: number,
  a: Action,
  r: number,
  s2: number,
  done: boolean,
  alpha: number,
  gamma: number,
): number {
  const target = r + (done ? 0 : gamma * maxQ(Q, s2));
  const td = target - Q[qIndex(s, a)];
  Q[qIndex(s, a)] += alpha * td;
  return td;
}

export interface Transition {
  s: number;
  a: Action;
  r: number;
  s2: number;
  done: boolean;
  explored: boolean;
  td: number;
}

export interface QParams {
  alpha: number;
  gamma: number;
  epsilon: number;
  maxSteps: number;
}

/** Run one full training episode, mutating Q. */
export function runEpisode(env: GridWorld, Q: Float64Array, p: QParams, rng: RNG) {
  let s = startState(env);
  const transitions: Transition[] = [];
  let total = 0;
  for (let t = 0; t < p.maxSteps; t++) {
    const { action, explored } = epsilonGreedy(Q, s, p.epsilon, rng);
    const { next, reward, done } = envStep(env, s, action);
    const td = qUpdate(Q, s, action, reward, next, done, p.alpha, p.gamma);
    transitions.push({ s, a: action, r: reward, s2: next, done, explored, td });
    total += reward;
    s = next;
    if (done) break;
  }
  const last = transitions[transitions.length - 1];
  return {
    transitions,
    totalReward: total,
    reachedGoal: !!last && last.done && env.cells[last.s2] === 'goal',
  };
}

/** Follow the greedy policy from the start (no learning). Stops at terminal states, loops or maxSteps. */
export function greedyRollout(env: GridWorld, Q: Float64Array, maxSteps = 100) {
  let s = startState(env);
  const path = [s];
  const seen = new Set([s]);
  let total = 0;
  let outcome: 'goal' | 'pit' | 'loop' | 'timeout' = 'timeout';
  for (let t = 0; t < maxSteps; t++) {
    const { next, reward, done } = envStep(env, s, greedyAction(Q, s));
    total += reward;
    path.push(next);
    s = next;
    if (done) {
      outcome = env.cells[next] === 'goal' ? 'goal' : 'pit';
      break;
    }
    if (seen.has(next)) {
      outcome = 'loop';
      break;
    }
    seen.add(next);
  }
  return { path, totalReward: total, outcome };
}

export function makeGrid(rows: number, cols: number, layout: string[]): GridWorld {
  const map: Record<string, Cell> = { '.': 'empty', '#': 'wall', G: 'goal', X: 'pit', S: 'start' };
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push(map[layout[r]?.[c] ?? '.'] ?? 'empty');
  return { rows, cols, cells, stepReward: -0.1, goalReward: 10, pitReward: -10 };
}

export const GRID_PRESETS: Record<string, string[]> = {
  classic: ['S....', '.##X.', '...#.', '.X...', '...#G'],
  cliff: ['......', '......', 'SXXXXG'],
  maze: ['S.#...', '..#.#.', '.##.#.', '....#.', '.##...', '...#XG'],
  open: ['S.....', '......', '..X...', '......', '....X.', '.....G'],
};

export function presetGrid(id: keyof typeof GRID_PRESETS | string): GridWorld {
  const layout = GRID_PRESETS[id] ?? GRID_PRESETS.classic;
  return makeGrid(layout.length, layout[0].length, layout);
}
