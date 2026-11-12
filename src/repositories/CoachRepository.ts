import { BaseRepository } from './BaseRepository';
import type { CoachChatResponse } from '@/types/coach';

export class CoachRepository extends BaseRepository {
  public static getInstance(): CoachRepository {
    return coachRepository;
  }

  public async sendMessage(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    language?: 'hu' | 'en' | null
  ): Promise<CoachChatResponse> {
    return this.api.post<CoachChatResponse>('/coach/chat', {
      message,
      history,
      language: language ?? null,
    });
  }
}

export const coachRepository = new CoachRepository();
