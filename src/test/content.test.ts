import { describe, expect, it } from 'vitest';
import { ALGORITHMS, getAlgorithm } from '@/content/algorithms';
import { FUNDAMENTALS } from '@/content/fundamentals';
import { PARADIGMS } from '@/content/paradigms';
import { EVAL_SECTIONS } from '@/content/evaluation';
import { ROADMAP, GUIDED_PATH } from '@/content/roadmap';
import { DEMOS } from '@/content/demos';
import { CHALLENGES, checkAnswer, generateExercises } from '@/content/exercises';
import { LAB_COMPONENTS } from '@/labs/registry';
import type { Text } from '@/i18n/types';

const ARABIC = /[؀-ۿ]/;
function checkText(t: Text, where: string) {
  expect(t[0].trim().length, `${where} (en)`).toBeGreaterThan(0);
  expect(t[1].trim().length, `${where} (ar)`).toBeGreaterThan(0);
}

describe('algorithm content', () => {
  it('has unique ids and the 12 mandatory labs', () => {
    expect(new Set(ALGORITHMS.map((a) => a.id)).size).toBe(ALGORITHMS.length);
    const labs = ALGORITHMS.filter((a) => a.labId).map((a) => a.labId).sort();
    expect(labs).toEqual(['bandit', 'decision-tree', 'hierarchical', 'k-means', 'knn', 'linear-regression', 'logistic-regression', 'naive-bayes', 'pca', 'q-learning', 'random-forest', 'svm'].sort());
    for (const id of labs) expect(LAB_COMPONENTS[id!], id).toBeDefined();
  });

  it.each(ALGORITHMS.map((a) => [a.id, a] as const))('%s has every required section in both languages', (_, a) => {
    for (const k of ['name', 'short', 'intuition', 'math', 'evaluation', 'pythonNote'] as const) checkText(a[k], `${a.id}.${k}`);
    for (const k of ['objectives', 'useCases', 'steps', 'advantages', 'limitations', 'mistakes'] as const) {
      expect(a[k].length, `${a.id}.${k}`).toBeGreaterThan(0);
      a[k].forEach((t, i) => checkText(t, `${a.id}.${k}[${i}]`));
    }
    expect(ARABIC.test(a.intuition[1])).toBe(true);
    expect(a.python.length).toBeGreaterThan(40);
    expect(a.quiz.length).toBeGreaterThan(0);
    for (const q of a.quiz) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
    for (const r of a.related) expect(getAlgorithm(r), `${a.id} related ${r}`).toBeDefined();
    expect(a.references.length).toBeGreaterThan(0);
    for (const ref of a.references) expect(ref.url).toMatch(/^https?:\/\//);
    if (a.labId) expect(a.labGuide?.length).toBeGreaterThan(0);
  });

  it('balanced $ delimiters in math so formulas render', () => {
    for (const a of ALGORITHMS)
      for (const t of [a.math, a.intuition, a.evaluation])
        for (const s of t) expect((s.match(/\$/g) ?? []).length % 2, a.id).toBe(0);
  });
});

describe('other content', () => {
  it('16 fundamentals modules in both languages', () => {
    expect(FUNDAMENTALS).toHaveLength(16);
    for (const m of FUNDAMENTALS) {
      checkText(m.title, m.id);
      checkText(m.body, m.id);
      expect(ARABIC.test(m.body[1])).toBe(true);
    }
  });
  it('5 paradigms; RL glossary covers the required concepts', () => {
    expect(PARADIGMS.map((p) => p.id)).toEqual(['supervised', 'unsupervised', 'reinforcement', 'semi-supervised', 'self-supervised']);
    const rl = PARADIGMS.find((p) => p.id === 'reinforcement')!;
    expect(rl.glossary!.length).toBeGreaterThanOrEqual(13);
  });
  it('evaluation sections cover the five required areas', () => {
    expect(EVAL_SECTIONS.map((s) => s.id)).toEqual(['data-preparation', 'training', 'classification', 'regression', 'validation']);
  });
  it('roadmap nodes and guided path resolve', () => {
    const ids = new Set(ROADMAP.map((n) => n.id));
    for (const id of GUIDED_PATH) expect(ids.has(id), id).toBe(true);
    for (const n of ROADMAP) if (n.kind !== 'future') expect(n.to, n.id).toBeTruthy();
    expect(ROADMAP.some((n) => n.kind === 'future')).toBe(true);
  });
  it('10 instructor demos point at real labs; challenges point at real labs', () => {
    expect(DEMOS).toHaveLength(10);
    for (const d of DEMOS) expect(LAB_COMPONENTS[d.labId]).toBeDefined();
    for (const c of CHALLENGES) expect(LAB_COMPONENTS[c.labId]).toBeDefined();
  });
});

describe('numeric exercises', () => {
  it('are deterministic and their own answers check as correct', () => {
    const a = generateExercises(3);
    const b = generateExercises(3);
    expect(a.map((e) => e.answer)).toEqual(b.map((e) => e.answer));
    for (const ex of a) {
      expect(checkAnswer(ex, ex.answer.toFixed(4))).toBe(true);
      expect(checkAnswer(ex, String(ex.answer + 1))).toBe(false);
      expect(checkAnswer(ex, '')).toBeNull();
      expect(checkAnswer(ex, 'abc')).toBeNull();
    }
  });
  it('accepts a comma decimal separator', () => {
    const ex = generateExercises(5)[0];
    expect(checkAnswer(ex, ex.answer.toFixed(3).replace('.', ','))).toBe(true);
  });
});
