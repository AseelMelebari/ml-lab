import { useCallback, useEffect, useRef, useState } from 'react';
import { nextId } from '@/lib/ml/types';
import { progress } from '@/progress/store';

/** Calls `fn` every `ms` milliseconds while `running` is true. Always uses the latest `fn`. */
export function useLoop(running: boolean, fn: () => void, ms: number) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => ref.current(), Math.max(16, ms));
    return () => window.clearInterval(id);
  }, [running, ms]);
}

export function usePrefersReducedMotion() {
  const [r, setR] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const h = () => setR(mq.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);
  return r;
}

/** Editable point collection with a hard size limit (keeps computations responsive). */
export function usePointSet<P extends { id: string; x: number; y: number }>(initial: () => P[], limit: number) {
  const [points, setPoints] = useState<P[]>(initial);
  const add = useCallback(
    (p: Omit<P, 'id'>) => {
      let added = false;
      setPoints((ps) => {
        if (ps.length >= limit) return ps;
        added = true;
        return [...ps, { ...p, id: nextId('u') } as P];
      });
      return added;
    },
    [limit],
  );
  const move = useCallback((id: string, x: number, y: number) => setPoints((ps) => ps.map((p) => (p.id === id ? { ...p, x, y } : p))), []);
  const update = useCallback((id: string, patch: Partial<P>) => setPoints((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))), []);
  const remove = useCallback((id: string) => setPoints((ps) => ps.filter((p) => p.id !== id)), []);
  return { points, setPoints, add, move, update, remove, full: points.length >= limit };
}

/** Report a real lab achievement to the local progress store. */
export function labEvent(labId: string, event: string) {
  progress.recordLab(labId, event);
}

/** Keyboard shortcuts for presentations: Space = play/pause, → = step, R = reset. */
export function usePresenterKeys(enabled: boolean, handlers: { toggle?: () => void; step?: () => void; reset?: () => void }) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ' && ref.current.toggle) {
        e.preventDefault();
        ref.current.toggle();
      } else if ((e.key === '.' || e.key === 's') && ref.current.step) {
        ref.current.step();
      } else if ((e.key === 'r' || e.key === 'R') && ref.current.reset) {
        ref.current.reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
