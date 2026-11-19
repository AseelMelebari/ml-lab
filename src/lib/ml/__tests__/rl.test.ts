import { describe, expect, it } from 'vitest';
import { makeGrid, envStep, qUpdate, createQ, runEpisode, greedyRollout, epsilonGreedy, presetGrid, qIndex, greedyAction } from '../qlearning';
import { createAgent, selectArm, updateAgent, simulate, BANDIT_PRESETS, pullArm } from '../bandit';
import { mulberry32 } from '../random';

describe('grid world', () => {
  const env = makeGrid(1, 3, ['S.G']);
  it('walls and borders block movement', () => {
    expect(envStep(env, 0, 3).next).toBe(0);
    expect(envStep(env, 0, 0).next).toBe(0);
    const w = makeGrid(1, 3, ['S#G']);
    expect(envStep(w, 0, 1).next).toBe(0);
  });
  it('terminal rewards', () => {
    expect(envStep(env, 1, 1)).toEqual({ next: 2, reward: 10, done: true });
    expect(envStep(env, 0, 1)).toEqual({ next: 1, reward: -0.1, done: false });
  });
});

describe('Q-learning', () => {
  it('single update follows the Bellman target', () => {
    const env = makeGrid(1, 3, ['S.G']);
    const Q = createQ(env);
    Q[qIndex(2, 0)] = 0;
    const td = qUpdate(Q, 1, 1, 10, 2, true, 0.5, 0.9);
    expect(td).toBe(10);
    expect(Q[qIndex(1, 1)]).toBe(5);
    const td2 = qUpdate(Q, 0, 1, -0.1, 1, false, 0.5, 0.9);
    expect(td2).toBeCloseTo(-0.1 + 0.9 * 5);
  });
  it('converges to optimal Q* in a corridor', () => {
    const env = makeGrid(1, 3, ['S.G']);
    const Q = createQ(env);
    const rng = mulberry32(1);
    for (let e = 0; e < 300; e++) runEpisode(env, Q, { alpha: 0.5, gamma: 0.9, epsilon: 0.3, maxSteps: 50 }, rng);
    expect(Q[qIndex(1, 1)]).toBeCloseTo(10, 3);
    expect(Q[qIndex(0, 1)]).toBeCloseTo(-0.1 + 0.9 * 10, 3);
    expect(greedyRollout(env, Q).outcome).toBe('goal');
  });
  it('learns to reach the goal in the classic grid', () => {
    const env = presetGrid('classic');
    const Q = createQ(env);
    const rng = mulberry32(3);
    expect(greedyRollout(env, Q).outcome).not.toBe('goal');
    for (let e = 0; e < 400; e++) runEpisode(env, Q, { alpha: 0.5, gamma: 0.95, epsilon: 0.2, maxSteps: 200 }, rng);
    const r = greedyRollout(env, Q);
    expect(r.outcome).toBe('goal');
    // Shortest path S(0,0) → G(4,4) needs 8 moves.
    expect(r.path.length - 1).toBe(8);
  });
  it('epsilon = 0 is greedy, epsilon = 1 always explores', () => {
    const env = makeGrid(1, 3, ['S.G']);
    const Q = createQ(env);
    Q[qIndex(0, 1)] = 5;
    const rng = mulberry32(2);
    for (let i = 0; i < 50; i++) expect(epsilonGreedy(Q, 0, 0, rng)).toEqual({ action: 1, explored: false });
    for (let i = 0; i < 50; i++) expect(epsilonGreedy(Q, 0, 1, rng).explored).toBe(true);
    expect(greedyAction(Q, 0)).toBe(1);
  });
});

describe('epsilon-greedy bandit', () => {
  it('sample-average estimates equal the mean of observed rewards', () => {
    let a = createAgent(3);
    a = updateAgent(a, 1, 2);
    a = updateAgent(a, 1, 4);
    a = updateAgent(a, 1, 9);
    expect(a.estimates[1]).toBeCloseTo(5);
    expect(a.counts).toEqual([0, 3, 0]);
    expect(a.totalReward).toBe(15);
  });
  it('epsilon=0 always exploits the current best estimate', () => {
    const a = { ...createAgent(3), estimates: [0, 3, 1] };
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) expect(selectArm(a, 0, rng).arm).toBe(1);
  });
  it('epsilon=1 selects arms uniformly', () => {
    const a = createAgent(4);
    const rng = mulberry32(9);
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 8000; i++) counts[selectArm(a, 1, rng).arm]++;
    for (const c of counts) expect(Math.abs(c / 8000 - 0.25)).toBeLessThan(0.03);
  });
  it('rewards are sampled around the true mean', () => {
    const rng = mulberry32(4);
    const env = BANDIT_PRESETS.clear;
    const xs = Array.from({ length: 5000 }, () => pullArm(env, 2, rng));
    expect(xs.reduce((s, x) => s + x, 0) / xs.length).toBeCloseTo(4, 1);
  });
  it('moderate exploration beats pure greed in the long run', () => {
    const env = BANDIT_PRESETS.hidden;
    const greedy = simulate(env, 0, 1000, 150, 1);
    const eps = simulate(env, 0.1, 1000, 150, 1);
    expect(eps.optimalPct[999]).toBeGreaterThan(greedy.optimalPct[999]);
    expect(eps.finalAvgReward).toBeGreaterThan(greedy.finalAvgReward);
  });
});
