export type AchievementCategory = 'streak' | 'workouts' | 'dedication' | 'special';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  currentValue: number;
  targetValue: number;
  unit?: string;
  isUnlocked: boolean;
  unlockedDate?: string;
}

export interface PlayerRank {
  level: number;
  title: string;
  unlockedCount: number;
  totalCount: number;
  progressPercent: number;
}

