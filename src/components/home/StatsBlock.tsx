import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { usePlan } from '@/context/PlanProvider';
import { calorieService } from '@/services/CalorieService';

export function StatsBlock(): React.JSX.Element {
  const { language, t } = useLanguage();
  const { profile } = useProfile();
  const {
    weekPlan,
    todayIndex,
    selectedHomeDayIndex,
    completedExerciseIds,
    isTodayWorkoutCompleted,
    isTodayWorkoutFinalized,
  } = usePlan();

  const isViewingToday = selectedHomeDayIndex === todayIndex;
  const currentDay = weekPlan?.[selectedHomeDayIndex];
  const exercises = currentDay?.type === 'rest' ? [] : (currentDay?.exercises ?? []);

  const totalCaloriesForDay = useMemo(() => {
    return calorieService.calculateRoutineCalories(
      exercises,
      undefined,
      profile?.weight || 75
    );
  }, [exercises, profile?.weight]);

  const burnedTodayCalories = useMemo(() => {
    if (!isViewingToday) return 0;
    return calorieService.calculateRoutineCalories(
      exercises,
      completedExerciseIds,
      profile?.weight || 75
    );
  }, [isViewingToday, exercises, completedExerciseIds, profile?.weight]);

  const checkedCount = useMemo(() => {
    if (!isViewingToday) return 0;
    return exercises.filter((ex) => Boolean(completedExerciseIds[ex.id])).length;
  }, [isViewingToday, exercises, completedExerciseIds]);

  const calorieValue = useMemo(() => {
    if (isViewingToday && isTodayWorkoutFinalized) {
      return burnedTodayCalories > 0
        ? burnedTodayCalories
        : (profile?.estimated_calories_today || totalCaloriesForDay);
    }
    if (isViewingToday && checkedCount > 0) {
      return burnedTodayCalories;
    }
    return totalCaloriesForDay;
  }, [
    isViewingToday,
    isTodayWorkoutFinalized,
    burnedTodayCalories,
    profile?.estimated_calories_today,
    totalCaloriesForDay,
    checkedCount,
  ]);

  const isDayActive = isViewingToday && (isTodayWorkoutFinalized || checkedCount > 0);
  const calorieTitle = isDayActive ? t('home.stats.burnedToday') : t('home.stats.estimated');

  const baseSessions = profile?.sessions_this_week ?? 0;
  const sessionsThisWeek =
    isTodayWorkoutCompleted && !isTodayWorkoutFinalized
      ? baseSessions + 1
      : baseSessions;

  const stats = {
    streak: profile?.streak ?? 0,
    sessionsThisWeek,
    calories: calorieValue,
    calorieTitle,
  };

  return (
    <View key={language} style={statsStyle.container}>
      <View style={statsStyle.card}>
        <Text style={[statsStyle.number, { color: Colors.accent.green }]}>{stats.streak}</Text>
        <Text style={statsStyle.label}>{t('home.stats.days')}</Text>
        <Text style={statsStyle.title}>{t('home.stats.streakTitle')}</Text>
      </View>
      <View style={statsStyle.card}>
        <Text style={[statsStyle.number, { color: Colors.accent.blue }]}>{stats.sessionsThisWeek}</Text>
        <Text style={statsStyle.label}>{t('home.stats.sessions')}</Text>
        <Text style={statsStyle.title}>{t('home.stats.thisWeekTitle')}</Text>
      </View>
      <View style={statsStyle.card}>
        <Text style={[statsStyle.number, { color: Colors.accent.amber }]}>{stats.calories}</Text>
        <Text style={statsStyle.label}>{t('home.stats.kcal')}</Text>
        <Text style={statsStyle.title} numberOfLines={1} adjustsFontSizeToFit>
          {stats.calorieTitle}
        </Text>
      </View>
    </View>
  );
}

const statsStyle = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#152038',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  number: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  label: {
    color: Colors.text.secondary,
    fontSize: 10,
    textTransform: 'lowercase',
    marginBottom: 2,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
