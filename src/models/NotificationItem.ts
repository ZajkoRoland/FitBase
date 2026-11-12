import { i18n } from '@/services/LocalizationService';

export type NotificationCategory = 'workout' | 'streak' | 'reminder' | 'recovery';

export interface INotificationData {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
}

// Alkalmazáson belüli értesítés modellje
export class NotificationItem {
  public readonly id: string;
  public readonly category: NotificationCategory;
  public readonly title: string;
  public readonly message: string;
  public readonly timestamp: string;
  public readonly isRead: boolean;

  constructor(data: INotificationData) {
    this.id = data.id;
    this.category = data.category;
    this.title = data.title;
    this.message = data.message;
    this.timestamp = data.timestamp;
    this.isRead = Boolean(data.isRead);
  }

  // Olvasottnak jelölés
  public markAsRead(): NotificationItem {
    return new NotificationItem({
      id: this.id,
      category: this.category,
      title: this.title,
      message: this.message,
      timestamp: this.timestamp,
      isRead: true,
    });
  }

  // Kategóriához tartozó szín lekérése
  public getCategoryAccentColor(): string {
    switch (this.category) {
      case 'workout':
        return '#4AB8F8';
      case 'streak':
        return '#FF8C42';
      case 'reminder':
        return '#A78BFA';
      case 'recovery':
        return '#34D399';
      default:
        return '#4AB8F8';
    }
  }

  // Kategória lefordított neve
  public getCategoryLabel(): string {
    switch (this.category) {
      case 'workout':
        return i18n.t('notifications.cat.workout');
      case 'streak':
        return i18n.t('notifications.cat.streak');
      case 'reminder':
        return i18n.t('notifications.cat.reminder');
      case 'recovery':
        return i18n.t('notifications.cat.recovery');
      default:
        return i18n.t('notifications.cat.default');
    }
  }

  // Lefordított időbélyeg formázása
  public getLocalizedTimestamp(): string {
    return i18n.translateNotificationTimestamp(this.timestamp);
  }
}
