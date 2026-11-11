import { BaseRepository } from './BaseRepository';

export interface ExerciseProgressPoint {
  date: string;
  session_id: string;
  workout_title: string;
  max_weight_kg: number;
  estimated_1rm_kg: number;
  total_volume_kg: number;
  sets_count: number;
  sets?: Array<{
    set_number: number;
    reps: number;
    weight_kg: number;
    estimated_1rm: number;
  }>;
}

export interface ExerciseProgressResponse {
  slug: string;
  history: ExerciseProgressPoint[];
  total_sessions_logged: number;
}

export interface LoggedExerciseOption {
  slug: string;
  title: string;
}

export class AnalyticsRepository extends BaseRepository {
  private static instance: AnalyticsRepository;

  public static getInstance(): AnalyticsRepository {
    if (!AnalyticsRepository.instance) {
      AnalyticsRepository.instance = new AnalyticsRepository();
    }
    return AnalyticsRepository.instance;
  }

  /**
   * Fetches the historical progression timeline for a specific exercise.
   */
  public async getExerciseProgress(slug: string): Promise<ExerciseProgressResponse> {
    return this.api.get<ExerciseProgressResponse>(`/analytics/progress/${encodeURIComponent(slug)}`);
  }

  /**
   * Fetches the list of exercises that have recorded history.
   */
  public async getLoggedExercises(): Promise<LoggedExerciseOption[]> {
    return this.api.get<LoggedExerciseOption[]>('/analytics/progress-exercises');
  }
}

export const analyticsRepository = AnalyticsRepository.getInstance();

