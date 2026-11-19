import type { Text } from '@/i18n/types';

export interface NavItem {
  to: string;
  label: Text;
}

export const PRIMARY_NAV: NavItem[] = [
  { to: '/learn', label: ['Fundamentals', 'الأساسيات'] },
  { to: '/paradigms', label: ['Paradigms', 'أنماط التعلّم'] },
  { to: '/algorithms', label: ['Algorithms', 'الخوارزميات'] },
  { to: '/labs', label: ['Labs', 'المختبرات'] },
  { to: '/evaluation', label: ['Training & Evaluation', 'التدريب والتقييم'] },
  { to: '/roadmap', label: ['Roadmap', 'خريطة التعلّم'] },
  { to: '/practice', label: ['Practice', 'التدريب العملي'] },
];

export const SECONDARY_NAV: NavItem[] = [
  { to: '/compare', label: ['Compare algorithms', 'مقارنة الخوارزميات'] },
  { to: '/instructor', label: ['Instructor Mode', 'وضع المحاضِر'] },
  { to: '/about', label: ['About ML LAB', 'عن ML LAB'] },
];
