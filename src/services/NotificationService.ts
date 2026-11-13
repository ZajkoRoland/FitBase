import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Notification, NotificationResponse } from 'expo-notifications';
import { Platform } from 'react-native';
import {
  INotificationData,
  NotificationCategory,
  NotificationItem,
} from '@/models/NotificationItem';
import { settingsRepository } from '@/repositories/SettingsRepository';
import { i18n } from '@/services/LocalizationService';
import { PlanService, WorkoutDay } from '@/services/PlanService';
import type { UserSettings } from '@/types/profile';

// Expo Go környezetben nincs natív értesítési modul, ezért ilyenkor mock objektumot használunk, hogy ne szálljon el az app
const MockNotifications = {
  AndroidNotificationPriority: {
    HIGH: 'high',
    DEFAULT: 'default',
    LOW: 'low',
    MIN: 'min',
    MAX: 'max',
  },
  AndroidImportance: {
    HIGH: 4,
    DEFAULT: 3,
    LOW: 2,
    MIN: 1,
    MAX: 5,
    NONE: 0,
  },
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
  },
  setNotificationHandler: () => { },
  cancelAllScheduledNotificationsAsync: async () => { },
  dismissAllNotificationsAsync: async () => { },
  getPresentedNotificationsAsync: async () => [],
  setNotificationChannelAsync: async () => null,
  getPermissionsAsync: async () => ({ status: 'granted' as const }),
  requestPermissionsAsync: async () => ({ status: 'granted' as const }),
  scheduleNotificationAsync: async () => 'mock-notification-id',
  addNotificationReceivedListener: () => ({ remove: () => { } }),
  addNotificationResponseReceivedListener: () => ({ remove: () => { } }),
  getLastNotificationResponseAsync: async () => null,
};

let Notifications: any = MockNotifications;
try {
  const nativeModule = require('expo-notifications');
  if (nativeModule && typeof nativeModule.setNotificationHandler === 'function') {
    Notifications = nativeModule;
  }
} catch {
  // Androidos Expo Go környezetben a natív modul nem érhető el
  Notifications = MockNotifications;
}

// Értesítések megjelenítési beállítása előtérben lévő alkalmazás esetén
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
} catch {
  // Hiba figyelmen kívül hagyása, ha a kezelő nem támogatott
}

export type NotificationSubscriber = () => void;

interface ScheduledNotificationRecord {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  triggerEpochMs: number;
}

const STORAGE_DELIVERED_PREFIX = '@fitbase_notifications_delivered';
const STORAGE_SCHEDULED_RECORDS_PREFIX = '@fitbase_notifications_scheduled_records';
const STORAGE_READ_IDS_PREFIX = '@fitbase_notifications_read_ids';
const STORAGE_DELETED_IDS_PREFIX = '@fitbase_notifications_deleted_ids';
const STORAGE_SCHEDULED_DATE_PREFIX = '@fitbase_scheduled_notifications_date';
const STORAGE_NOTIFICATIONS_ENABLED_PREFIX = '@fitbase_notifications_enabled';

export class NotificationService {
  private activeUserId: string | null = null;
  private activeStreak = 0;
  private activeWeekPlan: WorkoutDay[] = [];
  private notificationsEnabledState = true;
  private notifications: NotificationItem[] = [];
  private scheduledRecords: ScheduledNotificationRecord[] = [];
  private readIds: Set<string> = new Set();
  private deletedIds: Set<string> = new Set();
  private subscribers: Set<NotificationSubscriber> = new Set();
  private initialized = false;

  constructor() {
    this.init();
  }

  public static getInstance(): NotificationService {
    return notificationService;
  }

  private getKey(prefix: string, uid: string | null = this.activeUserId): string | null {
    if (!uid) return null;
    return `${prefix}_${uid}`;
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    await this.setupAndroidChannel();
    this.setupNotificationListeners();
  }

  // Értesítések frissítése az aktuális heti terv alapján
  public async updateWeekPlan(weekPlan: WorkoutDay[]): Promise<void> {
    this.activeWeekPlan = PlanService.normalizeWeekPlan(weekPlan);
    if (this.activeUserId) {
      await this.schedulePhoneNotificationsIfApplicable();
    }
  }

