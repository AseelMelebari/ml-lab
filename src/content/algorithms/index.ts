import type { AlgorithmContent } from '../types';
import { SUPERVISED } from './supervised';
import { UNSUPERVISED } from './unsupervised';
import { REINFORCEMENT } from './reinforcement';

export const ALGORITHMS: AlgorithmContent[] = [...SUPERVISED, ...UNSUPERVISED, ...REINFORCEMENT];
export const ALGORITHM_MAP: Record<string, AlgorithmContent> = Object.fromEntries(ALGORITHMS.map((a) => [a.id, a]));
export const getAlgorithm = (id: string): AlgorithmContent | undefined => ALGORITHM_MAP[id];
export const LAB_ALGORITHMS = ALGORITHMS.filter((a) => a.labId);
