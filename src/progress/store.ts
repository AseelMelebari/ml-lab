/**
 * Local learning-progress store (browser localStorage, no account required).
 * Every entry is created by a real user action: opening a page, marking a lesson complete,
 * submitting a quiz, or running a lab.
 */
import { useSyncExternalStore } from 'react';

export interface QuizRecord {
  score: number;
  total: number;
  best: number;
  attempts: number;
  at: number;
}

export interface ProgressState {
  visited: Record<string, number>;
  completed: Record<string, number>;
  quizzes: Record<string, QuizRecord>;
  /** labId → list of achievement events reported by the lab (e.g. 'trained', 'converged'). */
  labs: Record<string, string[]>;
}

const KEY = 'mllab.progress.v1';
const empty = (): ProgressState => ({ visited: {}, completed: {}, quizzes: {}, labs: {} });

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      visited: parsed.visited && typeof parsed.visited === 'object' ? parsed.visited : {},
      completed: parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {},
      quizzes: parsed.quizzes && typeof parsed.quizzes === 'object' ? parsed.quizzes : {},
      labs: parsed.labs && typeof parsed.labs === 'object' ? parsed.labs : {},
    };
  } catch {
    return empty();
  }
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function commit(next: ProgressState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: progress stays in memory for this session */
  }
  listeners.forEach((l) => l());
}

export const progress = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  markVisited(id: string) {
    if (state.visited[id]) return;
    commit({ ...state, visited: { ...state.visited, [id]: Date.now() } });
  },
  setCompleted(id: string, done: boolean) {
    const completed = { ...state.completed };
    if (done) completed[id] = Date.now();
    else delete completed[id];
    commit({ ...state, completed });
  },
  recordQuiz(id: string, score: number, total: number) {
    const prev = state.quizzes[id];
    const rec: QuizRecord = {
      score,
      total,
      best: Math.max(score, prev?.best ?? 0),
      attempts: (prev?.attempts ?? 0) + 1,
      at: Date.now(),
    };
    commit({ ...state, quizzes: { ...state.quizzes, [id]: rec } });
  },
  recordLab(labId: string, event: string) {
    const list = state.labs[labId] ?? [];
    if (list.includes(event)) return;
    commit({ ...state, labs: { ...state.labs, [labId]: [...list, event] } });
  },
  reset() {
    commit(empty());
  },
  /** Re-read from storage (used by tests). */
  reload() {
    state = load();
    listeners.forEach((l) => l());
  },
};

export function useProgress(): ProgressState {
  return useSyncExternalStore(progress.subscribe, progress.get, progress.get);
}
