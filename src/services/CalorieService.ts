import { Exercise, PlanService } from './PlanService';

// Kalóriaégetést becslő szolgáltatás MET értékek, testsúly, sorozatok,
// ismétlések és a végzett gyakorlatok típusa alapján.
export class CalorieService {
  private static instance: CalorieService;

  private constructor() {}

  public static getInstance(): CalorieService {
    if (!CalorieService.instance) {
      CalorieService.instance = new CalorieService();
    }
    return CalorieService.instance;
  }

  // MET szorzók kulcsszavak alapján
  private readonly MET_PATTERNS: Array<{ pattern: RegExp; met: number }> = [
    { pattern: /burpee|thruster|clean|snatch|deadlift/i, met: 8.0 },
    { pattern: /squat|guggolás|lunge|kitörés|leg press/i, met: 7.0 },
    { pattern: /row|evezés|pull-up|chin-up|húzódzkodás|lat pull/i, met: 6.0 },
    { pattern: /bench|press|nyomás|push-up|fekvőtámasz|dip|tolódzkodás/i, met: 5.5 },
    { pattern: /curl|bicepsz|triceps|extension|nyújtás|lateral raise|oldalemelés/i, met: 4.2 },
    { pattern: /calf|vádli|shrug|wrist/i, met: 3.8 },
    { pattern: /plank|crunch|has|twist|ab/i, met: 4.5 },
    { pattern: /mountain climber|high knee|jump/i, met: 7.5 },
  ];

  // MET érték meghatározása az adatbázisból vagy mintaillesztéssel
  public getMetForExercise(exercise: Exercise | string): number {
    if (typeof exercise !== 'string' && exercise.met && exercise.met > 0) {
      return exercise.met;
    }

    const titleOrSlug = typeof exercise === 'string' ? exercise : (exercise.slug || exercise.title || '');
    for (const item of this.MET_PATTERNS) {
      if (item.pattern.test(titleOrSlug)) {
        return item.met;
      }
    }
    return 5.0; // Default moderate strength training MET
  }

  // Sorozatok, ismétlések és pihenőidő kinyerése a formázott szövegből
  public parseExerciseVolume(details?: string): { sets: number; reps: number; restSeconds: number } {
    if (!details) {
      return { sets: 3, reps: 10, restSeconds: 60 };
    }

    let sets = 3;
    let reps = 10;
    let restSeconds = 60;

    // Match sets and reps: "4 × 8", "4x8", "3 x 12"
    const volumeMatch = details.match(/(\d+)\s*[x×X]\s*(\d+)/);
    if (volumeMatch) {
      sets = parseInt(volumeMatch[1], 10) || 3;
      reps = parseInt(volumeMatch[2], 10) || 10;
    }

    // Match rest seconds: "90s rest", "60s", "90 mp"
    const restMatch = details.match(/(\d+)\s*(?:s|sec|mp)/i);
    if (restMatch) {
      restSeconds = parseInt(restMatch[1], 10) || 60;
    }

    return { sets, reps, restSeconds };
  }

  // Gyakorlat becsült időtartama percekben (sorozatok, ismétlések és pihenők alapján)
  public calculateExerciseDuration(exercise: Exercise): number {
    const setsList = PlanService.ensureExerciseSets(exercise);
    const setCount = Math.max(1, setsList.length);
    const totalReps = setsList.reduce((sum, s) => sum + (s.reps || 10), 0);
    const restSeconds = exercise.restSeconds || 60;

    const workSeconds = totalReps * 3.8;
    const restSecondsTotal = Math.max(0, setCount - 1) * restSeconds;
    return Math.max(3, Math.round((workSeconds + restSecondsTotal) / 60));
  }

