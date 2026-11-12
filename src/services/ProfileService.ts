import { i18n } from '@/services/LocalizationService';
import type { ActivityWeek, Profile } from '@/types/profile';

export type { ActivityWeek };

export interface Milestone {
  emoji: string;
  text: string;
  done: boolean;
}

const EN_MONTH_SHORT_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Felhasználói profil adatok és aktivitási mérföldkövek kezelése
export class ProfileService {
  private static instance: ProfileService;

  private constructor() { }

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  private localizeWeekLabel(label: string): string {
    if (!i18n.isHungarian()) return label;
    const match = label.trim().match(/^([A-Za-z]{3})\s+(\d+)$/);
    if (match) {
      const mIdx = EN_MONTH_SHORT_INDEX[match[1].toLowerCase()];
      if (mIdx !== undefined) {
        return `${i18n.getShortMonthName(mIdx)} ${match[2]}.`;
      }
    }
    return label;
  }



  public getActivityData(profile?: Profile | null): ActivityWeek[] {
    if (profile?.activity_history && profile.activity_history.length > 0) {
      return profile.activity_history.map((w) => ({
        ...w,
        label: this.localizeWeekLabel(w.label),
      }));
    }

    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - dayOfWeek);

    const weeklyTarget = profile?.weekly_target ?? 4;
    const currentWeekSessions = profile?.sessions_this_week ?? 0;

    const weeks: ActivityWeek[] = [];
    for (let w = 4; w >= 0; w--) {
      const mDate = new Date(currentMonday);
      mDate.setDate(currentMonday.getDate() - w * 7);
      const label = i18n.formatShortMonthDay(mDate);
      const count = w === 0 ? currentWeekSessions : 0;
      const height = Math.max(16, Math.min(96, Math.round((count / 6) * 96)));
      weeks.push({
        label,
        count,
        height,
        target: weeklyTarget,
      });
    }
    return weeks;
  }

  public getMilestones(profile?: Profile | null): Milestone[] {
    const totalWorkouts = Math.max(
      profile?.total_workouts ?? 0,
      profile?.sessions_this_week ?? 0
    );
    const bestStreak = Math.max(profile?.best_streak ?? 0, profile?.streak ?? 0);

    return [
      { emoji: '🏁', text: i18n.t('achievements.badge.first_workout.title'), done: totalWorkouts >= 1 },
      { emoji: '🔥', text: i18n.t('achievements.badge.streak_3.title'), done: bestStreak >= 3 },
      { emoji: '⏳', text: i18n.t('achievements.badge.streak_7.title'), done: bestStreak >= 7 },
      { emoji: '💪', text: i18n.t('achievements.badge.workouts_10.title'), done: totalWorkouts >= 10 },
    ];
  }

  public getUserInfo(profile?: Profile | null) {
    const name = profile?.display_name || profile?.username || i18n.t('greeting.defaultAthlete');
    const initials =
      name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'FB';
    const streak = profile?.streak ?? 0;

    return {
      initials,
      name,
      sinceText: 'FitBase',
      streakText: `${streak} ${i18n.t('home.stats.days')}`,
    };
  }
}

export const profileService = ProfileService.getInstance();
