import { bodyMetricsService } from '@/services/BodyMetricsService';
import type {
  ActivityWeek,
  Profile,
  ProfileUpdate,
  WorkoutCompletePayload,
  WorkoutSessionItem,
} from '@/types/profile';

import { BaseRepository } from './BaseRepository';

export interface WorkoutCompleteApiResponse {
  profile: Profile;
  newly_unlocked_achievements: Array<{
    id: string;
    achievement_key: string;
    title: string;
    description: string;
    category: 'streak' | 'workouts' | 'dedication' | 'special';
    tier: 'bronze' | 'silver' | 'gold' | 'diamond';
    icon: string;
    current_value: number;
    target_value: number;
    unit: string;
    is_unlocked: boolean;
    unlocked_at?: string | null;
    unlocked_date?: string | null;
  }>;
}

export class ProfileRepository extends BaseRepository {
  public static getInstance(): ProfileRepository {
    return profileRepository;
  }

  private async hydrateLocalMetrics(profile: Profile): Promise<Profile> {
    let hydrated = profile;

    if (hydrated.gender == null || hydrated.age == null) {
      const localDemographics = await bodyMetricsService.getDemographics(hydrated.id);
      if (localDemographics) {
        hydrated = {
          ...hydrated,
          gender: hydrated.gender ?? localDemographics.gender ?? null,
          age: hydrated.age ?? localDemographics.age ?? null,
        };
      }
    } else {
      await bodyMetricsService.saveDemographics(
        { gender: hydrated.gender, age: hydrated.age },
        hydrated.id
      );
    }

    if (hydrated.target_weight == null) {
      const localTarget = await bodyMetricsService.getTargetWeight(hydrated.id);
      if (localTarget !== null) {
        hydrated = {
          ...hydrated,
          target_weight: localTarget,
        };
      }
    }

    return hydrated;
  }

  // Profil és statisztikák lekérése a bejelentkezett fiókhoz
  public async get(): Promise<Profile> {
    const profile = await this.api.get<Profile>('/profile');
    return this.hydrateLocalMetrics(profile);
  }

  public async update(changes: ProfileUpdate): Promise<Profile> {
    const currentUserId = this.api.getSession()?.user?.id;
    if (changes.gender !== undefined || changes.age !== undefined) {
      await bodyMetricsService.saveDemographics(
        { gender: changes.gender, age: changes.age },
        currentUserId
      );
    }
    if (changes.target_weight !== undefined) {
      await bodyMetricsService.saveTargetWeight(changes.target_weight ?? null, currentUserId);
    }

    try {
      const updated = await this.api.patch<Profile>('/profile', changes);
      return this.hydrateLocalMetrics(updated);
    } catch (err: any) {
      const hasDemographicFields = 'gender' in changes || 'age' in changes;
      if (hasDemographicFields && (err?.status === 422 || err?.status === 400)) {
        const { gender, age, ...compatibleChanges } = changes;
        // Ha csak a nem/kor mezőket módosították és a szerver még nem támogatja,
        // összefésüljük a helyben elmentett értékekkel
        if (Object.keys(compatibleChanges).length === 0) {
          const current = await this.api.get<Profile>('/profile');
          return this.hydrateLocalMetrics({
            ...current,
            gender: gender !== undefined ? gender : current.gender ?? null,
            age: age !== undefined ? age : current.age ?? null,
          });
        }
        const updated = await this.api.patch<Profile>('/profile', compatibleChanges);
        return this.hydrateLocalMetrics({
          ...updated,
          gender: gender !== undefined ? gender : updated.gender ?? null,
          age: age !== undefined ? age : updated.age ?? null,
        });
      }
      throw err;
    }
  }

  // Befejezett edzés elmentése az adatbázisba
  public async completeWorkout(payload: WorkoutCompletePayload): Promise<WorkoutCompleteApiResponse> {
    const res = await this.api.post<WorkoutCompleteApiResponse>('/profile/workout-complete', payload);
    return {
      ...res,
      profile: await this.hydrateLocalMetrics(res.profile),
    };
  }

  // Edzés számlálók és statisztikák nullázása
  public async resetStats(): Promise<Profile> {
    const reset = await this.api.post<Profile>('/profile/reset-stats');
    return this.hydrateLocalMetrics(reset);
  }

  // Az elmúlt 5 hét aktivitásának lekérése
  public getActivityHistory(): Promise<ActivityWeek[]> {
    return this.api.get<ActivityWeek[]>('/profile/activity');
  }

  // Korábbi edzésnaplók lekérése
  public async getWorkoutSessions(limit: number = 60): Promise<WorkoutSessionItem[]> {
    try {
      return await this.api.get<WorkoutSessionItem[]>(`/profile/sessions?limit=${limit}`);
    } catch (e) {
      console.warn('Failed to fetch historical workout sessions:', e);
      return [];
    }
  }
}

export const profileRepository = new ProfileRepository();
