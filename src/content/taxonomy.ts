import type { Text } from '@/i18n/types';
import type { Category, Paradigm } from './types';

export const PARADIGM_LABEL: Record<Paradigm, Text> = {
  supervised: ['Supervised Learning', 'التعلّم الموجَّه'],
  unsupervised: ['Unsupervised Learning', 'التعلّم غير الموجَّه'],
  reinforcement: ['Reinforcement Learning', 'التعلّم المعزّز'],
  'semi-supervised': ['Semi-Supervised Learning', 'التعلّم شبه الموجَّه'],
  'self-supervised': ['Self-Supervised Learning', 'التعلّم الذاتي الإشراف'],
};

export const CATEGORY_LABEL: Record<Category, Text> = {
  regression: ['Regression', 'الانحدار'],
  classification: ['Classification', 'التصنيف'],
  clustering: ['Clustering', 'التجميع'],
  'dimensionality-reduction': ['Dimensionality reduction', 'تقليل الأبعاد'],
  association: ['Association rules', 'قواعد الارتباط'],
  reinforcement: ['Reinforcement learning', 'التعلّم المعزّز'],
};

export const PARADIGM_TONE: Record<Paradigm, 'accent' | 'purple' | 'cyan' | 'warn' | 'neutral'> = {
  supervised: 'accent',
  unsupervised: 'purple',
  reinforcement: 'cyan',
  'semi-supervised': 'warn',
  'self-supervised': 'neutral',
};