  // Értesítések szinkronizálása a bejelentkezett fiókkal és beállításokkal
  public async syncWithAccount(
    userId: string | null,
    dbSettings?: UserSettings | null,
    streak = 0
  ): Promise<void> {
    if (!userId) {
      this.activeUserId = null;
      this.activeStreak = 0;
      this.activeWeekPlan = [];
      this.notificationsEnabledState = true;
      this.readIds.clear();
      this.deletedIds.clear();
      this.notifications = [];
      this.scheduledRecords = [];
      this.notifySubscribers();
      return;
    }

    this.activeUserId = userId;
    this.activeStreak = streak;

    // Helyi gyorsítótár betöltése az olvasott és törölt állapotok megőrzéséhez
    await this.loadLocalCacheForActiveUser();

    // Adatbázisban tárolt és helyi állapotok összefésülése
    if (dbSettings) {
      this.notificationsEnabledState = dbSettings.notifications_enabled;

      const remoteRead = dbSettings.read_notification_ids || [];
      const remoteDeleted = dbSettings.deleted_notification_ids || [];

      let needsRemoteSync = false;
      const beforeReadSize = this.readIds.size;
      const beforeDelSize = this.deletedIds.size;

      for (const id of remoteRead) {
        this.readIds.add(id);
      }
      for (const id of remoteDeleted) {
        this.deletedIds.add(id);
      }

      if (
        this.readIds.size > remoteRead.length ||
        this.deletedIds.size > remoteDeleted.length ||
        this.readIds.size !== beforeReadSize ||
        this.deletedIds.size !== beforeDelSize
      ) {
        needsRemoteSync = true;
      }

      if (needsRemoteSync) {
        settingsRepository
          .update({
            read_notification_ids: Array.from(this.readIds),
            deleted_notification_ids: Array.from(this.deletedIds),
          })
          .catch(() => { });
      }
    }

    // Lejárt idejű és kézbesített értesítések ellenőrzése
    await this.reconcileDeliveredNotifications();

    // Összefésült állapot mentése és a felület frissítése
    await this.persistLocalCache();
    this.notifySubscribers();

    // Új értesítések ütemezése, ha engedélyezve vannak
    this.schedulePhoneNotificationsIfApplicable().catch(() => { });
  }

