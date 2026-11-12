import type { Achievement, AchievementCategory, AchievementTier, PlayerRank } from '@/models/Achievement';

import { BaseRepository } from './BaseRepository';

interface RawAchievementDto {
  id: string;
  achievement_key: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  current_value: number;
  target_value: number;
  unit: string;
  is_unlocked: boolean;
  unlocked_at?: string | null;
  unlocked_date?: string | null;
}

interface RawPlayerRankDto {
  level: number;
  title: string;
  unlocked_count: number;
  total_count: number;
  progress_percent: number;
}

interface RawAchievementsEnvelopeDto {
  achievements: RawAchievementDto[];
  rank: RawPlayerRankDto;
}

export interface AchievementsEnvelope {
  achievements: Achievement[];
  rank: PlayerRank;
}

// Felhasználói jelvények és rang lekérése a backendről
export class AchievementsRepository extends BaseRepository {
  public static getInstance(): AchievementsRepository {
    return achievementsRepository;
  }

  private mapEnvelope(dto: RawAchievementsEnvelopeDto): AchievementsEnvelope {
    return {
      achievements: (dto.achievements || []).map((a) => ({
        id: a.achievement_key || a.id,
        title: a.title,
        description: a.description,
        category: a.category,
        tier: a.tier,
        icon: a.icon,
        currentValue: a.current_value,
        targetValue: a.target_value,
        unit: a.unit,
        isUnlocked: a.is_unlocked,
        unlockedDate: a.unlocked_date || (a.is_unlocked ? 'Unlocked' : undefined),
      })),
      rank: {
        level: dto.rank?.level ?? 1,
        title: dto.rank?.title ?? 'Apprentice Athlete',
        unlockedCount: dto.rank?.unlocked_count ?? 0,
        totalCount: dto.rank?.total_count ?? 10,
        progressPercent: dto.rank?.progress_percent ?? 0,
      },
    };
  }

  public async get(): Promise<AchievementsEnvelope> {
    const raw = await this.api.get<RawAchievementsEnvelopeDto>('/achievements');
    return this.mapEnvelope(raw);
  }

  public async sync(): Promise<AchievementsEnvelope> {
    const raw = await this.api.post<RawAchievementsEnvelopeDto>('/achievements/sync');
    return this.mapEnvelope(raw);
  }
}

export const achievementsRepository = new AchievementsRepository();

