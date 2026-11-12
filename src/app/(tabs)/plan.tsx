import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageProvider';
import { usePlan } from '@/context/PlanProvider';
import { WeeklyCalendar } from '@/components/plan/WeeklyCalendar';
import { RestDayCard } from '@/components/plan/RestDayCard';
import { WorkoutList } from '@/components/plan/WorkoutList';
import { RecoveryPillarsCard } from '@/components/plan/RecoveryPillarsCard';
import { MonthPlanDashboard } from '@/components/plan/MonthPlanDashboard';
import { PlanViewMode } from '@/components/plan/PlanViewSwitcher';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { ConfirmActionModal } from '@/components/common/ConfirmActionModal';
import { PlanQuickActionModal } from '@/components/plan/PlanQuickActionModal';
import { BuildPlanModal } from '@/components/plan/BuildPlanModal';
import { PlanStructureCategory } from '@/models/WorkoutPlanStructure';
import { DateHelper } from '@/utils/DateHelper';
import { Exercise, PlanService, WorkoutDay } from '@/services/PlanService';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, isHungarian, t, i18n } = useLanguage();
  const [viewMode, setViewMode] = useState<PlanViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const {
    weekPlan,
    activeDayIndex,
    setActiveDayIndex,
    setDayAsRest,
    setDayAsWorkout,
    clearWeekPlan,
    applyPlanStructure,
    duplicateNotice,
    clearDuplicateNotice,
    currentWeekIndex,
    setCurrentWeekIndex,
    totalWeeks,
    historicalSessions,
  } = usePlan();

  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [showBuildPlanModal, setShowBuildPlanModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (duplicateNotice) {
      const timer = setTimeout(() => {
        clearDuplicateNotice();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [duplicateNotice, clearDuplicateNotice]);

  if (!weekPlan || weekPlan.length === 0) {
    return (
      <View style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: Colors.text.secondary, fontSize: 16 }}>
          {t('plan.emptyPlanText')}
        </Text>
      </View>
    );
  }

  const activeDay = weekPlan[activeDayIndex] || weekPlan[0];
  const activeDayName = DateHelper.getFullDayName(activeDay?.day || activeDayIndex);
  const isRestDay = activeDay?.type === 'rest';

  const activeDate = useMemo(() => {
    const monday = DateHelper.getMonday(currentDate);
    const d = new Date(monday);
    d.setDate(monday.getDate() + activeDayIndex);
    return d;
  }, [currentDate, activeDayIndex]);

  const activeDateKey = useMemo(() => {
    const y = activeDate.getFullYear();
    const m = String(activeDate.getMonth() + 1).padStart(2, '0');
    const day = String(activeDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, [activeDate]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const isPastDay = activeDateKey < todayKey;
  const isToday = activeDateKey === todayKey;
  const pastSession = isPastDay ? historicalSessions?.[activeDateKey] : null;

  const historicalDay: WorkoutDay = useMemo(() => {
    if (!pastSession) {
      return {
        day: PlanService.DAY_NAMES[activeDayIndex] || 'Mon',
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
      day: PlanService.DAY_NAMES[activeDayIndex] || 'Mon',
      type: 'workout',
      subtitle: isHungarian ? 'Elvégzett edzés' : 'Completed Workout',
      workoutTitle: pastSession.workout_title || (isHungarian ? 'Edzés' : 'Workout'),
      workoutMeta: `${pastSession.exercises_completed || sessionExercises.length} ${isHungarian ? 'gyakorlat' : 'exercises'} · ${pastSession.duration_minutes || 0} perc · ${pastSession.calories_burned || 0} kcal`,
      exercises: sessionExercises,
    };
  }, [pastSession, activeDayIndex, isHungarian]);

  const handleOpenBuildPlan = () => {
    setShowQuickActionModal(false);
    setShowBuildPlanModal(true);
  };

  const handleAddExercise = () => {
    setShowQuickActionModal(false);
    setActiveDayIndex(activeDayIndex);
    router.navigate('/(tabs)/library');
  };

  const handleToggleRestDay = async () => {
    setShowQuickActionModal(false);
    if (isRestDay) {
      await setDayAsWorkout(activeDayIndex);
    } else {
      await setDayAsRest(activeDayIndex);
    }
  };

  const handlePromptClearPlan = () => {
    setShowQuickActionModal(false);
    setShowResetConfirm(true);
  };

  const handleConfirmClear = async () => {
    setShowResetConfirm(false);
    await clearWeekPlan();
  };

  const handleSelectPlanStructure = async (
    category: PlanStructureCategory,
    mode: 'ai' | 'custom' = 'custom'
  ) => {
    setShowBuildPlanModal(false);
    await applyPlanStructure(category);

    if (mode === 'ai') {
      const promptKey = `coach.aiPrompt.${category.id}`;
      const defaultText = isHungarian
        ? `Kérlek, állíts össze nekem egy ${category.weeksCount} hetes edzéstervet a céljaim és az adataim alapján!`
        : `Please create a ${category.weeksCount}-week workout plan for me based on my profile and goals!`;
      const promptText = t(promptKey) !== promptKey ? t(promptKey) : defaultText;

      router.navigate({
        pathname: '/(tabs)/coach',
        params: {
          initialPrompt: promptText,
          autoSend: 'true',
        },
      });
    } else {
      setViewMode('month');
    }
  };

  const getDuplicateBodyText = () => {
    if (!duplicateNotice) return '';
    const title = i18n.translateExerciseTitle(duplicateNotice.title, duplicateNotice.slug);
    const dayForms = i18n.getDayForms(duplicateNotice.dayName);
    const dayStr = isHungarian ? dayForms.adjectival : `${dayForms.full}'s routine`;
    return t('plan.duplicateBody', { title, day: dayStr });
  };

  return (
    <View key={language} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <WeeklyCalendar
          weekPlan={weekPlan}
          activeDayIndex={activeDayIndex}
          setActiveDayIndex={setActiveDayIndex}
          topInset={insets.top}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddPress={() => setShowQuickActionModal(true)}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          totalWeeks={totalWeeks}
          currentWeekIndex={currentWeekIndex}
          onCycleIndexChange={setCurrentWeekIndex}
          historicalSessions={historicalSessions}
        />

        {viewMode === 'month' ? (
          <MonthPlanDashboard
            weekPlan={weekPlan}
            currentWeekIndex={currentWeekIndex}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onOpenWeek={(weekIndex) => {
              setCurrentWeekIndex(weekIndex);
              setViewMode('week');
            }}
          />
        ) : isPastDay ? (
          pastSession ? (
            <WorkoutList
              activeDay={historicalDay}
              dayIndex={activeDayIndex}
              isHistorical={true}
              customEyebrow={isHungarian ? `Elvégzett edzés · ${activeDateKey}` : `Completed Session · ${activeDateKey}`}
            />
          ) : (
            <View>
              <RestDayCard
                date={activeDate}
                dayIndex={activeDayIndex}
                customEyebrow={isHungarian ? `Elmúlt nap · ${activeDateKey}` : `Past Day · ${activeDateKey}`}
                title={isHungarian ? 'Pihenőnap' : 'Rest Day'}
                desc={
                  isHungarian
                    ? 'Ezen a napon nem volt rögzített edzésed. A pihenés és a regeneráció a fejlődés alapja!'
                    : 'No workout was logged on this day. Rest and recovery are essential for progress!'
                }
              />
              <RecoveryPillarsCard
                key={`past-week-rest-${activeDateKey}`}
                date={activeDate}
              />
            </View>
          )
        ) : activeDay.type === 'rest' ? (
          <View>
            <RestDayCard
              date={activeDate}
              dayIndex={activeDayIndex}
              onStartWorkout={async () => {
                setActiveDayIndex(activeDayIndex);
                await setDayAsWorkout(activeDayIndex);
                router.navigate('/(tabs)/library');
              }}
            />
            <RecoveryPillarsCard
              key={`week-rest-${activeDayIndex}`}
              date={activeDate}
            />
          </View>
        ) : (
          <WorkoutList
            activeDay={activeDay}
            dayIndex={activeDayIndex}
            isToday={isToday}
          />
        )}
      </ScrollView>

      {/* Duplikált gyakorlat figyelmeztetés */}
      {duplicateNotice && (
        <View style={[styles.toastBanner, { top: insets.top + 8 }]}>
          <Ionicons name="information-circle" size={20} color="#FFB800" />
          <View style={styles.toastTextCol}>
            <Text style={styles.toastTitle}>{t('plan.duplicateTitle')}</Text>
            <Text style={styles.toastBody} numberOfLines={2}>
              {getDuplicateBodyText()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={clearDuplicateNotice}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.toastCloseBtn}
          >
            <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>
      )}

      {/* Gyorsműveletek modál */}
      <PlanQuickActionModal
        visible={showQuickActionModal}
        dayName={activeDayName}
        dayIndex={activeDayIndex}
        isRestDay={isRestDay}
        onClose={() => setShowQuickActionModal(false)}
        onBuildPlan={handleOpenBuildPlan}
        onAddExercise={handleAddExercise}
        onToggleRestDay={handleToggleRestDay}
        onDeleteEntirePlan={handlePromptClearPlan}
      />

      {/* Edzésterv készítő modál */}
      <BuildPlanModal
        visible={showBuildPlanModal}
        onClose={() => setShowBuildPlanModal(false)}
        onSelectStructure={handleSelectPlanStructure}
      />

      {/* Edzésterv törlés megerősítő modálablak */}
      <ConfirmActionModal
        visible={showResetConfirm}
        title={t('plan.deletePlanTitle')}
        description={t('plan.deletePlanDesc')}
        confirmText={t('plan.deleteAllBtn')}
        cancelText={t('common.cancel')}
        iconName="trash-outline"
        isDestructive={true}
        requireHoldToConfirm={true}
        holdDurationMs={3000}
        onConfirm={handleConfirmClear}
        onCancel={() => setShowResetConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D1528',
  },
  container: {
    flex: 1,
  },
  toastBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2A44',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 184, 0, 0.40)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  toastTextCol: {
    flex: 1,
  },
  toastTitle: {
    color: '#FFB800',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  toastBody: {
    color: '#E0E8F5',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  toastCloseBtn: {
    padding: 4,
  },
});
