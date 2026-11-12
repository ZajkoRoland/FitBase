import { planRepository } from "@/repositories/PlanRepository";
import { Exercise, ExerciseSet, PlanService, WorkoutDay } from "@/services/PlanService";
import { calorieService } from "@/services/CalorieService";
import { NotificationService } from "@/services/NotificationService";
import { analyticsService } from "@/services/AnalyticsService";
import { resolveCatalogSlugFromTitle } from "@/services/ExerciseHuCatalog";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useAuth } from "./AuthProvider";
import { useProfile } from "./ProfileProvider";
import { DateHelper } from "@/utils/DateHelper";

import { PlanDurationType, PlanStructureCategory } from "@/models/WorkoutPlanStructure";
import { WorkoutClassifier } from "@/services/WorkoutClassifierService";
import { profileRepository } from "@/repositories/ProfileRepository";
import type { WorkoutSessionItem } from "@/types/profile";

export interface DuplicateNoticeInfo {
  readonly title: string;
  readonly dayName: string;
  readonly slug?: string;
}

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface PlanContextType {
  weekPlan: WorkoutDay[];
  plannedWorkoutDays: number;
  loading: boolean;
  refreshPlan: () => Promise<void>;
  activeDayIndex: number;
  setActiveDayIndex: (index: number) => void;
  targetDayIndexForAdd: number;
  setTargetDayIndexForAdd: (index: number) => void;
  removeExerciseFromDay: (dayIndex: number, exerciseId: string) => Promise<void>;
  setDayAsRest: (dayIndex: number) => Promise<void>;
  setDayAsWorkout: (dayIndex: number) => Promise<void>;
  clearWeekPlan: () => Promise<void>;
  resetPlanToDefault: () => Promise<void>;
  applyPlanStructure: (category: PlanStructureCategory) => Promise<void>;
  addExerciseToDay: (dayIndex: number, exercise: Exercise) => Promise<boolean>;
  updateExerciseInDay: (dayIndex: number, exerciseId: string, updated: Partial<Exercise>) => Promise<void>;
  duplicateNotice: DuplicateNoticeInfo | null;
  clearDuplicateNotice: () => void;
  planStructure: PlanDurationType;
  currentWeekIndex: number;
  setCurrentWeekIndex: (index: number) => void;
  totalWeeks: number;
  completedExerciseIds: Record<string, boolean>;
  toggleExerciseCompletion: (exerciseId: string) => Promise<void>;
  isTodayWorkoutCompleted: boolean;
  isTodayWorkoutFinalized: boolean;
  finalizeTodayWorkout: () => Promise<{ success: boolean; calories: number; checkedCount: number }>;
  todayIndex: number;
  selectedHomeDayIndex: number;
  setSelectedHomeDayIndex: (index: number) => void;
  historicalSessions: Record<string, WorkoutSessionItem>;
  refreshHistoricalSessions: () => Promise<void>;
}

const getTodayIndex = () => {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
};

