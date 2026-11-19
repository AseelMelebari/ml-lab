import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { LabProps } from './shared/LabUI';

/** Every interactive laboratory, lazy-loaded so heavy simulations do not slow initial page load. */
export const LAB_COMPONENTS: Record<string, LazyExoticComponent<ComponentType<LabProps>>> = {
  'linear-regression': lazy(() => import('./LinearRegressionLab')),
  'logistic-regression': lazy(() => import('./LogisticRegressionLab')),
  knn: lazy(() => import('./KnnLab')),
  'decision-tree': lazy(() => import('./DecisionTreeLab')),
  'random-forest': lazy(() => import('./RandomForestLab')),
  svm: lazy(() => import('./SvmLab')),
  'naive-bayes': lazy(() => import('./NaiveBayesLab')),
  'k-means': lazy(() => import('./KMeansLab')),
  pca: lazy(() => import('./PcaLab')),
  hierarchical: lazy(() => import('./HierarchicalLab')),
  'q-learning': lazy(() => import('./QLearningLab')),
  bandit: lazy(() => import('./BanditLab')),
};

export const hasLab = (id: string) => id in LAB_COMPONENTS;