  // Felhasználó értesítési adatainak törlése fióktörléskor
  public async clearAccountData(userId: string): Promise<void> {
    const prefixes = [
      STORAGE_DELIVERED_PREFIX,
      STORAGE_SCHEDULED_RECORDS_PREFIX,
      STORAGE_READ_IDS_PREFIX,
      STORAGE_DELETED_IDS_PREFIX,
      STORAGE_SCHEDULED_DATE_PREFIX,
      STORAGE_NOTIFICATIONS_ENABLED_PREFIX,
    ];
    const keys = prefixes
      .map((p) => this.getKey(p, userId))
      .filter((k): k is string => Boolean(k));

    if (keys.length > 0) {
      await AsyncStorage.multiRemove(keys).catch(() => { });
    }
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => { });
    await Notifications.dismissAllNotificationsAsync().catch(() => { });
  }

  private async loadLocalCacheForActiveUser(): Promise<void> {
    const readKey = this.getKey(STORAGE_READ_IDS_PREFIX);
    const delKey = this.getKey(STORAGE_DELETED_IDS_PREFIX);
    const enabledKey = this.getKey(STORAGE_NOTIFICATIONS_ENABLED_PREFIX);
    const deliveredKey = this.getKey(STORAGE_DELIVERED_PREFIX);
    const scheduledRecordsKey = this.getKey(STORAGE_SCHEDULED_RECORDS_PREFIX);

    this.readIds = new Set();
    this.deletedIds = new Set();
    this.notificationsEnabledState = true;
    this.notifications = [];
    this.scheduledRecords = [];

    try {
      const [rawRead, rawDel, rawEnabled, rawDelivered, rawScheduled] = await Promise.all([
        readKey ? AsyncStorage.getItem(readKey) : Promise.resolve(null),
        delKey ? AsyncStorage.getItem(delKey) : Promise.resolve(null),
        enabledKey ? AsyncStorage.getItem(enabledKey) : Promise.resolve(null),
        deliveredKey ? AsyncStorage.getItem(deliveredKey) : Promise.resolve(null),
        scheduledRecordsKey ? AsyncStorage.getItem(scheduledRecordsKey) : Promise.resolve(null),
      ]);

      if (rawRead) {
        const parsed: string[] = JSON.parse(rawRead);
        if (Array.isArray(parsed)) {
          this.readIds = new Set(parsed);
        }
      }
      if (rawDel) {
        const parsed: string[] = JSON.parse(rawDel);
        if (Array.isArray(parsed)) {
          this.deletedIds = new Set(parsed);
        }
      }
      if (rawEnabled !== null) {
        this.notificationsEnabledState = rawEnabled === 'true';
      }
      if (rawScheduled) {
        const parsed: ScheduledNotificationRecord[] = JSON.parse(rawScheduled);
        if (Array.isArray(parsed)) {
          this.scheduledRecords = parsed.filter((r) => r.userId === this.activeUserId);
        }
      }
      if (rawDelivered) {
        const parsed: INotificationData[] = JSON.parse(rawDelivered);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.isRead) {
              this.readIds.add(item.id);
            }
          }
          this.notifications = parsed
            .filter((item) => !this.deletedIds.has(item.id))
            .map(
              (item) =>
                new NotificationItem({
                  ...item,
                  isRead: Boolean(item.isRead || this.readIds.has(item.id)),
                })
            );
        }
      }
    } catch {
      // Helyi tárhely olvasási hiba elnyelése
    }
  }

  private async persistLocalCache(): Promise<void> {
    if (!this.activeUserId) return;
    try {
      const readKey = this.getKey(STORAGE_READ_IDS_PREFIX);
      const delKey = this.getKey(STORAGE_DELETED_IDS_PREFIX);
      const enabledKey = this.getKey(STORAGE_NOTIFICATIONS_ENABLED_PREFIX);
      const deliveredKey = this.getKey(STORAGE_DELIVERED_PREFIX);
      const scheduledRecordsKey = this.getKey(STORAGE_SCHEDULED_RECORDS_PREFIX);

      const serializedDelivered: INotificationData[] = this.notifications
        .filter((n) => !this.deletedIds.has(n.id))
        .map((n) => ({
          id: n.id,
          category: n.category,
          title: n.title,
          message: n.message,
          timestamp: n.timestamp,
          isRead: Boolean(n.isRead || this.readIds.has(n.id)),
        }));

      await Promise.all([
        readKey
          ? AsyncStorage.setItem(readKey, JSON.stringify(Array.from(this.readIds)))
          : Promise.resolve(),
        delKey
          ? AsyncStorage.setItem(delKey, JSON.stringify(Array.from(this.deletedIds)))
          : Promise.resolve(),
        enabledKey
          ? AsyncStorage.setItem(enabledKey, String(this.notificationsEnabledState))
          : Promise.resolve(),
        deliveredKey
          ? AsyncStorage.setItem(deliveredKey, JSON.stringify(serializedDelivered))
          : Promise.resolve(),
        scheduledRecordsKey
          ? AsyncStorage.setItem(scheduledRecordsKey, JSON.stringify(this.scheduledRecords))
          : Promise.resolve(),
      ]);
    } catch {
      // Helyi tárhely írási hiba elnyelése
    }
  }

  // Kézbesített értesítések ellenőrzése és egyeztetése
  private async reconcileDeliveredNotifications(): Promise<void> {
    if (!this.activeUserId) return;

    const nowMs = Date.now();
    const existingById = new Map<string, NotificationItem>();

    for (const item of this.notifications) {
      if (!this.deletedIds.has(item.id)) {
        existingById.set(
          item.id,
          this.readIds.has(item.id) && !item.isRead ? item.markAsRead() : item
        );
      }
    }

    //Ütemezett értesítések ellenőrzése, amelyeknek lejárt az ideje
    const remainingScheduled: ScheduledNotificationRecord[] = [];
    for (const rec of this.scheduledRecords) {
      if (rec.userId !== this.activeUserId) continue;
      if (rec.triggerEpochMs <= nowMs) {
        if (!this.deletedIds.has(rec.id) && !existingById.has(rec.id)) {
          existingById.set(
            rec.id,
            new NotificationItem({
              id: rec.id,
              category: rec.category,
              title: rec.title,
              message: rec.message,
              timestamp: rec.timestamp,
              isRead: this.readIds.has(rec.id),
            })
          );
        }
      } else {
        remainingScheduled.push(rec);
      }
    }
    this.scheduledRecords = remainingScheduled;

    //Kézbesített értesítések ellenőrzése az értesítési sávban
    try {
      const presented = await Notifications.getPresentedNotificationsAsync();
      for (const notif of presented) {
        const data = notif.request.content.data as Record<string, unknown> | undefined;
        const notifId = typeof data?.notificationId === 'string' ? data.notificationId : null;
        const notifUserId = typeof data?.userId === 'string' ? data.userId : null;
        if (
          notifId &&
          notifUserId === this.activeUserId &&
          !this.deletedIds.has(notifId) &&
          !existingById.has(notifId)
        ) {
          const category = (data?.category as NotificationCategory) || 'reminder';
          const timestamp =
            typeof data?.timestamp === 'string' ? data.timestamp : i18n.t('date.today');
          existingById.set(
            notifId,
            new NotificationItem({
              id: notifId,
              category,
              title: notif.request.content.title || i18n.t('notifications.fallbackTitle'),
              message: notif.request.content.body || '',
              timestamp,
              isRead: this.readIds.has(notifId),
            })
          );
        }
      }
    } catch {
      // Platform támogatási hiba figyelmen kívül hagyása
    }

    this.notifications = Array.from(existingById.values());
  }

  private recordDeliveredNotification(data: INotificationData, targetUserId?: string): void {
    if (!this.activeUserId) return;
    if (targetUserId && targetUserId !== this.activeUserId) return;
    if (this.deletedIds.has(data.id)) return;

    const alreadyExists = this.notifications.some((n) => n.id === data.id);
    if (alreadyExists) {
      this.notifications = this.notifications.map((n) =>
        n.id === data.id && this.readIds.has(n.id) && !n.isRead ? n.markAsRead() : n
      );
    } else {
      const item = new NotificationItem({
        ...data,
        isRead: Boolean(data.isRead || this.readIds.has(data.id)),
      });
      this.notifications = [item, ...this.notifications];
    }

    // Kézbesített értesítés törlése a függő rekordok közül
    this.scheduledRecords = this.scheduledRecords.filter((r) => r.id !== data.id);
    this.persistLocalCache();
    this.notifySubscribers();
  }

  private async setupAndroidChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('fitbase-daily', {
          name: i18n.t('notifications.channelName'),
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4AB8F8',
          sound: 'default',
        });
      } catch (err) {
        console.warn('[NotificationService] Android channel setup error:', err);
      }
    }
  }

  public static calculateWindowTime(
    dateSeed: string,
    startHour: number,
    endHour: number,
    extraMinutes = 0
  ): { hour: number; minute: number; timeString: string } {
    let hash = 0;
    const combinedSeed = `${dateSeed}_${startHour}_${endHour}`;
    for (let i = 0; i < combinedSeed.length; i++) {
      hash = (hash << 5) - hash + combinedSeed.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash);
    const totalMinutes = (endHour - startHour) * 60 + extraMinutes;
    const minuteOffset = positiveHash % totalMinutes;
    const hour = startHour + Math.floor(minuteOffset / 60);
    const minute = minuteOffset % 60;

    const formattedHour = String(hour).padStart(2, '0');
    const formattedMinute = String(minute).padStart(2, '0');

    return {
      hour,
      minute,
      timeString: `${formattedHour}:${formattedMinute}`,
    };
  }

  public async schedulePhoneNotificationsIfApplicable(): Promise<void> {
    try {
      if (!this.activeUserId) return;
      const isEnabled = await this.isNotificationsEnabled();
      if (!isEnabled) return;

      const today = new Date();
      const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
      const weekPlan =
        this.activeWeekPlan.length === 7
          ? this.activeWeekPlan
          : PlanService.getInstance().getWeekPlan();
      const todayPlan = weekPlan[dayIndex];
      const isRestDay = todayPlan?.type === 'rest';
      const todayExercises = todayPlan?.exercises ?? [];
      const hasAnyPlannedExercises = weekPlan.some(
        (d) => d.type === 'workout' && (d.exercises?.length ?? 0) > 0
      );

      // Üres új fiók esetén nem ütemezünk értesítést (0 gyakorlat és 0 széria)
      if (!hasAnyPlannedExercises && this.activeStreak <= 0 && !isRestDay) {
        return;
      }

      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const schedKey = this.getKey(STORAGE_SCHEDULED_DATE_PREFIX);
      if (schedKey) {
        const alreadyScheduled = await AsyncStorage.getItem(schedKey);
        if (alreadyScheduled === dateKey) return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status !== 'granted') return;
      }

      const now = new Date();
      let scheduledAny = false;

      if (isRestDay && hasAnyPlannedExercises) {
        const restId = `recovery-${dateKey}`;
        if (!this.readIds.has(restId) && !this.deletedIds.has(restId)) {
          const { hour, minute, timeString } = NotificationService.calculateWindowTime(
            dateKey,
            10,
            11
          );
          const restDate = new Date(today);
          restDate.setHours(hour, minute, 0, 0);

          if (restDate > now) {
            const title = i18n.t('notifications.restTitle');
            const message = i18n.t('notifications.restBody');
            const timestamp = i18n.t('date.todayTime', { time: timeString });

            await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body: message,
                sound: 'default',
                data: {
                  notificationId: restId,
                  userId: this.activeUserId,
                  category: 'recovery',
                  timestamp,
                },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: restDate,
              },
            });

            this.scheduledRecords = [
              ...this.scheduledRecords.filter((r) => r.id !== restId),
              {
                id: restId,
                userId: this.activeUserId,
                category: 'recovery',
                title,
                message,
                timestamp,
                triggerEpochMs: restDate.getTime(),
              },
            ];
            scheduledAny = true;
          }
        }
      } else if (!isRestDay && todayExercises.length > 0) {
        const workoutId = `workout-${dateKey}`;
        if (!this.readIds.has(workoutId) && !this.deletedIds.has(workoutId)) {
          const { hour, minute, timeString } = NotificationService.calculateWindowTime(
            dateKey,
            7,
            10
          );
          const workoutDate = new Date(today);
          workoutDate.setHours(hour, minute, 0, 0);

          if (workoutDate > now) {
            const workoutTitle = todayPlan?.workoutTitle
              ? i18n.translateWorkoutTitle(todayPlan.workoutTitle)
              : i18n.t('plan.scheduledWorkoutFallback');
            const title = `${workoutTitle} 🏋️`;
            const message = i18n.t('notifications.workoutBody');
            const timestamp = i18n.t('date.todayTime', { time: timeString });

            await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body: message,
                sound: 'default',
                data: {
                  notificationId: workoutId,
                  userId: this.activeUserId,
                  category: 'workout',
                  timestamp,
                },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: workoutDate,
              },
            });

            this.scheduledRecords = [
              ...this.scheduledRecords.filter((r) => r.id !== workoutId),
              {
                id: workoutId,
                userId: this.activeUserId,
                category: 'workout',
                title,
                message,
                timestamp,
                triggerEpochMs: workoutDate.getTime(),
              },
            ];
            scheduledAny = true;
          }
        }
      }

      // Pihenőnapokon nem küldünk figyelmeztetést
      if (!isRestDay && (this.activeStreak > 0 || todayExercises.length > 0)) {
        const streakId = `streak-${dateKey}`;
        if (!this.readIds.has(streakId) && !this.deletedIds.has(streakId)) {
          const { hour, minute, timeString } = NotificationService.calculateWindowTime(
            dateKey,
            17,
            19,
            30
          );
          const streakDate = new Date(today);
          streakDate.setHours(hour, minute, 0, 0);

          if (streakDate > now) {
            const currentStreak = this.activeStreak;
            const title =
              currentStreak > 0
                ? i18n.t('notifications.streakActiveTitle', { count: currentStreak })
                : i18n.t('notifications.streakReminderTitle');
            const message =
              currentStreak > 0
                ? i18n.t('notifications.streakActiveBody', { count: currentStreak })
                : i18n.t('notifications.streakReminderBody');
            const timestamp = i18n.t('date.todayTime', { time: timeString });

            await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body: message,
                sound: 'default',
                data: {
                  notificationId: streakId,
                  userId: this.activeUserId,
                  category: 'streak',
                  timestamp,
                },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: streakDate,
              },
            });

            this.scheduledRecords = [
              ...this.scheduledRecords.filter((r) => r.id !== streakId),
              {
                id: streakId,
                userId: this.activeUserId,
                category: 'streak',
                title,
                message,
                timestamp,
                triggerEpochMs: streakDate.getTime(),
              },
            ];
            scheduledAny = true;
          }
        }
      }

      if (scheduledAny) {
        await this.persistLocalCache();
        if (schedKey) {
          await AsyncStorage.setItem(schedKey, dateKey);
        }
      }
    } catch (err) {
      console.warn('[NotificationService] schedulePhoneNotifications error:', err);
    }
  }

  private setupNotificationListeners(): void {
    try {
      // Értesítés beérkezésekor lefutó eseménykezelő az app futása közben
      Notifications.addNotificationReceivedListener((notification: Notification) => {
        const content = notification.request.content;
        const data = content.data as Record<string, unknown> | undefined;
        const notifId =
          typeof data?.notificationId === 'string'
            ? data.notificationId
            : notification.request.identifier;
        const notifUserId = typeof data?.userId === 'string' ? data.userId : undefined;
        const category = (data?.category as NotificationCategory) || 'reminder';
        const now = new Date();
        const fallbackTime = i18n.t('date.todayTime', {
          time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        });
        const timestamp =
          typeof data?.timestamp === 'string' ? data.timestamp : fallbackTime;

        this.recordDeliveredNotification(
          {
            id: notifId,
            category,
            title: content.title || i18n.t('notifications.fallbackTitle'),
            message: content.body || '',
            timestamp,
            isRead: false,
          },
          notifUserId
        );
      });

      // Felhasználói kattintás kezelése az értesítésre
      const handleResponse = (response: NotificationResponse | null) => {
        if (!response) return;
        const content = response.notification.request.content;
        const data = content.data as Record<string, unknown> | undefined;
        const notifId =
          typeof data?.notificationId === 'string'
            ? data.notificationId
            : response.notification.request.identifier;
        const notifUserId = typeof data?.userId === 'string' ? data.userId : undefined;
        const category = (data?.category as NotificationCategory) || 'reminder';
        const timestamp =
          typeof data?.timestamp === 'string' ? data.timestamp : i18n.t('date.today');

        this.recordDeliveredNotification(
          {
            id: notifId,
            category,
            title: content.title || i18n.t('notifications.fallbackTitle'),
            message: content.body || '',
            timestamp,
            isRead: true,
          },
          notifUserId
        );
        this.markAsRead(notifId);
      };

      Notifications.getLastNotificationResponseAsync()
        .then(handleResponse)
        .catch(() => { });

      Notifications.addNotificationResponseReceivedListener(handleResponse);
    } catch (err) {
      console.warn('[NotificationService] Notification listener setup error:', err);
    }
  }

  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  public markAsRead(id: string): void {
    this.readIds.add(id);

    let changed = false;
    this.notifications = this.notifications.map((item) => {
      if (item.id === id && !item.isRead) {
        changed = true;
        return item.markAsRead();
      }
      return item;
    });

    this.persistReadIds();
    if (changed) {
      this.notifySubscribers();
    }
  }

  public markAllAsRead(): void {
    if (this.notifications.length === 0) return;

    this.notifications.forEach((n) => this.readIds.add(n.id));
    this.notifications = this.notifications.map((n) => (n.isRead ? n : n.markAsRead()));
    this.persistReadIds();
    this.notifySubscribers();
  }

  public deleteNotification(id: string): void {
    this.deletedIds.add(id);
    this.notifications = this.notifications.filter((item) => item.id !== id);
    this.scheduledRecords = this.scheduledRecords.filter((rec) => rec.id !== id);
    this.persistDeletedIds();
    this.notifySubscribers();
  }

  public clearAllNotifications(): void {
    if (this.notifications.length === 0) return;
    this.notifications.forEach((item) => this.deletedIds.add(item.id));
    this.notifications = [];
    this.persistDeletedIds();
    this.notifySubscribers();
  }

  private async persistReadIds(): Promise<void> {
    await this.persistLocalCache();
    if (this.activeUserId) {
      settingsRepository
        .update({ read_notification_ids: Array.from(this.readIds) })
        .catch(() => { });
    }
  }

  private async persistDeletedIds(): Promise<void> {
    await this.persistLocalCache();
    if (this.activeUserId) {
      settingsRepository
        .update({ deleted_notification_ids: Array.from(this.deletedIds) })
        .catch(() => { });
    }
  }

  public async isNotificationsEnabled(): Promise<boolean> {
    return this.notificationsEnabledState;
  }

  public async setNotificationsEnabled(enabled: boolean): Promise<void> {
    try {
      this.notificationsEnabledState = enabled;
      if (!enabled) {
        this.scheduledRecords = [];
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      await this.persistLocalCache();
      if (this.activeUserId) {
        settingsRepository.update({ notifications_enabled: enabled }).catch(() => { });
      }
      if (enabled) {
        const schedKey = this.getKey(STORAGE_SCHEDULED_DATE_PREFIX);
        if (schedKey) await AsyncStorage.removeItem(schedKey);
        await this.schedulePhoneNotificationsIfApplicable();
      }
      this.notifySubscribers();
    } catch (err) {
      console.warn('[NotificationService] Failed to update notification setting:', err);
    }
  }

  public subscribe(subscriber: NotificationSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.warn('[NotificationService] Subscriber callback error:', err);
      }
    });
  }
}

export const notificationService = new NotificationService();
