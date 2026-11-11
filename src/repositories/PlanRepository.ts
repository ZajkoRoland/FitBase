import { PlanService, type Exercise, type WorkoutDay } from '@/services/PlanService';

import { BaseRepository } from './BaseRepository';

/** Row shape of GET/PUT /plan (mirrors the user_weekly_plan table). */
interface PlanDayDto {
  day_of_week: number;
  day_name: string;
  type: 'workout' | 'rest';
  workout_title: string | null;
  workout_meta: string | null;
  exercises: Exercise[];
}

export class PlanRepository extends BaseRepository {
  private static instance: PlanRepository;

  public static getInstance(): PlanRepository {
    if (!PlanRepository.instance) {
      PlanRepository.instance = new PlanRepository();
    }
    return PlanRepository.instance;
  }

  public async getWeek(): Promise<WorkoutDay[]> {
    const rows = await this.api.get<PlanDayDto[]>('/plan');
    if (!rows || rows.length === 0) {
      return [];
    }
    return PlanRepository.normalizeDtoRowsToWeek(rows);
  }

  /** Upserts the given days; array index becomes day_of_week (0 = Monday). */
  public async saveWeek(days: WorkoutDay[]): Promise<WorkoutDay[]> {
    const normalizedDays = PlanService.normalizeWeekPlan(days);
    const rows = await this.api.put<PlanDayDto[]>('/plan', {
      days: normalizedDays.map(PlanRepository.toDto),
    });
    return PlanRepository.normalizeDtoRowsToWeek(rows);
  }

  private static normalizeDtoRowsToWeek(rows: PlanDayDto[]): WorkoutDay[] {
    const byDayIndex = new Map<number, PlanDayDto>();
    for (const row of rows) {
      if (typeof row.day_of_week === 'number' && row.day_of_week >= 0 && row.day_of_week < 7) {
        byDayIndex.set(row.day_of_week, row);
      }
    }

    return PlanService.DAY_NAMES.map((dayName, idx) => {
      const row = byDayIndex.get(idx);
      if (!row) {
        return PlanService.createEmptyWorkoutDay(dayName);
      }
      return PlanRepository.toWorkoutDay(row, dayName);
    });
  }

  private static toWorkoutDay(row: PlanDayDto, fallbackDayName?: string): WorkoutDay {
    const exercises = row.exercises ?? [];
    const isRest = row.type === 'rest';
    return {
      day: row.day_name || fallbackDayName || 'Mon',
      type: isRest ? 'rest' : 'workout',
      subtitle: isRest ? 'REST' : `${exercises.length} x`,
      workoutTitle: isRest
        ? undefined
        : row.workout_title ?? 'Workout',
      workoutMeta: isRest
        ? undefined
        : row.workout_meta ?? `${exercises.length} ${exercises.length === 1 ? 'exercise' : 'exercises'}`,
      exercises: isRest ? [] : exercises,
    };
  }

  private static toDto(day: WorkoutDay, index: number): PlanDayDto {
    const isRest = day.type === 'rest';
    const exercises = isRest ? [] : (day.exercises ?? []);
    return {
      day_of_week: index,
      day_name: day.day || PlanService.DAY_NAMES[index] || 'Mon',
      type: isRest ? 'rest' : 'workout',
      workout_title: isRest ? null : (day.workoutTitle ?? 'Workout'),
      workout_meta: isRest
        ? null
        : (day.workoutMeta ?? `${exercises.length} ${exercises.length === 1 ? 'exercise' : 'exercises'}`),
      exercises,
    };
  }
}

export const planRepository = PlanRepository.getInstance();
