import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { usePlan } from '@/context/PlanProvider';
import { useProfile } from '@/context/ProfileProvider';
import { calorieService } from '@/services/CalorieService';
import { i18n } from '@/services/LocalizationService';
import { shareService } from '@/services/ShareService';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MetricItemProps {
  label: string;
  value: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const MetricCard: React.FC<MetricItemProps> = ({ label, value, unit, icon, color }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconHalo, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text
          style={styles.label}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {label}
        </Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {Boolean(unit) && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
};

// Edzésidő formázása (órák és percek)
export function formatTrainedDuration(
  totalHours: number,
  totalMinutes?: number
): { value: string; unit: string } {
  const effectiveMinutes =
    totalMinutes !== undefined && totalMinutes > 0
      ? totalMinutes
      : totalHours > 0
        ? totalHours === 1
          ? 45
          : totalHours * 45
        : 0;

  if (effectiveMinutes === 0) {
    return { value: '0', unit: i18n.t('statistics.unit.min') };
  }
  if (effectiveMinutes < 60) {
    return { value: String(effectiveMinutes), unit: i18n.t('statistics.unit.min') };
  }
  const hours = Math.floor(effectiveMinutes / 60);
  const remainingMins = effectiveMinutes % 60;
  if (remainingMins === 0) {
    return {
      value: String(hours),
      unit: hours === 1 ? i18n.t('statistics.unit.hr') : i18n.t('statistics.unit.hrs'),
    };
  }
  return {
    value: i18n.t('statistics.unit.hoursMinutes', { hours, mins: remainingMins }),
    unit: '',
  };
}

// Statisztikai mérőszámok 2 oszlopos rácsa
export const StatsMetricsGrid: React.FC = () => {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const {
    weekPlan,
    plannedWorkoutDays,
    todayIndex,
    completedExerciseIds,
    isTodayWorkoutCompleted,
    isTodayWorkoutFinalized,
  } = usePlan();

  const baseSessionsThisWeek = profile?.sessions_this_week ?? 0;
  const sessionsThisWeek =
    isTodayWorkoutCompleted && !isTodayWorkoutFinalized
      ? baseSessionsThisWeek + 1
      : baseSessionsThisWeek;
  const workouts = Math.max(profile?.total_workouts ?? 0, sessionsThisWeek);
  const streak = profile?.streak ?? 0;
  const bestStreak = Math.max(profile?.best_streak ?? 0, streak);
  const totalHours = profile?.total_hours ?? 0;
  const totalMinutes = profile?.total_minutes;
  const weeklyTarget = plannedWorkoutDays;

  const liveTodayCalories = useMemo(() => {
    const todayDay = weekPlan[todayIndex];
    if (!todayDay || todayDay.type === 'rest') return 0;
    const exercises = todayDay.exercises ?? [];
    return calorieService.calculateRoutineCalories(
      exercises,
      completedExerciseIds,
      profile?.weight || 75
    );
  }, [weekPlan, todayIndex, completedExerciseIds, profile?.weight]);

  const estimatedCalories = Math.max(
    profile?.total_calories_burned ?? 0,
    profile?.estimated_calories_today ?? 0,
    !isTodayWorkoutFinalized ? liveTodayCalories : 0,
    workouts > 0 ? Math.round((totalMinutes || totalHours * 45) * 7.5) : 0
  );
  const completionRate = Math.min(
    Math.round((sessionsThisWeek / weeklyTarget) * 100),
    100
  );

  const durationFormatted = formatTrainedDuration(totalHours, totalMinutes);

  const handleShare = () => {
    shareService.shareProgress(profile);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t('statistics.overview')}</Text>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('statistics.shareA11y')}
        >
          <Ionicons name="share-outline" size={14} color={Colors.accent.blue} />
          <Text style={styles.shareText}>{t('statistics.share')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <MetricCard
          label={t('statistics.metric.workouts')}
          value={String(workouts)}
          icon="barbell-outline"
          color={Colors.accent.green}
        />
        <MetricCard
          label={t('statistics.metric.trainingTime')}
          value={durationFormatted.value}
          unit={durationFormatted.unit}
          icon="time-outline"
          color={Colors.accent.blue}
        />
        <MetricCard
          label={t('statistics.metric.activeStreak')}
          value={String(streak)}
          unit={t('statistics.unit.days')}
          icon="flash"
          color={Colors.accent.amber}
        />
        <MetricCard
          label={t('statistics.metric.bestStreak')}
          value={String(bestStreak)}
          unit={t('statistics.unit.days')}
          icon="trophy-outline"
          color="#FFD700"
        />
        <MetricCard
          label={t('statistics.metric.caloriesBurned')}
          value={estimatedCalories > 0 ? i18n.formatNumber(estimatedCalories) : '0'}
          unit={t('statistics.unit.kcal')}
          icon="flame"
          color="#FF5252"
        />
        <MetricCard
          label={t('statistics.metric.completion')}
          value={`${completionRate}%`}
          icon="pie-chart-outline"
          color={Colors.accent.teal}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1.2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(74, 184, 248, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.25)',
  },
  shareText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent.blue,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  card: {
    width: '48.5%',
    backgroundColor: Colors.background.elevated,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border.navy,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconHalo: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
});
