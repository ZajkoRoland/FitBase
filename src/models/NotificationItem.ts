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

/**
 * NotificationItem Domain Model 
 * Immutable representation of an in-app fitness notification item.
 */
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

  /**
   * Produces an updated immutable copy marked as read.
   */
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

  /**
   * Resolves the theme accent color for each notification category.
   */
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

  /**
   * Friendly category display title in the active language.
   */
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

  /**
   * Returns localized timestamp ("Today, 09:00" -> "Ma, 09:00").
   */
  public getLocalizedTimestamp(): string {
    return i18n.translateNotificationTimestamp(this.timestamp);
  }
}
