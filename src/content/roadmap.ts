import type { Text } from '@/i18n/types';
import { getAlgorithm } from './algorithms';
import { getFundamental } from './fundamentals';
import { getEvalSection } from './evaluation';
import type { ProgressState } from '@/progress/store';

export type NodeKind = 'lab' | 'lesson' | 'future';
export type Tier = 'beginner' | 'intermediate' | 'advanced';
export type Track = 'foundations' | 'supervised' | 'unsupervised' | 'reinforcement' | 'evaluation' | 'projects';

export interface RoadmapNode {
  id: string;
  title: Text;
  to?: string;
  kind: NodeKind;
  tier: Tier;
  track: Track;
  /** Progress keys that count as "done" for this node. */
  doneKeys: string[];
  /** Lab id whose recorded events count as "explored". */
  labId?: string;
}

export const TRACK_LABEL: Record<Track, Text> = {
  foundations: ['Foundations', 'الأساسيات'],
  supervised: ['Supervised', 'الموجَّه'],
  unsupervised: ['Unsupervised', 'غير الموجَّه'],
  reinforcement: ['Reinforcement', 'المعزّز'],
  evaluation: ['Training & evaluation', 'التدريب والتقييم'],
  projects: ['Practical projects', 'مشاريع عملية'],
};

export const TIER_LABEL: Record<Tier, Text> = {
  beginner: ['Beginner', 'مبتدئ'],
  intermediate: ['Intermediate', 'متوسط'],
  advanced: ['Advanced', 'متقدم'],
};

const lesson = (id: string, tier: Tier): RoadmapNode => ({ id: `learn:${id}`, title: getFundamental(id)!.title, to: `/learn/${id}`, kind: 'lesson', tier, track: 'foundations', doneKeys: [`learn:${id}`] });
const algo = (id: string, tier: Tier, track: Track): RoadmapNode => {
  const a = getAlgorithm(id)!;
  return { id: `algo:${id}`, title: a.name, to: `/algorithms/${id}`, kind: a.labId ? 'lab' : 'lesson', tier, track, doneKeys: [`algo:${id}`], labId: a.labId };
};
const evalNode = (id: string, tier: Tier): RoadmapNode => ({ id: `eval:${id}`, title: getEvalSection(id)!.title, to: `/evaluation/${id}`, kind: 'lesson', tier, track: 'evaluation', doneKeys: [`eval:${id}`] });

export const ROADMAP: RoadmapNode[] = [
  lesson('what-is-ai', 'beginner'),
  lesson('what-is-ml', 'beginner'),
  lesson('ai-ml-dl', 'beginner'),
  lesson('how-ml-works', 'beginner'),
  lesson('datasets', 'beginner'),
  lesson('features-labels', 'beginner'),
  lesson('train-val-test', 'beginner'),
  { id: 'paradigm:supervised', title: ['Learning paradigms', 'أنماط التعلّم'], to: '/paradigms', kind: 'lesson', tier: 'beginner', track: 'foundations', doneKeys: ['paradigm:supervised', 'paradigm:unsupervised', 'paradigm:reinforcement'] },
  algo('linear-regression', 'beginner', 'supervised'),
  algo('logistic-regression', 'beginner', 'supervised'),
  algo('knn', 'beginner', 'supervised'),
  algo('k-means', 'beginner', 'unsupervised'),
  algo('association-rules', 'beginner', 'unsupervised'),
  algo('bandit', 'beginner', 'reinforcement'),
  evalNode('classification', 'beginner'),
  evalNode('regression', 'beginner'),

  lesson('training-inference', 'intermediate'),
  lesson('generalization', 'intermediate'),
  lesson('lifecycle', 'intermediate'),
  algo('decision-tree', 'intermediate', 'supervised'),
  algo('random-forest', 'intermediate', 'supervised'),
  algo('naive-bayes', 'intermediate', 'supervised'),
  algo('pca', 'intermediate', 'unsupervised'),
  algo('hierarchical', 'intermediate', 'unsupervised'),
  algo('dbscan', 'intermediate', 'unsupervised'),
  algo('apriori', 'intermediate', 'unsupervised'),
  algo('q-learning', 'intermediate', 'reinforcement'),
  algo('sarsa', 'intermediate', 'reinforcement'),
  evalNode('data-preparation', 'intermediate'),
  evalNode('training', 'intermediate'),
  evalNode('validation', 'intermediate'),

  algo('svm', 'advanced', 'supervised'),
  algo('gmm', 'advanced', 'unsupervised'),
  algo('tsne', 'advanced', 'unsupervised'),
  algo('umap', 'advanced', 'unsupervised'),
  algo('fp-growth', 'advanced', 'unsupervised'),
  algo('dqn', 'advanced', 'reinforcement'),
  algo('policy-gradient', 'advanced', 'reinforcement'),
  algo('actor-critic', 'advanced', 'reinforcement'),
  lesson('limitations', 'advanced'),
  lesson('responsible-ml', 'advanced'),
  { id: 'project:pipeline', title: ['Project: end-to-end regression pipeline', 'مشروع: خط انحدار متكامل'], kind: 'future', tier: 'advanced', track: 'projects', doneKeys: [] },
  { id: 'project:segmentation', title: ['Project: customer segmentation study', 'مشروع: دراسة تقسيم العملاء'], kind: 'future', tier: 'advanced', track: 'projects', doneKeys: [] },
  { id: 'project:maze', title: ['Project: design and solve your own maze', 'مشروع: صمّم متاهتك وحلّها'], to: '/labs/q-learning', kind: 'lab', tier: 'intermediate', track: 'projects', doneKeys: [], labId: 'q-learning' },
];

/** Recommended order for complete beginners. */
export const GUIDED_PATH = [
  'learn:what-is-ml',
  'learn:how-ml-works',
  'learn:features-labels',
  'learn:train-val-test',
  'algo:linear-regression',
  'algo:logistic-regression',
  'eval:classification',
  'algo:knn',
  'algo:decision-tree',
  'learn:generalization',
  'algo:k-means',
  'algo:bandit',
  'algo:q-learning',
];

export function nodeStatus(n: RoadmapNode, p: ProgressState): 'done' | 'explored' | 'visited' | 'new' {
  if (n.doneKeys.some((k) => p.completed[k])) return 'done';
  const ev = n.labId ? (p.labs[n.labId] ?? []) : [];
  if (n.track === 'projects') {
    if (ev.includes('edited-grid') && ev.includes('policy-goal')) return 'done';
    return ev.includes('edited-grid') ? 'explored' : 'new';
  }
  if (ev.length > 0) return 'explored';
  if (n.doneKeys.some((k) => p.visited[k])) return 'visited';
  return 'new';
}
