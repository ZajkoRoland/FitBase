import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { usePlan } from '@/context/PlanProvider';
import { useProfile } from '@/context/ProfileProvider';
import { calorieService } from '@/services/CalorieService';
import { Exercise, PlanService } from '@/services/PlanService';
import { exerciseLookupService } from '@/services/ExerciseLookupService';
import type { ExerciseDetail } from '@/types/exercise';
import { ExercisePoseMotionPlayer } from '@/components/common/ExercisePoseMotionPlayer';
import { EditExerciseSetsModal } from '@/components/plan/EditExerciseSetsModal';

export type TimerBlockMode = 'timer' | 'exercises';

interface HomeExerciseCardProps {
  readonly exercise: Exercise;
  readonly index: number;
  readonly isChecked: boolean;
  readonly canInteract: boolean;
  readonly isViewingToday: boolean;
  readonly exCalories: number;
  readonly onToggleCheck: () => void;
  readonly onEditSets: () => void;
}

function HomeExerciseCard({
  exercise,
  index,
  isChecked,
  canInteract,
  isViewingToday,
  exCalories,
  onToggleCheck,
  onEditSets,
}: HomeExerciseCardProps): React.JSX.Element {
  const { t, i18n } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);

  useEffect(() => {
    if (isExpanded && !detail) {
      let isMounted = true;
      exerciseLookupService
        .resolveExerciseDetails(exercise)
        .then((data) => {
          if (isMounted) setDetail(data);
        })
        .catch((err) => {
          console.warn('[HomeExerciseCard] Failed to load exercise detail:', err);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [isExpanded, detail, exercise]);

  const exerciseSets = useMemo(() => PlanService.ensureExerciseSets(exercise), [exercise]);
  const exerciseVolume = useMemo(() => PlanService.calculateTotalVolume(exerciseSets), [exerciseSets]);
  const exerciseBest1RM = useMemo(() => {
    return exerciseSets.reduce(
      (max, s) => Math.max(max, PlanService.calculateEstimated1RM(s.weightKg, s.reps)),
      0
    );
  }, [exerciseSets]);

  const startImageUrl = detail?.images?.start || exercise.startImageUrl;
  const peakImageUrl = detail?.images?.peak || exercise.peakImageUrl;
  const localizedTitle = i18n.translateExerciseTitle(exercise.title, exercise.slug);

  return (
    <View
      style={[
        timerStyle.exerciseCardContainer,
        isChecked && timerStyle.exerciseItemChecked,
        !canInteract && timerStyle.exerciseItemLocked,
      ]}
    >
      {/* Kattintható fejlécsor: lenyitás és összecsukás */}
      <Pressable
        style={timerStyle.exerciseCardHeader}
        onPress={() => setIsExpanded((prev) => !prev)}
      >
        <View style={timerStyle.exerciseLeftCol}>
          <Text
            style={[
              timerStyle.exerciseIndex,
              isChecked && timerStyle.exerciseTextMuted,
            ]}
          >
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>

        <View style={timerStyle.exerciseMidCol}>
          <Text
            style={[
              timerStyle.exerciseTitle,
              isChecked && timerStyle.exerciseTitleChecked,
            ]}
            numberOfLines={1}
          >
            {localizedTitle}
          </Text>
          <View style={timerStyle.exerciseMetaRow}>
            {exercise.details ? (
              <Text style={timerStyle.exerciseDetails} numberOfLines={1}>
                {i18n.translateExerciseDetails(exercise.details)}
              </Text>
            ) : null}
            {exercise.badgeText ? (
              <View style={timerStyle.exerciseBadge}>
                <Text style={timerStyle.exerciseBadgeText} numberOfLines={1}>
                  {i18n.translateBadgeText(exercise.badgeText)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Jobb oldali gombok */}
        <View style={timerStyle.exerciseRightActions}>
          {/* Befejezést jelölő pipa */}
          <TouchableOpacity
            disabled={!canInteract}
            style={[
              timerStyle.checkBtn,
              isChecked && timerStyle.checkBtnChecked,
              !isViewingToday && timerStyle.checkBtnReadOnly,
            ]}
            activeOpacity={0.7}
            onPress={onToggleCheck}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isChecked ? (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            ) : !isViewingToday ? (
              <Ionicons name="lock-closed" size={11} color="#4A6282" />
            ) : null}
          </TouchableOpacity>

          {/* Nyíl ikon */}
          <View style={timerStyle.chevronWrapper}>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={isExpanded ? Colors.accent.blue : '#506888'}
            />
          </View>
        </View>
      </Pressable>

      {/* Kinyitott részletek */}
      {isExpanded && (
        <View style={timerStyle.expandedContent}>
          <View style={timerStyle.expandedDivider} />

          {/* 1. Gyakorlat animáció */}
          {(startImageUrl || peakImageUrl) ? (
            <View style={timerStyle.motionPlayerWrapper}>
              <ExercisePoseMotionPlayer
                startImageUrl={startImageUrl}
                peakImageUrl={peakImageUrl}
                exerciseTitle={localizedTitle}
                cycleDurationMs={2000}
                height={160}
              />
            </View>
          ) : null}

          {/* 2. Sorozatok és súlyok részletezése */}
          <View style={timerStyle.setsBlock}>
            <View style={timerStyle.setsBlockHeader}>
              <View style={timerStyle.setsBlockTitleRow}>
                <Ionicons name="barbell-outline" size={14} color={Colors.accent.blue} />
                <Text style={timerStyle.setsBlockTitle}>{t('plan.setsSummaryHeading')}</Text>
              </View>

              {canInteract && (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={onEditSets}
                  style={timerStyle.editSetsChip}
                >
                  <Ionicons name="create-outline" size={12} color={Colors.accent.blue} />
                  <Text style={timerStyle.editSetsChipText}>{t('plan.editSetsBtnShort')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sorozat címkék */}
            <View style={timerStyle.setBadgesRow}>
              {exerciseSets.map((s) => (
                <View key={s.setNumber} style={timerStyle.setPill}>
                  <Text style={timerStyle.setPillNum}>#{s.setNumber}</Text>
                  <Text style={timerStyle.setPillText}>
                    {s.weightKg > 0
                      ? `${s.reps} × ${s.weightKg} kg`
                      : `${s.reps} ${t('plan.repsSuffix')}`}
                  </Text>
                </View>
              ))}
            </View>

            {/* Pihenőidő, kalória és volumen */}
            <View style={timerStyle.setsMetaRow}>
              <View style={timerStyle.setsMetaLeft}>
                <View style={timerStyle.restBadge}>
                  <Ionicons name="time-outline" size={12} color="#60A5FA" />
                  <Text style={timerStyle.restBadgeText}>
                    {exercise.restSeconds || 60} {t('plan.restSuffix')}
                  </Text>
                </View>

                <View style={timerStyle.calorieBadge}>
                  <Ionicons name="flame" size={11} color={Colors.accent.orange} />
                  <Text style={timerStyle.calorieBadgeText}>~{exCalories} kcal</Text>
                </View>
              </View>

              {exerciseVolume > 0 && (
                <Text style={timerStyle.volumeText}>
                  {t('plan.totalVolumeBadge', { vol: exerciseVolume.toLocaleString() })}
                  {exerciseBest1RM > 0 ? ` · ${t('plan.best1RMBadge', { oneRm: exerciseBest1RM })}` : ''}
                </Text>
              )}
            </View>
          </View>

          {/* 3. Rövid leírás */}
          {detail?.description ? (
            <View style={timerStyle.shortDescBox}>
              <Text style={timerStyle.shortDescText} numberOfLines={3}>
                {detail.description}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

export function TimerBlock(): React.JSX.Element {
  const router = useRouter();
  const { language, t, i18n, isHungarian } = useLanguage();
  const { profile } = useProfile();
  const {
    weekPlan,
    setActiveDayIndex,
    completedExerciseIds,
    toggleExerciseCompletion,
    isTodayWorkoutFinalized,
    finalizeTodayWorkout,
    todayIndex,
    selectedHomeDayIndex,
    setSelectedHomeDayIndex,
    updateExerciseInDay,
  } = usePlan();

  // Nézetmód: edzésstopper vagy gyakorlatlista áttekintés
  const [activeMode, setActiveMode] = useState<TimerBlockMode>('exercises');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'rest'>('rest');

  const [doneNotice, setDoneNotice] = useState<string | null>(null);

  const isViewingToday = selectedHomeDayIndex === todayIndex;
  const currentWorkoutDay = weekPlan?.[selectedHomeDayIndex];
  const exercises = currentWorkoutDay?.exercises ?? [];
  const isRestDay = currentWorkoutDay?.type === 'rest';

  const dayForms = i18n.getDayForms(selectedHomeDayIndex);
  const selectedDayName = dayForms.full;

  const checkedCount = useMemo(() => {
    if (!isViewingToday) return 0;
    return exercises.filter((e) => Boolean(completedExerciseIds[e.id])).length;
  }, [isViewingToday, exercises, completedExerciseIds]);

  const handleFinishWorkout = useCallback(async () => {
    if (!isViewingToday || isTodayWorkoutFinalized) return;
    if (checkedCount === 0) {
      setDoneNotice(t('home.routine.checkAtLeastOneNotice'));
      setTimeout(() => setDoneNotice(null), 3500);
      return;
    }
    const res = await finalizeTodayWorkout();
    if (res.success) {
      setDoneNotice(t('home.routine.completedStreakNotice'));
      setTimeout(() => setDoneNotice(null), 4000);
    }
  }, [isViewingToday, isTodayWorkoutFinalized, checkedCount, finalizeTodayWorkout, t]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const toggleTimer = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning((prev) => !prev);
    }
  }, [timeLeft]);

  const setWork = useCallback(() => {
    setTimeLeft(40);
    setMode('work');
    setIsRunning(false);
  }, []);

  const setRest = useCallback(() => {
    setTimeLeft(60);
    setMode('rest');
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setTimeLeft(mode === 'work' ? 40 : 60);
    setIsRunning(false);
  }, [mode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleExercise = useCallback((id: string) => {
    if (!isViewingToday) {
      setDoneNotice(t('home.routine.onlyTodayCheckNotice'));
      setTimeout(() => setDoneNotice(null), 3000);
      return;
    }
    toggleExerciseCompletion(id);
  }, [isViewingToday, toggleExerciseCompletion, t]);

  const handleOpenPlan = useCallback(() => {
    setActiveDayIndex(selectedHomeDayIndex);
    router.navigate('/(tabs)/plan');
  }, [selectedHomeDayIndex, setActiveDayIndex, router]);

  const routineHeaderText = activeMode === 'timer'
    ? t('home.timer.workoutTimerHeader')
    : isViewingToday
      ? t('home.timer.todaysRoutineHeader')
      : t('home.timer.dayRoutineHeader', {
          day: isHungarian ? dayForms.adjectival.toUpperCase() : dayForms.full.toUpperCase(),
        });

  const localizedWorkoutTitle = currentWorkoutDay?.workoutTitle
    ? i18n.translateWorkoutTitle(currentWorkoutDay.workoutTitle)
    : undefined;

  return (
    <View key={language} style={timerStyle.container}>
      {/* Fejlécsor címmel és nézetváltóval */}
      <View style={timerStyle.headerRow}>
        <Text style={timerStyle.headerText}>
          {routineHeaderText}
        </Text>

          <View style={timerStyle.switchContainer}>
          <TouchableOpacity
            style={[
              timerStyle.switchBtn,
              activeMode === 'timer' && timerStyle.switchBtnActive,
            ]}
            activeOpacity={0.75}
            onPress={() => setActiveMode('timer')}
          >
            <Text
              style={[
                timerStyle.switchText,
                activeMode === 'timer' && timerStyle.switchTextActive,
              ]}
            >
              {t('home.timer.tabTimer')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              timerStyle.switchBtn,
              activeMode === 'exercises' && timerStyle.switchBtnActive,
            ]}
            activeOpacity={0.75}
            onPress={() => setActiveMode('exercises')}
          >
            <Text
              style={[
                timerStyle.switchText,
                activeMode === 'exercises' && timerStyle.switchTextActive,
              ]}
            >
              {t('home.timer.tabRoutine')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Időzítő nézet */}
      {activeMode === 'timer' ? (
        <View style={timerStyle.timerBody}>
          <TouchableOpacity
            style={[
              timerStyle.timerCircle,
              isRunning && {
                borderColor: Colors.accent.blue,
                backgroundColor: 'rgba(74, 184, 248, 0.05)',
              },
            ]}
            activeOpacity={0.8}
            onPress={toggleTimer}
          >
            <Text
              style={[
                timerStyle.timerValue,
                isRunning && { color: Colors.accent.blue },
              ]}
            >
              {formatTime(timeLeft)}
            </Text>
            <Text
              style={[
                timerStyle.tapToStart,
                isRunning && { color: Colors.accent.green },
              ]}
            >
              {timeLeft === 0
                ? t('home.timer.done')
                : isRunning
                  ? t('home.timer.tapToPause')
                  : t('home.timer.tapToStart')}
            </Text>
          </TouchableOpacity>

              <View style={timerStyle.controlsRow}>
            <TouchableOpacity
              style={[
                timerStyle.pillBtn,
                mode === 'work' && {
                  borderColor: Colors.accent.blue,
                  backgroundColor: 'rgba(74, 184, 248, 0.08)',
                },
              ]}
              activeOpacity={0.7}
              onPress={setWork}
            >
              <Text
                style={[
                  timerStyle.pillValue,
                  mode === 'work' && { color: Colors.text.primary },
                ]}
              >
                {t('home.timer.seconds40')}
              </Text>
              <Text
                style={[
                  timerStyle.pillLabel,
                  mode === 'work' && { color: Colors.accent.blue },
                ]}
              >
                {t('home.timer.work')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                timerStyle.pillBtn,
                mode === 'rest' && {
                  borderColor: Colors.accent.blue,
                  backgroundColor: 'rgba(74, 184, 248, 0.08)',
                },
              ]}
              activeOpacity={0.7}
              onPress={setRest}
            >
              <Text
                style={[
                  timerStyle.pillValue,
                  mode === 'rest' && { color: Colors.text.primary },
                ]}
              >
                {t('home.timer.seconds60')}
              </Text>
              <Text
                style={[
                  timerStyle.pillLabel,
                  mode === 'rest' && { color: Colors.accent.blue },
                ]}
              >
                {t('home.timer.rest')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={timerStyle.resetBtn}
              activeOpacity={0.7}
              onPress={resetTimer}
            >
              <Ionicons name="refresh-outline" size={24} color="#4A6282" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ================================================================ */
        /* 2. nézet: Mai edzés gyakorlatai */
        /* ================================================================ */
        <View style={timerStyle.exercisesBody}>
          {isRestDay ? (
            <View style={[timerStyle.restContainer, !isViewingToday && timerStyle.previewDimmed]}>
              <View style={timerStyle.restIconWrapper}>
                <Ionicons name="moon" size={24} color={Colors.accent.amber} />
              </View>
              <Text style={timerStyle.restTitle}>
                {isViewingToday
                  ? t('home.routine.restAndRecovery')
                  : t('home.routine.dayRestDay', { day: selectedDayName })}
              </Text>
              <Text style={timerStyle.restDesc}>
                {isViewingToday
                  ? t('home.routine.restTodayDesc')
                  : t('home.routine.restOtherDayDesc', {
                      day: isHungarian ? dayForms.sublative : selectedDayName,
                    })}
              </Text>

              <View style={timerStyle.restBtnRow}>
                {!isViewingToday ? (
                  <TouchableOpacity
                    style={[timerStyle.actionBtn, timerStyle.actionBtnSecondary, { flex: 1 }]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedHomeDayIndex(todayIndex)}
                  >
                    <Ionicons name="arrow-back-circle-outline" size={16} color={Colors.text.primary} style={{ marginRight: 6 }} />
                    <Text style={timerStyle.actionBtnSecText}>{t('home.routine.backToToday')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[timerStyle.actionBtn, timerStyle.actionBtnSecondary, { flex: 1 }]}
                    activeOpacity={0.7}
                    onPress={handleOpenPlan}
                  >
                    <Text style={timerStyle.actionBtnSecText}>{t('home.routine.viewFullPlan')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : exercises.length === 0 ? (
            <View style={timerStyle.routineContainer}>
              <View style={timerStyle.routineTopRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={timerStyle.routineTitle} numberOfLines={1}>
                    {localizedWorkoutTitle || t('home.routine.workoutDefault')}
                  </Text>
                </View>
                <Text style={timerStyle.routineCount}>{i18n.formatExerciseCount(0)}</Text>
              </View>

              <View style={[timerStyle.restContainer, !isViewingToday && timerStyle.previewDimmed]}>
                <View style={[timerStyle.restIconWrapper, { backgroundColor: 'rgba(74, 184, 248, 0.12)' }]}>
                  <Ionicons name="barbell-outline" size={24} color={Colors.accent.blue} />
                </View>
                <Text style={timerStyle.restTitle}>
                  {isViewingToday
                    ? t('home.routine.emptyWorkoutTitle')
                    : t('home.routine.dayWorkoutTitle', { day: selectedDayName })}
                </Text>
                <Text style={timerStyle.restDesc}>
                  {isViewingToday
                    ? t('home.routine.emptyTodayDesc')
                    : t('home.routine.emptyOtherDayDesc', {
                        day: isHungarian ? dayForms.adjectival : selectedDayName,
                      })}
                </Text>

                <View style={timerStyle.restBtnRow}>
                  {!isViewingToday && (
                    <TouchableOpacity
                      style={[timerStyle.actionBtn, timerStyle.actionBtnSecondary, { flex: 1 }]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedHomeDayIndex(todayIndex)}
                    >
                      <Ionicons name="arrow-back-circle-outline" size={16} color={Colors.text.primary} style={{ marginRight: 6 }} />
                      <Text style={timerStyle.actionBtnSecText}>{t('home.routine.backToToday')}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[timerStyle.actionBtn, { flex: 1 }]}
                    activeOpacity={0.7}
                    onPress={handleOpenPlan}
                  >
                    <Text style={timerStyle.actionBtnText}>{t('home.routine.addExercisesBtn')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={timerStyle.routineContainer}>
                  <View style={timerStyle.routineTopRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={timerStyle.routineTitle} numberOfLines={1}>
                    {localizedWorkoutTitle ||
                      t('home.routine.daySessionFallback', {
                        day: isHungarian ? dayForms.adjectivalCap : selectedDayName,
                      })}
                  </Text>
                  {!isViewingToday && (
                    <View style={timerStyle.previewBadgeRow}>
                      <Ionicons name="eye-outline" size={12} color="#60A5FA" />
                      <Text style={timerStyle.previewBadgeText}>{t('home.routine.previewReadOnly')}</Text>
                    </View>
                  )}
                </View>
                <Text style={timerStyle.routineCount}>
                  {i18n.formatExerciseCount(exercises.length)}
                </Text>
              </View>

              {/* Gyakorlatok listája */}
              <View style={[timerStyle.exerciseList, !isViewingToday && timerStyle.previewDimmed]}>
                {exercises.map((ex, index) => {
                  const isChecked = isViewingToday && Boolean(completedExerciseIds[ex.id]);
                  const exCalories = calorieService.calculateExerciseCalories(
                    ex,
                    profile?.weight || 75
                  );
                  const canInteract = isViewingToday && !isTodayWorkoutFinalized;

                  return (
                    <HomeExerciseCard
                      key={ex.id}
                      exercise={ex}
                      index={index}
                      isChecked={isChecked}
                      canInteract={canInteract}
                      isViewingToday={isViewingToday}
                      exCalories={exCalories}
                      onToggleCheck={() => handleToggleExercise(ex.id)}
                      onEditSets={() => setEditingExercise(ex)}
                    />
                  );
                })}
              </View>

              {/* Edzés befejezése gomb */}
              <View style={timerStyle.routineFooter}>
                {doneNotice && (
                  <View style={timerStyle.doneNoticeBox}>
                    <Text style={timerStyle.doneNoticeText}>{doneNotice}</Text>
                  </View>
                )}

                {!isViewingToday ? (
                  <TouchableOpacity
                    style={timerStyle.returnToTodayBtn}
                    activeOpacity={0.8}
                    onPress={() => setSelectedHomeDayIndex(todayIndex)}
                  >
                    <Ionicons name="arrow-back-circle-outline" size={18} color="#60A5FA" />
                    <Text style={timerStyle.returnToTodayText}>{t('home.routine.backToTodayRoutine')}</Text>
                  </TouchableOpacity>
                ) : isTodayWorkoutFinalized ? (
                  <View style={timerStyle.doneSuccessCard}>
                    <View style={timerStyle.doneSuccessIconRow}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.accent.green} />
                      <Text style={timerStyle.doneSuccessTitle}>{t('home.routine.workoutCompletedBadge')}</Text>
                    </View>
                    <Text style={timerStyle.doneSuccessSub}>
                      {t('home.routine.completedSummaryLocked', {
                        checked: checkedCount,
                        total: exercises.length,
                      })}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      timerStyle.finishWorkoutBtn,
                      checkedCount > 0 && timerStyle.finishWorkoutBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={handleFinishWorkout}
                  >
                    <LinearGradient
                      colors={checkedCount > 0 ? [Colors.accent.green, '#059669'] : ['#1E2D4A', '#162238']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={timerStyle.finishBtnGradient}
                    >
                      <Ionicons
                        name={checkedCount > 0 ? 'checkmark-circle' : 'flag-outline'}
                        size={20}
                        color={checkedCount > 0 ? '#0D1528' : '#627A9B'}
                      />
                      <Text
                        style={[
                          timerStyle.finishBtnText,
                          checkedCount > 0 && timerStyle.finishBtnTextActive,
                        ]}
                      >
                        {t('home.routine.doneBtn')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Sorozatok és súlyok szerkesztése modál */}
      {Boolean(editingExercise) && (
        <EditExerciseSetsModal
          visible={Boolean(editingExercise)}
          exercise={editingExercise}
          onClose={() => setEditingExercise(null)}
          onSave={async (updatedSets, restSeconds) => {
            if (editingExercise) {
              try {
                await updateExerciseInDay(selectedHomeDayIndex, editingExercise.id, {
                  sets: updatedSets,
                  restSeconds,
                });
              } catch (err) {
                console.warn('[TimerBlock] Failed to save deviation sets:', err);
              } finally {
                setEditingExercise(null);
              }
            }
          }}
        />
      )}
    </View>
  );
}

const timerStyle = StyleSheet.create({
  container: {
    backgroundColor: '#152038',
    borderRadius: 36,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#1E2D4A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerText: {
    color: '#4A6282',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    flex: 1,
    marginRight: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1528',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  switchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  switchBtnActive: {
    backgroundColor: '#1E2D4A',
  },
  switchText: {
    color: '#4A6282',
    fontSize: 11,
    fontWeight: '600',
  },
  switchTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timerBody: {
    alignItems: 'center',
  },
  timerCircle: {
    width: 216,
    height: 216,
    borderRadius: 108,
    borderWidth: 3,
    borderColor: '#1E2D4A',
    backgroundColor: 'rgba(13, 21, 40, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  timerValue: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: '800',
    fontFamily: 'monospace',
    fontVariant: ['tabular-nums'],
    lineHeight: 58,
  },
  tapToStart: {
    color: '#4A6282',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  pillBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  pillValue: {
    color: '#4A6282',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pillLabel: {
    color: '#4A6282',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  resetBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exercisesBody: {
    width: '100%',
  },
  restContainer: {
    backgroundColor: 'rgba(13, 21, 40, 0.5)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  restIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  restTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  restDesc: {
    color: '#627A9B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  restBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  routineContainer: {
    width: '100%',
  },
  exerciseList: {
    width: '100%',
  },
  routineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  routineTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  routineCount: {
    color: Colors.accent.blue,
    fontSize: 12,
    fontWeight: '600',
  },
  exerciseCardContainer: {
    backgroundColor: 'rgba(13, 21, 40, 0.45)',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    overflow: 'hidden',
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  exerciseItemChecked: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  chevronWrapper: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 2,
  },
  motionPlayerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  setsBlock: {
    backgroundColor: '#0D1528',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  setsBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  setsBlockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setsBlockTitle: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  editSetsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(74, 184, 248, 0.1)',
  },
  editSetsChipText: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '700',
  },
  setBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  setPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#152038',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  setPillNum: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '800',
  },
  setPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  setsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  setsMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  restBadgeText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '600',
  },
  volumeText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  shortDescBox: {
    backgroundColor: 'rgba(13, 21, 40, 0.3)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  shortDescText: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
  exerciseLeftCol: {
    width: 28,
    alignItems: 'center',
  },
  exerciseIndex: {
    color: Colors.accent.blue,
    fontSize: 12,
    fontWeight: '800',
  },
  exerciseTextMuted: {
    color: '#60A5FA',
  },
  exerciseMidCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  exerciseTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  exerciseTitleChecked: {
    color: '#E2E8F0',
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  exerciseDetails: {
    color: '#627A9B',
    fontSize: 11,
    flexShrink: 1,
  },
  exerciseBadge: {
    backgroundColor: 'rgba(74, 184, 248, 0.08)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    flexShrink: 0,
  },
  exerciseBadgeText: {
    color: Colors.accent.blue,
    fontSize: 9,
    fontWeight: '700',
  },
  exerciseRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  adjustSetsBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.3)',
  },
  checkBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#2A3C58',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21, 32, 56, 0.7)',
  },
  checkBtnChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#38BDF8',
  },
  checkInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 109, 0, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 109, 0, 0.25)',
  },
  calorieBadgeText: {
    color: Colors.accent.orange,
    fontSize: 10,
    fontWeight: '700',
  },
  exerciseItemLocked: {
    opacity: 0.85,
  },
  routineFooter: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 12,
  },
  doneNoticeBox: {
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    width: '100%',
  },
  doneNoticeText: {
    color: '#FFB800',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  doneSuccessCard: {
    width: '100%',
    backgroundColor: 'rgba(0, 230, 118, 0.10)',
    borderWidth: 1.5,
    borderColor: Colors.accent.green,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  doneSuccessIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doneSuccessTitle: {
    color: Colors.accent.green,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  doneSuccessSub: {
    color: '#A0B2C6',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  finishWorkoutBtn: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#223554',
    backgroundColor: '#162238',
    overflow: 'hidden',
  },
  finishWorkoutBtnActive: {
    borderColor: Colors.accent.green,
  },
  finishBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  finishBtnText: {
    color: '#627A9B',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  finishBtnTextActive: {
    color: '#0D1528',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(74, 184, 248, 0.1)',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.25)',
  },
  actionBtnText: {
    color: Colors.accent.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: '#1E2D4A',
  },
  actionBtnSecText: {
    color: '#8BA1C1',
    fontSize: 12,
    fontWeight: '600',
  },
  previewDimmed: {
    opacity: 0.65,
  },
  previewBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  previewBadgeText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  checkBtnReadOnly: {
    borderColor: '#1E2D4A',
    backgroundColor: 'rgba(21, 32, 56, 0.5)',
  },
  returnToTodayBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  returnToTodayText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