const PlanContext = createContext<PlanContextType | null>(null);

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const { profile, settings, updateProfile, updateSettings, recordWorkoutCompleted } = useProfile();

  const [weekPlan, setWeekPlan] = useState<WorkoutDay[]>(() => PlanService.createEmptyWeekPlan());
  const [loading, setLoading] = useState(true);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(getTodayIndex());
  const [duplicateNotice, setDuplicateNotice] = useState<DuplicateNoticeInfo | null>(null);

  const [planStructure, setPlanStructure] = useState<PlanDurationType>('1_week');
  const [currentWeekIndex, setCurrentWeekIndexState] = useState<number>(0);
  const [totalWeeks, setTotalWeeks] = useState<number>(1);
  const [multiWeekData, setMultiWeekData] = useState<Record<number, WorkoutDay[]>>({});

  const [completedExerciseIds, setCompletedExerciseIds] = useState<Record<string, boolean>>({});
  const [isTodayWorkoutCompleted, setIsTodayWorkoutCompleted] = useState<boolean>(false);
  const [isTodayWorkoutFinalized, setIsTodayWorkoutFinalized] = useState<boolean>(false);
  const todayIndex = useMemo(() => getTodayIndex(), []);
  const [selectedHomeDayIndex, setSelectedHomeDayIndex] = useState<number>(getTodayIndex());
  const [historicalSessions, setHistoricalSessions] = useState<Record<string, WorkoutSessionItem>>({});

  const refreshHistoricalSessions = useCallback(async () => {
    if (!userId) return;
    try {
      const sessions = await profileRepository.getWorkoutSessions(90);
      const sessionMap: Record<string, WorkoutSessionItem> = {};
      for (const s of sessions) {
        if (s.session_date) {
          sessionMap[s.session_date] = s;
        }
      }
      setHistoricalSessions(sessionMap);
      await AsyncStorage.setItem(`@fitbase_sessions_${userId}`, JSON.stringify(sessionMap)).catch(() => {});
    } catch (e) {
      console.warn("Failed to refresh historical sessions:", e);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setHistoricalSessions({});
      return;
    }
    AsyncStorage.getItem(`@fitbase_sessions_${userId}`)
      .then((raw) => {
        if (raw) {
          try {
            setHistoricalSessions(JSON.parse(raw));
          } catch {}
        }
      })
      .catch(() => {});
    refreshHistoricalSessions();
  }, [userId, refreshHistoricalSessions]);

  const weekPlanRef = useRef(weekPlan);
  weekPlanRef.current = weekPlan;

  const multiWeekRef = useRef(multiWeekData);
  multiWeekRef.current = multiWeekData;

  const currentWeekIndexRef = useRef(currentWeekIndex);
  currentWeekIndexRef.current = currentWeekIndex;

  const totalWeeksRef = useRef(totalWeeks);
  totalWeeksRef.current = totalWeeks;

  // Tervezett heti edzésnapok számának kiszámítása az aktív terv alapján
  const plannedWorkoutDays = useMemo(() => {
    return PlanService.computeWeeklyTarget(weekPlan, profile?.weekly_target ?? 7);
  }, [weekPlan, profile?.weekly_target]);

  // Edzésterv szerkezetének szinkronizálása a beállításokból
  useEffect(() => {
    const struct = settings?.plan_structure;
    if (struct === '1_week' || struct === '2_week' || struct === '4_week') {
      const weeksCount = struct === '4_week' ? 4 : struct === '2_week' ? 2 : 1;
      setPlanStructure(struct);
      setTotalWeeks(weeksCount);
      totalWeeksRef.current = weeksCount;
    }
  }, [settings?.plan_structure]);

  // Mai elvégzett gyakorlatok és lezárási állapot betöltése
  useEffect(() => {
    if (!userId) {
      setCompletedExerciseIds({});
      setIsTodayWorkoutFinalized(false);
      setIsTodayWorkoutCompleted(false);
      return;
    }

    const todayKey = getTodayKey();
    const dbDaily = profile?.completed_exercises_today;

    if (dbDaily && dbDaily.date === todayKey) {
      setCompletedExerciseIds(dbDaily.exercise_ids || {});
      setIsTodayWorkoutFinalized(Boolean(dbDaily.finalized));
      return;
    }

    // Helyi gyorsítótár tartalék (AsyncStorage)
    const completedKey = `@fitbase_completed_${userId}_${todayKey}`;
    const finalizedKey = `@fitbase_workout_finalized_${userId}_${todayKey}`;

    AsyncStorage.getItem(completedKey)
      .then((raw) => {
        setCompletedExerciseIds(raw ? JSON.parse(raw) : {});
      })
      .catch(() => setCompletedExerciseIds({}));

    AsyncStorage.getItem(finalizedKey)
      .then((val) => {
        setIsTodayWorkoutFinalized(val === 'true');
      })
      .catch(() => setIsTodayWorkoutFinalized(false));
  }, [userId, profile?.completed_exercises_today]);

  // Edzés teljesítettségének ellenőrzése, ha a terv vagy a pipák változnak
  useEffect(() => {
    const todayWorkout = weekPlan[todayIndex];
    const exercises = todayWorkout?.exercises ?? [];
    if (todayWorkout?.type === 'workout' && exercises.length > 0) {
      const allDone = exercises.every((ex) => Boolean(completedExerciseIds[ex.id]));
      setIsTodayWorkoutCompleted(allDone);
    } else {
      setIsTodayWorkoutCompleted(false);
    }
  }, [weekPlan, completedExerciseIds, todayIndex]);

  // Heti edzésterv normalizálása, mentése és szinkronizálása a háttérrel
  const commitAndSyncWeekPlan = useCallback(
    async (
      nextPlan: WorkoutDay[],
      options?: { resetAllWeeks?: boolean; weeksCount?: number; persistToDb?: boolean }
    ): Promise<WorkoutDay[]> => {
      const normalized = PlanService.normalizeWeekPlan(nextPlan);
      weekPlanRef.current = normalized;
      setWeekPlan(normalized);

      const count = options?.weeksCount ?? Math.max(totalWeeksRef.current, 1);
      const activeWeekIdx = currentWeekIndexRef.current;

      setMultiWeekData((prev) => {
        const updated: Record<number, WorkoutDay[]> = options?.resetAllWeeks ? {} : { ...prev };
        updated[activeWeekIdx] = PlanService.normalizeWeekPlan(normalized);
        for (let i = 0; i < count; i++) {
          if (!updated[i] || options?.resetAllWeeks) {
            updated[i] = PlanService.normalizeWeekPlan(normalized);
          }
        }
        multiWeekRef.current = updated;
        return updated;
      });

      NotificationService.getInstance().updateWeekPlan(normalized).catch(() => {});

      const newTarget = PlanService.computeWeeklyTarget(normalized);
      const shouldPersist = options?.persistToDb ?? true;

      if (shouldPersist && userId) {
        try {
          await planRepository.saveWeek(normalized);
        } catch (err) {
          console.warn('Failed to persist plan to repository:', err);
        }
      }

      if (userId && profile && profile.weekly_target !== newTarget) {
        updateProfile({ weekly_target: newTarget }).catch((err) => {
          console.warn('Failed to synchronize weekly_target to profile:', err);
        });
      }

      return normalized;
    },
    [userId, profile, updateProfile]
  );

  const toggleExerciseCompletion = useCallback(async (exerciseId: string) => {
    if (isTodayWorkoutFinalized || !userId) {
      return;
    }

    const todayKey = getTodayKey();
    const completedKey = `@fitbase_completed_${userId}_${todayKey}`;

    setCompletedExerciseIds((prev) => {
      const nextState = !prev[exerciseId];
      const updated = {
        ...prev,
        [exerciseId]: nextState,
      };

      AsyncStorage.setItem(completedKey, JSON.stringify(updated)).catch((e) =>
        console.warn('Failed to save completed exercises to storage:', e)
      );

      // Napi gyakorlatállapot mentése az adatbázisba
      updateProfile({
        completed_exercises_today: {
          date: todayKey,
          exercise_ids: updated,
          finalized: false,
        },
      }).catch(() => {});

      return updated;
    });
  }, [isTodayWorkoutFinalized, userId, updateProfile]);

  const finalizeTodayWorkout = useCallback(async (): Promise<{ success: boolean; calories: number; checkedCount: number }> => {
    if (isTodayWorkoutFinalized || !userId) {
      return { success: false, calories: 0, checkedCount: 0 };
    }

    const todayKey = getTodayKey();
    const todayDay = weekPlanRef.current[todayIndex];
    const todayExercises = todayDay?.exercises ?? [];
    const checkedCount = todayExercises.filter((ex) => Boolean(completedExerciseIds[ex.id])).length;

    if (checkedCount === 0) {
      return { success: false, calories: 0, checkedCount: 0 };
    }

    const userWeight = profile?.weight || 75;
    const caloriesBurned = calorieService.calculateRoutineCalories(
      todayExercises,
      completedExerciseIds,
      userWeight
    );
    const durationMinutes = calorieService.calculateRoutineDuration(
      todayExercises,
      completedExerciseIds
    );
    const workoutTitle = todayDay?.workoutTitle || 'Scheduled Workout';

    setIsTodayWorkoutFinalized(true);
    await AsyncStorage.setItem(`@fitbase_workout_finalized_${userId}_${todayKey}`, 'true');

    // Részletes edzésadatok összeállítása (szériák, ismétlések, súlyok)
    const exerciseDetails = todayExercises
      .filter((ex) => Boolean(completedExerciseIds[ex.id]))
      .map((ex) => {
        const sets = PlanService.ensureExerciseSets(ex);
        const totalVolume = PlanService.calculateTotalVolume(sets);
        const max1RM = sets.reduce(
          (max, s) => Math.max(max, PlanService.calculateEstimated1RM(s.weightKg, s.reps)),
          0
        );
        return {
          id: ex.id,
          slug: ex.slug || resolveCatalogSlugFromTitle(ex.title) || ex.title.toLowerCase().replace(/\s+/g, '-'),
          title: ex.title,
          sets: sets.map((s) => ({
            set_number: s.setNumber,
            reps: s.reps,
            weight_kg: s.weightKg,
            completed: true,
          })),
          total_volume_kg: totalVolume,
          estimated_1rm: max1RM,
        };
      });

    // Befejezett edzés, elégetett kalóriák és jelvények mentése az adatbázisba
    await recordWorkoutCompleted(caloriesBurned, durationMinutes, checkedCount, workoutTitle, exerciseDetails);
    analyticsService.clearCache();

    setHistoricalSessions((prev) => ({
      ...prev,
      [todayKey]: {
        id: `session_${Date.now()}`,
        session_date: todayKey,
        day_of_week: todayIndex,
        workout_title: workoutTitle,
        exercises_completed: checkedCount,
        duration_minutes: durationMinutes,
        calories_burned: caloriesBurned,
        exercise_details: exerciseDetails,
        completed_at: new Date().toISOString(),
      },
    }));
    refreshHistoricalSessions();

    return { success: true, calories: caloriesBurned, checkedCount };
  }, [isTodayWorkoutFinalized, userId, todayIndex, profile?.weight, completedExerciseIds, recordWorkoutCompleted, refreshHistoricalSessions]);

  const targetDayIndexForAdd = activeDayIndex;
  const setTargetDayIndexForAdd = useCallback((index: number) => {
    setActiveDayIndex(index);
  }, []);

  const clearDuplicateNotice = useCallback(() => {
    setDuplicateNotice(null);
  }, []);

  const handleSelectWeekIndex = useCallback((index: number) => {
    if (currentWeekIndexRef.current === index) {
      return;
    }
    const prevIdx = currentWeekIndexRef.current;
    currentWeekIndexRef.current = index;
    setCurrentWeekIndexState(index);

    setMultiWeekData((prev) => {
      const currentSnapshot = PlanService.normalizeWeekPlan(weekPlanRef.current);
      const updated = {
        ...prev,
        [prevIdx]: currentSnapshot,
      };
      if (!updated[index]) {
        updated[index] = PlanService.normalizeWeekPlan(currentSnapshot);
      }
      multiWeekRef.current = updated;
      weekPlanRef.current = updated[index];
      setWeekPlan(updated[index]);
      return updated;
    });
  }, []);

  const refreshPlan = useCallback(async () => {
    if (!userId) {
      const empty = PlanService.createEmptyWeekPlan();
      weekPlanRef.current = empty;
      setWeekPlan(empty);
      setMultiWeekData({});
      setLoading(false);
      return;
    }

    try {
      const data = await planRepository.getWeek();
      if (data && data.length > 0) {
        const classified = PlanService.normalizeWeekPlan(data).map((day) => {
          if (day.type === 'workout') {
            if (day.exercises && day.exercises.length > 0) {
              const cl = WorkoutClassifier.classify(day.exercises, day.workoutTitle);
              return {
                ...day,
                workoutTitle: cl.title,
                workoutMeta: cl.meta,
                subtitle: `${day.exercises.length} x`,
              };
            }
            return {
              ...day,
              workoutTitle: day.workoutTitle || 'Workout',
              workoutMeta: '0 exercises',
              subtitle: '0 x',
              exercises: [],
            };
          }
          return {
            ...day,
            type: 'rest' as const,
            subtitle: 'REST',
            workoutTitle: undefined,
            workoutMeta: undefined,
            exercises: [],
          };
        });

        await commitAndSyncWeekPlan(classified, {
          resetAllWeeks: true,
          persistToDb: false,
        });
      } else {
        const defaultPlan = PlanService.createEmptyWeekPlan();
        await commitAndSyncWeekPlan(defaultPlan, {
          resetAllWeeks: true,
          persistToDb: true,
        });
      }
    } catch (error) {
      console.warn('Error fetching plan, falling back to PlanService default:', error);
      const fallbackPlan = PlanService.createEmptyWeekPlan();
      weekPlanRef.current = fallbackPlan;
      setWeekPlan(fallbackPlan);
    } finally {
      setLoading(false);
    }
  }, [userId, commitAndSyncWeekPlan]);

  const removeExerciseFromDay = useCallback(async (dayIndex: number, exerciseId: string) => {
    const prev = PlanService.normalizeWeekPlan(weekPlanRef.current);
    const updated = prev.map((day, dIdx) => {
      if (dIdx !== dayIndex) return day;
      const currentExercises = day.exercises || [];
      const filtered = currentExercises.filter((ex) => ex.id !== exerciseId);
      const renumbered = filtered.map((ex, idx) => ({
        ...ex,
        number: String(idx + 1).padStart(2, '0'),
      }));
      const cl = WorkoutClassifier.classify(renumbered, day.workoutTitle);
      return {
        ...day,
        type: 'workout' as const,
        workoutTitle: renumbered.length > 0 ? cl.title : 'Workout',
        workoutMeta: renumbered.length > 0 ? cl.meta : '0 exercises',
        subtitle: `${renumbered.length} x`,
        exercises: renumbered,
      };
    });

    await commitAndSyncWeekPlan(updated, { resetAllWeeks: totalWeeksRef.current <= 1 });
  }, [commitAndSyncWeekPlan]);

  const setDayAsRest = useCallback(async (dayIndex: number) => {
    const prev = PlanService.normalizeWeekPlan(weekPlanRef.current);
    const updated = prev.map((day, dIdx) => {
      if (dIdx !== dayIndex) return day;
      return {
        ...day,
        type: 'rest' as const,
        subtitle: 'REST',
        workoutTitle: undefined,
        workoutMeta: undefined,
        exercises: [],
      };
    });

    await commitAndSyncWeekPlan(updated, { resetAllWeeks: totalWeeksRef.current <= 1 });
  }, [commitAndSyncWeekPlan]);

  const setDayAsWorkout = useCallback(async (dayIndex: number) => {
    const prev = PlanService.normalizeWeekPlan(weekPlanRef.current);
    const updated = prev.map((day, dIdx) => {
      if (dIdx !== dayIndex) return day;
      const dayName = day.day || PlanService.DAY_NAMES[dIdx] || 'Mon';
      return PlanService.createEmptyWorkoutDay(dayName);
    });

    await commitAndSyncWeekPlan(updated, { resetAllWeeks: totalWeeksRef.current <= 1 });
  }, [commitAndSyncWeekPlan]);

  const clearWeekPlan = useCallback(async () => {
    const emptyWorkoutPlan = PlanService.createEmptyWeekPlan();
    await commitAndSyncWeekPlan(emptyWorkoutPlan, {
      resetAllWeeks: true,
      persistToDb: true,
    });
  }, [commitAndSyncWeekPlan]);

  const resetPlanToDefault = useCallback(async () => {
    const defaultPlan = PlanService.createEmptyWeekPlan();
    await commitAndSyncWeekPlan(defaultPlan, {
      resetAllWeeks: true,
      persistToDb: true,
    });
  }, [commitAndSyncWeekPlan]);

  const applyPlanStructure = useCallback(async (category: PlanStructureCategory) => {
    const weeksCount = category.weeksCount;
    setPlanStructure(category.id);
    setTotalWeeks(weeksCount);
    totalWeeksRef.current = weeksCount;
    setCurrentWeekIndexState(0);
    currentWeekIndexRef.current = 0;

    const freshWeekPlan = PlanService.createEmptyWeekPlan();
    await Promise.all([
      commitAndSyncWeekPlan(freshWeekPlan, {
        resetAllWeeks: true,
        weeksCount,
        persistToDb: true,
      }),
      updateSettings({ plan_structure: category.id }).catch(() => {}),
    ]);
  }, [commitAndSyncWeekPlan, updateSettings]);

  const addExerciseToDay = useCallback(async (dayIndex: number, exercise: Exercise): Promise<boolean> => {
    const prev = PlanService.normalizeWeekPlan(weekPlanRef.current);
    const targetDay = prev[dayIndex];
    if (!targetDay) return false;

    const targetDayLabel = DateHelper.getFullDayName(targetDay.day || dayIndex);
    const currentExercises = targetDay.exercises || [];
    const alreadyExists = currentExercises.some((ex) => {
      if (ex.slug && exercise.slug && ex.slug === exercise.slug) return true;
      return ex.title.trim().toLowerCase() === exercise.title.trim().toLowerCase();
    });

    if (alreadyExists) {
      setDuplicateNotice({
        title: exercise.title,
        dayName: targetDayLabel || 'this day',
        slug: exercise.slug,
      });
      return false;
    }

    setDuplicateNotice(null);
    const newNumber = String(currentExercises.length + 1).padStart(2, '0');
    const newExercise: Exercise = {
      ...exercise,
      id: exercise.id || `ex-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      number: newNumber,
    };
    const newExercises = [...currentExercises, newExercise];
    const cl = WorkoutClassifier.classify(newExercises, targetDay.workoutTitle);

    const updated = prev.map((day, dIdx) => {
      if (dIdx !== dayIndex) return day;
      return {
        ...day,
        type: 'workout' as const,
        workoutTitle: cl.title,
        workoutMeta: cl.meta,
        exercises: newExercises,
        subtitle: `${newExercises.length} x`,
      };
    });

    await commitAndSyncWeekPlan(updated, { resetAllWeeks: totalWeeksRef.current <= 1 });
    return true;
  }, [commitAndSyncWeekPlan]);

  const updateExerciseInDay = useCallback(
    async (dayIndex: number, exerciseId: string, updatedFields: Partial<Exercise>): Promise<void> => {
      const prev = weekPlanRef.current;
      const targetDay = prev[dayIndex];
      if (!targetDay || !Array.isArray(targetDay.exercises)) return;

      const currentExercises = targetDay.exercises;
      const newExercises = currentExercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const merged: Exercise = {
          ...ex,
          ...updatedFields,
        };
        if (updatedFields.sets || updatedFields.restSeconds !== undefined) {
          const s = updatedFields.sets || PlanService.ensureExerciseSets(merged);
          const r = updatedFields.restSeconds !== undefined ? updatedFields.restSeconds : (merged.restSeconds || 60);
          merged.details = PlanService.formatExerciseDetails(s, r);
          merged.sets = s;
          merged.restSeconds = r;
        }
        return merged;
      });

      const cl = WorkoutClassifier.classify(newExercises, targetDay.workoutTitle);

      const nextPlan = prev.map((day, dIdx) => {
        if (dIdx !== dayIndex) return day;
        return {
          ...day,
          workoutTitle: cl.title,
          workoutMeta: cl.meta,
          exercises: newExercises,
          subtitle: `${newExercises.length} x`,
        };
      });

      await commitAndSyncWeekPlan(nextPlan, { resetAllWeeks: totalWeeksRef.current <= 1 });
    },
    [commitAndSyncWeekPlan]
  );

  useEffect(() => {
    refreshPlan();
  }, [userId]);

  const contextValue = useMemo<PlanContextType>(
    () => ({
      weekPlan,
      plannedWorkoutDays,
      loading,
      refreshPlan,
      activeDayIndex,
      setActiveDayIndex,
      targetDayIndexForAdd,
      setTargetDayIndexForAdd,
      removeExerciseFromDay,
      setDayAsRest,
      setDayAsWorkout,
      clearWeekPlan,
      resetPlanToDefault,
      applyPlanStructure,
      addExerciseToDay,
      updateExerciseInDay,
      duplicateNotice,
      clearDuplicateNotice,
      planStructure,
      currentWeekIndex,
      setCurrentWeekIndex: handleSelectWeekIndex,
      totalWeeks,
      completedExerciseIds,
      toggleExerciseCompletion,
      isTodayWorkoutCompleted,
      isTodayWorkoutFinalized,
      finalizeTodayWorkout,
      todayIndex,
      selectedHomeDayIndex,
      setSelectedHomeDayIndex,
      historicalSessions,
      refreshHistoricalSessions,
    }),
    [
      weekPlan,
      plannedWorkoutDays,
      loading,
      refreshPlan,
      activeDayIndex,
      targetDayIndexForAdd,
      setTargetDayIndexForAdd,
      removeExerciseFromDay,
      setDayAsRest,
      setDayAsWorkout,
      clearWeekPlan,
      resetPlanToDefault,
      applyPlanStructure,
      addExerciseToDay,
      updateExerciseInDay,
      duplicateNotice,
      clearDuplicateNotice,
      planStructure,
      currentWeekIndex,
      handleSelectWeekIndex,
      totalWeeks,
      completedExerciseIds,
      toggleExerciseCompletion,
      isTodayWorkoutCompleted,
      isTodayWorkoutFinalized,
      finalizeTodayWorkout,
      todayIndex,
      selectedHomeDayIndex,
      historicalSessions,
      refreshHistoricalSessions,
    ]
  );

  return (
    <PlanContext.Provider value={contextValue}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlan must be within PlanProvider");
  }
  return context;
};
