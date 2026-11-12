import type { UserSettings, UserSettingsUpdate } from '@/types/profile';

import { BaseRepository } from './BaseRepository';

// Beállítások (értesítések, hangok) mentése és lekérése az API-n keresztül
export class SettingsRepository extends BaseRepository {
  private static instance: SettingsRepository;

  public static getInstance(): SettingsRepository {
    if (!SettingsRepository.instance) {
      SettingsRepository.instance = new SettingsRepository();
    }
    return SettingsRepository.instance;
  }

  public get(): Promise<UserSettings> {
    return this.api.get<UserSettings>('/settings');
  }

  public update(changes: UserSettingsUpdate): Promise<UserSettings> {
    return this.api.patch<UserSettings>('/settings', changes);
  }
}

export const settingsRepository = SettingsRepository.getInstance();

