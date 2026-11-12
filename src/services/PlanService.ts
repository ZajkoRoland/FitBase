import { Colors } from '@/constants/Colors';

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed?: boolean;
}

export interface Exercise {
  id: string;
  number: string;
  title: string;
  details: string;
  badgeText: string;
  color: string;
  slug?: string;
  met?: number;
  description?: string;
  instructions?: string[];
  startImageUrl?: string;
  peakImageUrl?: string;
  targetSets?: number;
  targetReps?: number;
  weightKg?: number;
  restSeconds?: number;
  sets?: ExerciseSet[];
}

export interface WorkoutDay {
  day: string;
  type: 'rest' | 'workout';
  subtitle: string;
  workoutTitle?: string;
  workoutMeta?: string;
  exercises?: Exercise[];
}

export class PlanService {
  private static instance: PlanService;
  public static readonly DAY_NAMES: readonly string[] = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ];
  private weekPlan: WorkoutDay[];

  private constructor() {
    this.weekPlan = PlanService.createEmptyWeekPlan();
  }

  public static getInstance(): PlanService {
    if (!PlanService.instance) {
      PlanService.instance = new PlanService();
    }
    return PlanService.instance;
  }

  // Új üres edzésnap létrehozása (0 gyakorlattal)
  public static createEmptyWorkoutDay(dayName: string): WorkoutDay {
    return {
      day: dayName,
      type: 'workout',
      subtitle: '0 x',
      workoutTitle: 'Workout',
      workoutMeta: '0 exercises',
      exercises: [],
    };
  }

  // Új üres heti edzésterv generálása mind a 7 napra
  public static createEmptyWeekPlan(): WorkoutDay[] {
    return PlanService.DAY_NAMES.map((dayName) =>
      PlanService.createEmptyWorkoutDay(dayName)
    );
  }

  // Heti edzésterv normalizálása és másolása a hét napjaira
  public static normalizeWeekPlan(days?: WorkoutDay[] | null): WorkoutDay[] {
    if (!days || days.length === 0) {
      return PlanService.createEmptyWeekPlan();
    }

    return PlanService.DAY_NAMES.map((dayName, idx) => {
      const matched =
        days[idx]?.day === dayName
          ? days[idx]
          : days.find((d) => d.day === dayName) ?? days[idx];

      if (!matched) {
        return PlanService.createEmptyWorkoutDay(dayName);
      }

      const exercises = Array.isArray(matched.exercises)
        ? matched.exercises.map((ex) => ({ ...ex }))
        : [];
      const isRest = matched.type === 'rest';

      return {
        day: dayName,
        type: isRest ? 'rest' : 'workout',
        subtitle: isRest ? 'REST' : `${exercises.length} x`,
        workoutTitle: isRest
          ? undefined
          : matched.workoutTitle || 'Workout',
        workoutMeta: isRest
          ? undefined
          : matched.workoutMeta || `${exercises.length} ${exercises.length === 1 ? 'exercise' : 'exercises'}`,
        exercises: isRest ? [] : exercises,
      };
    });
  }

  // Heti célzott edzésnapok számának kiszámítása a tervből
  public static computeWeeklyTarget(days?: WorkoutDay[] | null, fallback = 7): number {
    if (!days || days.length === 0) {
      return Math.max(1, fallback);
    }
    const normalized = PlanService.normalizeWeekPlan(days);
    const workoutDaysCount = normalized.filter((d) => d.type === 'workout').length;
    return Math.max(1, workoutDaysCount);
  }

  // Gyakorlat sorozatainak ellenőrzése és inicializálása
  public static ensureExerciseSets(exercise: Exercise): ExerciseSet[] {
    if (Array.isArray(exercise.sets) && exercise.sets.length > 0) {
      return exercise.sets.map((s, idx) => ({
        setNumber: typeof s.setNumber === 'number' && !isNaN(s.setNumber) ? s.setNumber : idx + 1,
        reps: typeof s.reps === 'number' && !isNaN(s.reps) && s.reps > 0 ? s.reps : 10,
        weightKg: typeof s.weightKg === 'number' && !isNaN(s.weightKg) ? s.weightKg : (exercise.weightKg || 0),
        completed: Boolean(s.completed),
      }));
    }

    const match = (exercise.details || '').match(/(\d+)\s*[x×]\s*(\d+)/i);
    const parsedSets = match ? parseInt(match[1], 10) : (exercise.targetSets || 3);
    const parsedReps = match ? parseInt(match[2], 10) : (exercise.targetReps || 10);
    const defaultWeight = typeof exercise.weightKg === 'number' && !isNaN(exercise.weightKg) ? exercise.weightKg : 0;

    const safeSets = !isNaN(parsedSets) && parsedSets > 0 ? Math.min(parsedSets, 12) : 3;
    const safeReps = !isNaN(parsedReps) && parsedReps > 0 ? Math.min(parsedReps, 100) : 10;

    return Array.from({ length: safeSets }, (_, idx) => ({
      setNumber: idx + 1,
      reps: safeReps,
      weightKg: defaultWeight,
      completed: false,
    }));
  }

  // Gyakorlat részleteinek formázása sorozatok és pihenőidő alapján
  public static formatExerciseDetails(sets: ExerciseSet[], restSeconds: number = 60): string {
    if (!sets || sets.length === 0) return `3 × 10 · ${restSeconds} mp`;

    const setCount = sets.length;
    const firstSet = sets[0] || { reps: 10, weightKg: 0 };
    const allRepsSame = sets.every((s) => s.reps === firstSet.reps);
    const allWeightsSame = sets.every((s) => s.weightKg === firstSet.weightKg);

    const weights = sets.map((s) => s.weightKg).filter((w) => typeof w === 'number' && !isNaN(w) && w > 0);
    const hasWeight = weights.length > 0;
    const minWeight = hasWeight ? Math.min(...weights) : 0;
    const maxWeight = hasWeight ? Math.max(...weights) : 0;

    let repsWeightText: string;
    if (allRepsSame && allWeightsSame) {
      const wText = firstSet.weightKg > 0 ? ` (${firstSet.weightKg} kg)` : '';
      repsWeightText = `${setCount} × ${firstSet.reps}${wText}`;
    } else if (hasWeight) {
      const weightRange = minWeight === maxWeight ? `${minWeight} kg` : `${minWeight}–${maxWeight} kg`;
      repsWeightText = `${setCount} sorozat (${weightRange})`;
    } else {
      repsWeightText = `${setCount} sorozat (${firstSet.reps} ism.)`;
    }

    return `${repsWeightText} · ${restSeconds} mp`;
  }

  // Összes megmozgatott súly (volumen) kiszámítása a sorozatokból
  public static calculateTotalVolume(sets: ExerciseSet[]): number {
    if (!Array.isArray(sets)) return 0;
    return sets.reduce((acc, s) => {
      const w = typeof s.weightKg === 'number' && !isNaN(s.weightKg) && s.weightKg > 0 ? s.weightKg : 0;
      const r = typeof s.reps === 'number' && !isNaN(s.reps) && s.reps > 0 ? s.reps : 0;
      return acc + (w * r);
    }, 0);
  }

  // Becsült 1RM (egyismétléses maximum) számítása Epley-képlettel
  public static calculateEstimated1RM(weightKg: number, reps: number): number {
    if (typeof weightKg !== 'number' || isNaN(weightKg) || weightKg <= 0) return 0;
    if (typeof reps !== 'number' || isNaN(reps) || reps <= 0) return 0;
    if (reps === 1) return Math.round(weightKg * 10) / 10;
    return Math.round(weightKg * (1 + reps / 30.0) * 10) / 10;
  }

  public getWeekPlan(): WorkoutDay[] {
    return PlanService.createEmptyWeekPlan();
  }

  public getTwoWeekSplitPlan(): WorkoutDay[] {
    return PlanService.createEmptyWeekPlan();
  }

  public getFourWeekPeriodizationPlan(): WorkoutDay[] {
    return PlanService.createEmptyWeekPlan();
  }

  public getStructurePlan(structure: '1_week' | '2_week' | '4_week'): WorkoutDay[] {
    switch (structure) {
      case '1_week':
        return this.getWeekPlan();
      case '2_week':
        return this.getTwoWeekSplitPlan();
      case '4_week':
        return this.getFourWeekPeriodizationPlan();
      default:
        return this.getWeekPlan();
    }
  }
}

export const planService = PlanService.getInstance();
