import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { usePlan } from '@/context/PlanProvider';
import { useProfile } from '@/context/ProfileProvider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DayStatus {
  dayLabel: string;
  isWorkout: boolean;
  isCompleted: boolean;
  isToday: boolean;
}

/**
 * WeeklyConsistencyTracker
 * Elevates the weekly target into an interactive day-by-day rhythm tracker
 * bound dynamically to `usePlan()` (`weekPlan`, `plannedWorkoutDays`) and `useProfile()`.
 */
export const WeeklyConsistencyTracker: React.FC = () => {
  const { language, t, i18n } = useLanguage();
  const { profile } = useProfile();
  const {
    weekPlan,
    plannedWorkoutDays,
    isTodayWorkoutCompleted,
    isTodayWorkoutFinalized,
  } = usePlan();

  const baseSessions = profile?.sessions_this_week || 0;
  const current =
    isTodayWorkoutCompleted && !isTodayWorkoutFinalized
      ? baseSessions + 1
      : baseSessions;
  const target = plannedWorkoutDays;
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const remaining = Math.max(target - current, 0);

  const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);

  const days: DayStatus[] = useMemo(() => {
    const daysOfWeek = i18n.getCalendarColumnHeaders();
    const pastCompletedQuota = isTodayWorkoutFinalized
      ? Math.max(0, baseSessions - 1)
      : baseSessions;
    let pastCreditedCount = 0;

    return daysOfWeek.map((label, idx) => {
      const planDay = weekPlan[idx];
      const isWorkout = planDay ? planDay.type === 'workout' : true;
      const isPast = idx < todayIndex;
      const isToday = idx === todayIndex;

      let isCompleted = false;
      if (isToday && isWorkout) {
        isCompleted = Boolean(isTodayWorkoutCompleted || isTodayWorkoutFinalized);
      } else if (isPast && isWorkout) {
        if (pastCreditedCount < pastCompletedQuota) {
          isCompleted = true;
          pastCreditedCount++;
        }
      }

      return {
        dayLabel: label,
        isWorkout,
        isCompleted,
        isToday,
      };
    });
  }, [weekPlan, todayIndex, isTodayWorkoutCompleted, isTodayWorkoutFinalized, baseSessions, language, i18n]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subtitle}>{t('statistics.weeklyTarget.subtitle')}</Text>
          <Text style={styles.title}>{t('statistics.weeklyTarget.title', { target })}</Text>
        </View>
        <View style={styles.percentageBadge}>
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>
      </View>

      <View style={styles.barBg}>
        <LinearGradient
          colors={[Colors.accent.green, Colors.accent.teal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${Math.max(percentage, 5)}%` }]}
        />
      </View>

      <View style={styles.daysRow}>
        {days.map((day, idx) => (
          <View key={idx} style={styles.dayCol}>
            <View
              style={[
                styles.dayCircle,
                !day.isWorkout && styles.dayCircleRest,
                day.isCompleted && styles.dayCircleCompleted,
                day.isToday && !day.isCompleted && styles.dayCircleToday,
              ]}
            >
              {day.isCompleted ? (
                <Ionicons name="checkmark" size={14} color="#0D1528" />
              ) : !day.isWorkout ? (
                <Ionicons name="moon" size={12} color={Colors.accent.amber} />
              ) : (
                <Text
                  style={[
                    styles.dayCircleText,
                    day.isToday && styles.dayCircleTextToday,
                  ]}
                >
                  {day.dayLabel}
                </Text>
              )}
            </View>
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {day.dayLabel}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.hintContainer}>
        <Ionicons
          name={remaining > 0 ? 'fitness-outline' : 'trophy'}
          size={16}
          color={remaining > 0 ? Colors.accent.blue : Colors.accent.amber}
        />
        <Text style={styles.hintText}>
          {remaining > 0
            ? remaining === 1
              ? t('statistics.weeklyTarget.remainingOne')
              : t('statistics.weeklyTarget.remainingMany', { count: remaining })
            : t('statistics.weeklyTarget.completed')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border.navy,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  percentageBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent.green,
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background.subtle,
    overflow: 'hidden',
    marginBottom: 18,
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  dayCircleRest: {
    backgroundColor: 'rgba(13, 21, 40, 0.6)',
    borderColor: 'rgba(255, 179, 0, 0.25)',
  },
  dayCircleCompleted: {
    backgroundColor: Colors.accent.green,
    borderColor: Colors.accent.green,
  },
  dayCircleToday: {
    borderColor: Colors.accent.blue,
    borderWidth: 2,
  },
  dayCircleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  dayCircleTextToday: {
    color: Colors.accent.blue,
    fontWeight: '700',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  dayLabelToday: {
    color: Colors.accent.blue,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  hintText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
    flex: 1,
  },
});
