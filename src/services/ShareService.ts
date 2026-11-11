import { i18n } from '@/services/LocalizationService';
import type { Profile } from '@/types/profile';
import { Share } from 'react-native';

/**
 * ShareService
 * Encapsulates formatted workout progress sharing via native platform share dialogs.
 */
export class ShareService {
  private static instance: ShareService;

  private constructor() { }

  public static getInstance(): ShareService {
    if (!ShareService.instance) {
      ShareService.instance = new ShareService();
    }
    return ShareService.instance;
  }

  /**
   * Shares the user's athletic progress stats in the active language.
   */
  public async shareProgress(profile: Profile | null): Promise<void> {
    const name = profile?.display_name || profile?.username || i18n.t('greeting.defaultAthlete');
    const streak = profile?.streak || 0;
    const sessions = profile?.sessions_this_week || 0;
    const hours = profile?.total_hours || 0;

    const message = [
      i18n.t('stats.share.header', { name }),
      i18n.t('stats.share.streak', { streak }),
      i18n.t('stats.share.weekly', { sessions }),
      i18n.t('stats.share.hours', { hours }),
      ``,
      i18n.t('stats.share.footer'),
    ].join('\n');

    try {
      await Share.share({
        message,
        title: i18n.t('stats.share.title'),
      });
    } catch (err) {
      console.warn('[ShareService] Share failed:', err);
    }
  }
}

export const shareService = ShareService.getInstance();