  // Teljes edzés becsült időtartama percekben
  public calculateRoutineDuration(
    exercises: Exercise[],
    completedMap?: Record<string, boolean>
  ): number {
    if (!exercises || exercises.length === 0) return 0;
    const activeList = exercises.filter((ex) => (completedMap ? Boolean(completedMap[ex.id]) : true));
    if (activeList.length === 0) return 0;

    let totalMinutes = 0;
    for (const ex of activeList) {
      totalMinutes += this.calculateExerciseDuration(ex);
    }
    // Kisebb pufferidő a gyakorlatok közötti váltásokra
    if (activeList.length > 1) {
      totalMinutes += Math.round((activeList.length - 1) * 1.5);
    }
    return Math.max(totalMinutes, 10);
  }

  // Gyakorlat kalóriaégetésének becslése (MET érték, testsúly és terhelés alapján)
  public calculateExerciseCalories(exercise: Exercise, userWeightKg: number = 75): number {
    const weight = userWeightKg > 30 && userWeightKg < 250 ? userWeightKg : 75;
    const met = this.getMetForExercise(exercise);

    // Retrieve structured sets (reps & weightKg per set)
    const setsList = PlanService.ensureExerciseSets(exercise);
    const setCount = Math.max(1, setsList.length);
    const restSeconds = exercise.restSeconds || 60;

    // Calculate total repetitions and total lifted volume (kg)
    let totalReps = 0;
    let totalVolumeKg = 0;

    for (const s of setsList) {
      const r = typeof s.reps === 'number' && !isNaN(s.reps) && s.reps > 0 ? s.reps : 10;
      const w = typeof s.weightKg === 'number' && !isNaN(s.weightKg) && s.weightKg > 0 ? s.weightKg : 0;
      totalReps += r;
      totalVolumeKg += r * w;
    }

    if (totalReps === 0) {
      totalReps = setCount * 10;
    }

    // Multi-joint compound movements recruit larger muscle mass & induce higher systemic demand
    const isCompound = met >= 5.5;
    const compoundFactor = isCompound ? 1.25 : 1.0;

    // Time under tension: ~3.8 seconds per repetition
    const workSeconds = totalReps * 3.8;
    const totalRestSeconds = Math.max(0, setCount - 1) * restSeconds;

    // 1. Base active bodily expenditure (moving own body through the exercise motion)
    const baseActiveCalories = met * weight * (workSeconds / 3600) * compoundFactor;

    // 2. Mechanical work against external lifted weights
    // Each kg lifted through ~0.6m vertical displacement at ~22% human muscular efficiency
    // burns ~0.009 kcal per kg-rep (including eccentric lowering and core stabilization)
    const loadEfficiencyFactor = isCompound ? 0.0095 : 0.0080;
    const externalLoadCalories = totalVolumeKg * loadEfficiencyFactor;

    // 3. Inter-set metabolic recovery (elevated heart rate & oxygen debt / EPOC repayment)
    // Higher loads elevate EPOC demand post-set
    const avgWeightPerRep = totalReps > 0 ? totalVolumeKg / totalReps : 0;
    const loadEpocBoost = Math.min(0.5, (avgWeightPerRep / weight) * 0.25);
    const recoveryMet = (isCompound ? 3.2 : 2.8) * (1.0 + loadEpocBoost);
    const recoveryCalories = recoveryMet * weight * (totalRestSeconds / 3600);

    const total = baseActiveCalories + externalLoadCalories + recoveryCalories;
    return Math.max(8, Math.round(total));
  }

  // Edzés teljes becsült kalóriaégetése
  public calculateRoutineCalories(
    exercises: Exercise[],
    completedMap?: Record<string, boolean>,
    userWeightKg: number = 75
  ): number {
    if (!exercises || exercises.length === 0) return 0;

    return exercises.reduce((acc, ex) => {
      if (completedMap && !completedMap[ex.id]) {
        return acc;
      }
      return acc + this.calculateExerciseCalories(ex, userWeightKg);
    }, 0);
  }
}

export const calorieService = CalorieService.getInstance();
