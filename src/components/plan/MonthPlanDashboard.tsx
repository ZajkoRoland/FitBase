import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { WorkoutDay, PlanService, Exercise } from '@/services/PlanService';
import { usePlan } from '@/context/PlanProvider';
import { DateHelper } from '@/utils/DateHelper';
import { MonthCalendarGrid, MonthCalendarHelper, MonthGridCell } from './MonthCalendarGrid';
import { WorkoutList } from './WorkoutList';
import { RestDayCard } from './RestDayCard';
import { RecoveryPillarsCard } from './RecoveryPillarsCard';

export interface MonthPlanDashboardProps {
  readonly weekPlan: WorkoutDay[];
  readonly currentWeekIndex: number;
  readonly onOpenWeek: (weekIndex: number) => void;
  readonly currentDate?: Date;
  readonly onDateChange?: (newDate: Date) => void;
}

export function MonthPlanDashboard({
  weekPlan,
  currentWeekIndex,
  onOpenWeek,
  currentDate = new Date(),
  onDateChange,
}: MonthPlanDashboardProps): React.JSX.Element {
  const router = useRouter();
  const { language, t, i18n, isHungarian } = useLanguage();
  const {
    setActiveDayIndex,
    setTargetDayIndexForAdd,
    setDayAsWorkout,
    setCurrentWeekIndex,
    totalWeeks,
    historicalSessions,
  } = usePlan();

  const helper = useMemo(
    () => new MonthCalendarHelper(currentDate),
    [currentDate.getFullYear(), currentDate.getMonth(), language]
  );

  const [selectedDay, setSelectedDay] = useState<number>(() => currentDate.getDate());

  useEffect(() => {
    const d = currentDate.getDate();
    setSelectedDay((prev) => (prev === d ? prev : d));
  }, [currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()]);

  // Aggregate monthly stats based on 4-week cycle
  const { totalMonthWorkouts, totalMonthRest } = useMemo(() => {
    const weeklyWorkoutCount = weekPlan.filter((d) => d.type === 'workout').length;
    const weeklyRestCount = weekPlan.filter((d) => d.type === 'rest').length;
    return {
      totalMonthWorkouts: weeklyWorkoutCount * 4,
      totalMonthRest: weeklyRestCount * 4,
    };
  }, [weekPlan]);

  const handleDaySelect = useCallback(
    (cell: MonthGridCell) => {
      onDateChange?.(cell.date);
      setSelectedDay(cell.dayNumber);
      setActiveDayIndex(cell.dayOfWeekIndex);

      if (totalWeeks > 1) {
        const weekNum = DateHelper.getWeekNumber(cell.date);
        const cycleIndex = (((weekNum - 1) % totalWeeks) + totalWeeks) % totalWeeks;
        if (cycleIndex !== currentWeekIndex) {
          setCurrentWeekIndex(cycleIndex);
        }
      }
    },
    [totalWeeks, currentWeekIndex, setCurrentWeekIndex, setActiveDayIndex, onDateChange]
  );

  // Determine active day data based on selected day of week
  const selectedDayOfWeekIndex = helper.getDayOfWeekIndex(selectedDay);
  const activeDay = weekPlan[selectedDayOfWeekIndex] || weekPlan[0];
  const isRest = activeDay.type === 'rest';

  const fullDayName = DateHelper.getFullDayName(selectedDayOfWeekIndex).toUpperCase();
  const shortMonth = i18n.getShortMonthName(currentDate.getMonth()).toUpperCase();
  const customEyebrow = isHungarian
    ? `${fullDayName} · ${shortMonth} ${selectedDay}.`
    : `${fullDayName} · ${shortMonth} ${selectedDay}`;

  const selectedDate = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay),
    [currentDate, selectedDay]
  );

  const selectedDateKey = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const isPastDay = selectedDateKey < todayKey;
  const isToday = selectedDateKey === todayKey;
  const pastSession = isPastDay ? historicalSessions?.[selectedDateKey] : null;

  const historicalDay: WorkoutDay = useMemo(() => {
    if (!pastSession) {
      return {
        day: PlanService.DAY_NAMES[selectedDayOfWeekIndex] || 'Mon',
        type: 'rest',
        subtitle: isHungarian ? 'Pihenőnap' : 'Rest Day',
        workoutTitle: isHungarian ? 'Pihenőnap' : 'Rest Day',
        workoutMeta: isHungarian ? 'Nem volt rögzített edzés' : 'No workout recorded',
        exercises: [],
      };
    }

    const sessionExercises: Exercise[] =
      pastSession.exercise_details && pastSession.exercise_details.length > 0
        ? pastSession.exercise_details.map((ex, idx) => ({
            id: ex.id || `past-${pastSession.id}-${idx}`,
            number: String(idx + 1).padStart(2, '0'),
            title: ex.title,
            details: ex.details || `${ex.sets?.length || 3} ${isHungarian ? 'sorozat' : 'sets'}`,
            badgeText: isHungarian ? 'ELVÉGEZVE' : 'COMPLETED',
            color: Colors.accent.green,
            slug: ex.slug,
            sets:
              ex.sets?.map((s) => ({
                setNumber: s.set_number,
                reps: s.reps,
                weightKg: s.weight_kg,
                completed: true,
              })) || [],
          }))
        : Array.from({ length: pastSession.exercises_completed || 1 }, (_, idx) => ({
            id: `past-stub-${idx}`,
            number: String(idx + 1).padStart(2, '0'),
            title: pastSession.workout_title || (isHungarian ? 'Befejezett gyakorlat' : 'Completed Exercise'),
            details: `${pastSession.duration_minutes || 0} ${isHungarian ? 'perc' : 'min'}`,
            badgeText: isHungarian ? 'ELVÉGEZVE' : 'COMPLETED',
            color: Colors.accent.green,
          }));

    return {
      day: PlanService.DAY_NAMES[selectedDayOfWeekIndex] || 'Mon',
      type: 'workout',
      subtitle: isHungarian ? 'Elvégzett edzés' : 'Completed Workout',
      workoutTitle: pastSession.workout_title || (isHungarian ? 'Edzés' : 'Workout'),
      workoutMeta: `${pastSession.exercises_completed || sessionExercises.length} ${isHungarian ? 'gyakorlat' : 'exercises'} · ${pastSession.duration_minutes || 0} perc · ${pastSession.calories_burned || 0} kcal`,
      exercises: sessionExercises,
    };
  }, [pastSession, selectedDayOfWeekIndex, isHungarian]);

  const monthTitle = i18n.formatMonthYear(currentDate);

  return (
    <View style={styles.container}>
      {/* 1. Month Overview Banner */}
      <View style={styles.monthHeader}>
        <View>
          <Text style={styles.monthLabel}>{t('plan.month.overviewEyebrow')}</Text>
          <Text style={styles.monthTitle}>
            {monthTitle}
          </Text>
        </View>

        {/* Aggregate KPI chips */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiChip}>
            <Text style={[styles.kpiNumber, { color: Colors.accent.blue }]}>
              {totalMonthWorkouts}
            </Text>
            <Text style={styles.kpiLabel}>{t('plan.month.workoutsKpi')}</Text>
          </View>
          <View style={styles.kpiChip}>
            <Text style={[styles.kpiNumber, { color: Colors.accent.amber }]}>
              {totalMonthRest}
            </Text>
            <Text style={styles.kpiLabel}>{t('plan.month.restKpi')}</Text>
          </View>
        </View>
      </View>

      {/* 2. Calendar Matrix Heatmap Grid */}
      <View style={styles.gridWrapper}>
        <MonthCalendarGrid
          weekPlan={weekPlan}
          selectedDay={selectedDay}
          onSelectDay={handleDaySelect}
          date={currentDate}
          historicalSessions={historicalSessions}
        />
      </View>

      {/* 3. Dynamic Selected Day Details: Workout Exercises OR Rest Day */}
      <View style={styles.selectedDayContainer}>
        {isPastDay ? (
          pastSession ? (
            <WorkoutList
              activeDay={historicalDay}
              dayIndex={selectedDayOfWeekIndex}
              isHistorical={true}
              customEyebrow={isHungarian ? `Elvégzett edzés · ${selectedDateKey}` : `Completed Session · ${selectedDateKey}`}
            />
          ) : (
            <View>
              <RestDayCard
                date={selectedDate}
                dayIndex={selectedDayOfWeekIndex}
                customEyebrow={isHungarian ? `Elmúlt nap · ${selectedDateKey}` : `Past Day · ${selectedDateKey}`}
                title={isHungarian ? 'Pihenőnap' : 'Rest Day'}
                desc={
                  isHungarian
                    ? 'Ezen a napon nem volt rögzített edzésed. A pihenés és a regeneráció a fejlődés alapja!'
                    : 'No workout was logged on this day.'
                }
              />
              <RecoveryPillarsCard
                key={`month-past-rest-${selectedDateKey}`}
                date={selectedDate}
              />
            </View>
          )
        ) : isRest ? (
          <View>
            <RestDayCard
              date={selectedDate}
              dayIndex={selectedDayOfWeekIndex}
              customEyebrow={customEyebrow}
              onStartWorkout={async () => {
                setTargetDayIndexForAdd(selectedDayOfWeekIndex);
                await setDayAsWorkout(selectedDayOfWeekIndex);
                router.navigate('/(tabs)/library');
              }}
            />
            <RecoveryPillarsCard
              key={`month-rest-${selectedDay}`}
              date={selectedDate}
            />
          </View>
        ) : (
          <WorkoutList
            activeDay={activeDay}
            dayIndex={selectedDayOfWeekIndex}
            customEyebrow={customEyebrow}
            isToday={isToday}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  monthHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthLabel: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  monthTitle: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiChip: {
    backgroundColor: '#121C32',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  kpiNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  kpiLabel: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontWeight: '500',
  },
  gridWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  selectedDayContainer: {
    marginTop: 4,
  },
});
