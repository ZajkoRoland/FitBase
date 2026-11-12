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
  public static getInstance(): AnalyticsRepository {
    return analyticsRepository;
  }

  // Adott gyakorlat fejlődési történetének lekérése
  public async getExerciseProgress(slug: string): Promise<ExerciseProgressResponse> {
    return this.api.get<ExerciseProgressResponse>(`/analytics/progress/${encodeURIComponent(slug)}`);
  }

  // Naplózott gyakorlatok listájának lekérése
  public async getLoggedExercises(): Promise<LoggedExerciseOption[]> {
    return this.api.get<LoggedExerciseOption[]>('/analytics/progress-exercises');
  }
}

export const analyticsRepository = new AnalyticsRepository();

