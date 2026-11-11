import { BaseRepository } from './BaseRepository';
import type {
  ExerciseDetail,
  ExerciseFilterOptions,
  ExercisePage,
  ExerciseQueryParams,
} from '@/types/exercise';

export class ExerciseRepository extends BaseRepository {
  private static instance: ExerciseRepository;

  public static getInstance(): ExerciseRepository {
    if (!ExerciseRepository.instance) {
      ExerciseRepository.instance = new ExerciseRepository();
    }
    return ExerciseRepository.instance;
  }

  /**
   * Fetches a paginated slice of exercises from the catalogue.
   */
  public async list(params: ExerciseQueryParams = {}): Promise<ExercisePage> {
    const query: Record<string, string> = {};
    if (params.q?.trim()) query.q = params.q.trim();
    if (params.body_part) query.body_part = params.body_part;
    if (params.difficulty) query.difficulty = params.difficulty;
    if (params.category) query.category = params.category;
    if (params.equipment) query.equipment = params.equipment;
    if (params.muscle) query.muscle = params.muscle;
    if (params.goal) query.goal = params.goal;
    if (params.lang) query.lang = params.lang;
    if (params.limit !== undefined) query.limit = String(params.limit);
    if (params.offset !== undefined) query.offset = String(params.offset);

    return this.api.get<ExercisePage>('/exercises', { query });
  }

  /**
   * Fetches full metadata for a single exercise by slug.
   */
  public async getBySlug(slug: string, lang = 'en'): Promise<ExerciseDetail> {
    return this.api.get<ExerciseDetail>(`/exercises/${encodeURIComponent(slug)}`, {
      query: { lang },
    });
  }

  /**
   * Fetches available vocabulary for filters (body parts, muscles, equipment).
   */
  public async getFilters(): Promise<ExerciseFilterOptions> {
    return this.api.get<ExerciseFilterOptions>('/exercises/filters');
  }
}

export const exerciseRepository = ExerciseRepository.getInstance();
