import type { Text } from '@/i18n/types';

export type Paradigm = 'supervised' | 'unsupervised' | 'reinforcement' | 'semi-supervised' | 'self-supervised';
export type Category = 'regression' | 'classification' | 'clustering' | 'dimensionality-reduction' | 'association' | 'reinforcement';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuizQuestion {
  q: Text;
  options: Text[];
  /** Index of the correct option. */
  answer: number;
  explain: Text;
}

export interface Reference {
  title: string;
  url: string;
}

/** Everything needed to render the standard 21-part algorithm page. */
export interface AlgorithmContent {
  id: string;
  name: Text;
  short: Text;
  paradigm: Paradigm;
  categories: Category[];
  difficulty: Difficulty;
  /** Id of the interactive lab in `src/labs/registry.ts`, if one exists. */
  labId?: string;
  objectives: Text[];
  /** Beginner-friendly explanation (rich text). */
  intuition: Text;
  useCases: Text[];
  steps: Text[];
  /** Mathematical intuition with equations (rich text, `$$…$$` for display maths). */
  math: Text;
  /** Parameters exposed in the lab and what they do. */
  labGuide?: { param: Text; effect: Text }[];
  /** What to try in the lab (dataset exploration / experiments). */
  experiments?: Text[];
  /** Evaluation metrics relevant to this algorithm (rich text). */
  evaluation: Text;
  advantages: Text[];
  limitations: Text[];
  mistakes: Text[];
  python: string;
  pythonNote: Text;
  quiz: QuizQuestion[];
  related: string[];
  references: Reference[];
  compare: {
    purpose: Text;
    data: Text;
    assumptions: Text;
    hyperparams: string;
  };
}
