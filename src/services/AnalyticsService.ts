import {
  analyticsRepository,
  AnalyticsRepository,
  ExerciseProgressPoint,
  ExerciseProgressResponse,
  LoggedExerciseOption,
} from '@/repositories/AnalyticsRepository';

export class AnalyticsService {
  private readonly repository: AnalyticsRepository;
  private readonly progressCache: Map<string, ExerciseProgressResponse> = new Map();

  constructor(repository: AnalyticsRepository = analyticsRepository) {
    this.repository = repository;
  }

  public static getInstance(): AnalyticsService {
    return analyticsService;
  }

  public async getProgress(slug: string, forceRefresh = false): Promise<ExerciseProgressResponse> {
    const cleanSlug = slug.trim().toLowerCase();
    if (!forceRefresh && this.progressCache.has(cleanSlug)) {
      return this.progressCache.get(cleanSlug)!;
    }

    try {
      const data = await this.repository.getExerciseProgress(cleanSlug);
      this.progressCache.set(cleanSlug, data);
      return data;
    } catch (err) {
      console.warn('[AnalyticsService] Failed to load exercise progress:', err);
      return {
        slug: cleanSlug,
        history: [],
        total_sessions_logged: 0,
      };
    }
  }

  public async getLoggedExercises(): Promise<LoggedExerciseOption[]> {
    try {
      return await this.repository.getLoggedExercises();
    } catch (err) {
      console.warn('[AnalyticsService] Failed to load logged exercises:', err);
      return [];
    }
  }

  public clearCache(): void {
    this.progressCache.clear();
  }
}

export const analyticsService = new AnalyticsService();

