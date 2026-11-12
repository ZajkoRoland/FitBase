import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { usePlan } from '@/context/PlanProvider';

export function WeeklyGoalBlock(): React.JSX.Element {
  const { language, t, i18n, isHungarian } = useLanguage();
  const { profile } = useProfile();
  const {
    weekPlan,
    plannedWorkoutDays,
    isTodayWorkoutCompleted,
    isTodayWorkoutFinalized,
  } = usePlan();

  const baseSessions = profile?.sessions_this_week ?? 0;
  const currentSessions =
    isTodayWorkoutCompleted && !isTodayWorkoutFinalized
      ? baseSessions + 1
      : baseSessions;
  const targetSessions = plannedWorkoutDays;

  const percentage = Math.min(100, Math.round((currentSessions / targetSessions) * 100));
  const remaining = Math.max(0, targetSessions - currentSessions);

  // Mai nap sorszáma a héten (hétfő = 0, vasárnap = 6)
  const todayDayIndex = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  }, []);

  const daysMeta = useMemo(() => {
    const labels = i18n.getCalendarColumnHeaders();
    const pastCompletedQuota = isTodayWorkoutFinalized
      ? Math.max(0, baseSessions - 1)
      : baseSessions;

    let pastCreditedCount = 0;

    return labels.map((label, idx) => {
      const planDay = weekPlan[idx];
      const isWorkout = planDay ? planDay.type === 'workout' : true;
      const isPast = idx < todayDayIndex;
      const isToday = idx === todayDayIndex;

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
        label,
        idx,
        isWorkout,
        isPast,
        isToday,
        isCompleted,
      };
    });
  }, [weekPlan, todayDayIndex, isTodayWorkoutCompleted, isTodayWorkoutFinalized, baseSessions, language, i18n]);

  const remainingHint = remaining > 0
    ? t('home.weeklyGoal.remainingSessions', {
        count: remaining,
        unit: isHungarian ? 'edzés' : remaining === 1 ? 'session' : 'sessions',
      })
    : t('home.weeklyGoal.targetAchieved');

  return (
    <View key={language} style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <View style={styles.eyebrowRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="trophy" size={13} color="#F59E0B" />
            </View>
            <Text style={styles.eyebrow}>{t('home.weeklyGoal.eyebrow')}</Text>
          </View>
          <Text style={styles.subtitle}>{t('home.weeklyGoal.subtitle')}</Text>
        </View>

        <View style={styles.fractionBadge}>
          <Text style={styles.fractionText}>
            <Text style={styles.fractionCurrent}>{currentSessions}</Text>
            <Text style={styles.fractionMuted}>
              {t('home.weeklyGoal.sessionsFraction', { target: targetSessions })}
            </Text>
          </Text>
        </View>
      </View>

      <View style={styles.barTrack}>
        <LinearGradient
          colors={['#06B6D4', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${Math.max(8, percentage)}%` }]}
        />
      </View>

      {/* Napi edzésjelzők */}
      <View style={styles.daysRow}>
        {daysMeta.map((day) => {
          return (
            <View key={day.idx} style={styles.dayCol}>
              <Text
                style={[
                  styles.dayLabel,
                  day.isToday && !day.isCompleted && styles.dayLabelToday,
                  day.isCompleted && styles.dayLabelCompleted,
                ]}
              >
                {day.label}
              </Text>

              <View
                style={[
                  styles.dayDot,
                  !day.isWorkout && styles.dayDotRest,
                  day.isToday && !day.isCompleted && styles.dayDotToday,
                  day.isCompleted && styles.dayDotCompleted,
                ]}
              >
                {day.isCompleted ? (
                  <View style={styles.completedCoreDot} />
                ) : !day.isWorkout ? (
                  <Ionicons name="moon" size={9} color="#475569" />
                ) : day.isToday ? (
                  <View style={styles.todayInnerDot} />
                ) : (
                  <View style={styles.hollowDot} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.hintCol}>
          <Text style={styles.hintText}>{remainingHint}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#152038',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#1E2D4A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleCol: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#4A6282',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fractionBadge: {
    backgroundColor: '#0D1528',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  fractionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fractionCurrent: {
    color: Colors.accent.green,
    fontWeight: '800',
  },
  fractionMuted: {
    color: '#627A9B',
  },
  barTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0D1528',
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1A2840',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    color: '#4A6282',
    fontSize: 11,
    fontWeight: '600',
  },
  dayLabelToday: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  dayLabelCompleted: {
    color: '#10B981',
    fontWeight: '800',
  },
  dayDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0D1528',
    borderWidth: 1.5,
    borderColor: '#1E2D4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  completedCoreDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
  },
  dayDotToday: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 2,
  },
  todayInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  dayDotRest: {
    backgroundColor: '#0D1528',
    borderColor: '#1A2840',
  },
  hollowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#20304C',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  hintCol: {
    flex: 1,
  },
  hintText: {
    color: '#627A9B',
    fontSize: 12,
    lineHeight: 16,
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 109, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 109, 0, 0.25)',
  },
  streakText: {
    color: Colors.accent.orange,
    fontSize: 11,
    fontWeight: '700',
  },
});
