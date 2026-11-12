import { Achievement, PlayerRank } from '@/models/Achievement';
import { i18n } from '@/services/LocalizationService';
import type { Profile } from '@/types/profile';

// Kitüntetések és szintlépések kezelése a profil adatai alapján
export class AchievementsService {
  private static instance: AchievementsService;

  public static getInstance(): AchievementsService {
    if (!AchievementsService.instance) {
      AchievementsService.instance = new AchievementsService();
    }
    return AchievementsService.instance;
  }

  private localizeUnit(unit?: string): string {
    if (!unit) return '';
    const key = `achievements.unit.${unit.trim().toLowerCase()}`;
    const translated = i18n.t(key);
    return translated !== key ? translated : unit;
  }

  private localizeAchievement(a: Achievement): Achievement {
    const titleKey = `achievements.badge.${a.id}.title`;
    const descKey = `achievements.badge.${a.id}.desc`;
    const locTitle = i18n.t(titleKey);
    const locDesc = i18n.t(descKey);
    return {
      ...a,
      title: locTitle !== titleKey ? locTitle : a.title,
      description: locDesc !== descKey ? locDesc : a.description,
      unit: this.localizeUnit(a.unit),
    };
  }

  // Kitüntetések lekérése és lokalizálása az adott profilhoz
  public getAchievements(
    profile: Profile | null,
    dbAchievements?: Achievement[] | null
  ): Achievement[] {
    if (dbAchievements && dbAchievements.length > 0) {
      return dbAchievements.map((a) => this.localizeAchievement(a));
    }

    const sessionsThisWeek = profile?.sessions_this_week ?? 0;
    const totalWorkouts = Math.max(profile?.total_workouts ?? 0, sessionsThisWeek);
    const streak = profile?.streak ?? 0;
    const bestStreak = Math.max(profile?.best_streak ?? 0, streak);
    const totalMinutes = profile?.total_minutes ?? (profile?.total_hours ?? 0) * 60;
    const totalHours = Math.max(profile?.total_hours ?? 0, Math.floor(totalMinutes / 60));
    const weeklyTarget = Math.max(profile?.weekly_target ?? 4, 1);

    const rawList: Achievement[] = [
      {
        id: 'first_workout',
        title: 'First Step',
        description: 'Complete your first workout session in FitBase.',
        category: 'workouts',
        tier: 'bronze',
        icon: 'footsteps',
        currentValue: Math.min(totalWorkouts, 1),
        targetValue: 1,
        unit: 'workout',
        isUnlocked: totalWorkouts >= 1,
        unlockedDate: totalWorkouts >= 1 ? 'Unlocked' : undefined,
      },
      {
        id: 'streak_3',
        title: 'Spark',
        description: 'Keep your momentum with an active 3-day streak.',
        category: 'streak',
        tier: 'bronze',
        icon: 'flame',
        currentValue: Math.min(bestStreak, 3),
        targetValue: 3,
        unit: 'days',
        isUnlocked: bestStreak >= 3,
        unlockedDate: bestStreak >= 3 ? 'Unlocked' : undefined,
      },
      {
        id: 'streak_7',
        title: 'Unstoppable',
        description: 'Achieve a full 7-day uninterrupted workout streak.',
        category: 'streak',
        tier: 'silver',
        icon: 'flash',
        currentValue: Math.min(bestStreak, 7),
        targetValue: 7,
        unit: 'days',
        isUnlocked: bestStreak >= 7,
        unlockedDate: bestStreak >= 7 ? 'Unlocked' : undefined,
      },
      {
        id: 'streak_14',
        title: 'Iron Habit',
        description: 'Reach a formidable 14-day training streak.',
        category: 'streak',
        tier: 'gold',
        icon: 'shield-checkmark',
        currentValue: Math.min(bestStreak, 14),
        targetValue: 14,
        unit: 'days',
        isUnlocked: bestStreak >= 14,
        unlockedDate: bestStreak >= 14 ? 'Unlocked' : undefined,
      },
      {
        id: 'workouts_5',
        title: 'High Five',
        description: 'Complete 5 total training sessions.',
        category: 'workouts',
        tier: 'bronze',
        icon: 'hand-left',
        currentValue: Math.min(totalWorkouts, 5),
        targetValue: 5,
        unit: 'workouts',
        isUnlocked: totalWorkouts >= 5,
        unlockedDate: totalWorkouts >= 5 ? 'Unlocked' : undefined,
      },
      {
        id: 'workouts_10',
        title: 'Dedication',
        description: 'Finish 10 intense workout sessions.',
        category: 'workouts',
        tier: 'silver',
        icon: 'barbell',
        currentValue: Math.min(totalWorkouts, 10),
        targetValue: 10,
        unit: 'workouts',
        isUnlocked: totalWorkouts >= 10,
        unlockedDate: totalWorkouts >= 10 ? 'Unlocked' : undefined,
      },
      {
        id: 'hours_5',
        title: 'Hourglass',
        description: 'Accumulate 5 total hours of focused training.',
        category: 'dedication',
        tier: 'silver',
        icon: 'hourglass',
        currentValue: Math.min(totalHours, 5),
        targetValue: 5,
        unit: 'hours',
        isUnlocked: totalHours >= 5,
        unlockedDate: totalHours >= 5 ? 'Unlocked' : undefined,
      },
      {
        id: 'hours_20',
        title: 'Endurance Beast',
        description: 'Log 20 total training hours on your journey.',
        category: 'dedication',
        tier: 'gold',
        icon: 'speedometer',
        currentValue: Math.min(totalHours, 20),
        targetValue: 20,
        unit: 'hours',
        isUnlocked: totalHours >= 20,
        unlockedDate: totalHours >= 20 ? 'Unlocked' : undefined,
      },
      {
        id: 'goal_crusher',
        title: 'Goal Crusher',
        description: 'Hit 100% of your weekly workout target.',
        category: 'special',
        tier: 'gold',
        icon: 'star',
        currentValue: Math.min(sessionsThisWeek, weeklyTarget),
        targetValue: weeklyTarget,
        unit: 'sessions',
        isUnlocked: sessionsThisWeek >= weeklyTarget,
        unlockedDate: sessionsThisWeek >= weeklyTarget ? 'Unlocked' : undefined,
      },
      {
        id: 'century_club',
        title: 'Century Club',
        description: 'Legendary status: complete 100 workouts.',
        category: 'workouts',
        tier: 'diamond',
        icon: 'diamond',
        currentValue: Math.min(totalWorkouts, 100),
        targetValue: 100,
        unit: 'workouts',
        isUnlocked: totalWorkouts >= 100,
        unlockedDate: totalWorkouts >= 100 ? 'Unlocked' : undefined,
      },
    ];

    return rawList.map((a) => this.localizeAchievement(a));
  }

  // Játékos szint kiszámítása a feloldott kitüntetések száma alapján
  public calculatePlayerRank(achievements: Achievement[]): PlayerRank {
    const totalCount = achievements.length;
    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
    const progressPercent =
      totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

    let level = 1;

    if (unlockedCount >= 8) {
      level = 5;
    } else if (unlockedCount >= 6) {
      level = 4;
    } else if (unlockedCount >= 4) {
      level = 3;
    } else if (unlockedCount >= 2) {
      level = 2;
    }

    const title = i18n.t(`achievements.rank.${level}`);

    return {
      level,
      title,
      unlockedCount,
      totalCount,
      progressPercent,
    };
  }
}

export const achievementsService = AchievementsService.getInstance();
