import { i18n } from '@/services/LocalizationService';

/**
 * DateHelper
 *
 * OOP utility class providing calendar calculations, ISO week numbers,
 * localized date ranges (English & Hungarian), and 7-day week schedule generation.
 */
export class DateHelper {
  public static readonly ENGLISH_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  public static readonly ENGLISH_FULL_DAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  /**
   * Returns localized uppercase 3-letter weekday abbreviations ( ['MON'...'SUN'] or ['HÉT'...'VAS']).
   */
  public static getLocalizedShortDays(): readonly string[] {
    return i18n.getShortUpperDays();
  }

  /**
   * Converts day abbreviations or indices ('Mon', 'Tue', 0) to localized full day names
   * ('Monday' or 'Hétfő').
   */
  public static getFullDayName(day: string | number): string {
    return i18n.getDayForms(day).full;
  }

  /**
   * Returns Monday of the week containing the given date.
   */
  public static getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Returns the ISO 8601 week number (1-53).
   */
  public static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Formats a week range in the active language, e.g. "Oct 26 – Nov 1" or "okt. 26. – nov. 1."
   */
  public static formatWeekRange(monday: Date): string {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return i18n.formatWeekRange(monday, sunday);
  }

  /**
   * Formats week metadata, e.g. "2026 · Week 44" or "2026 · 44. hét"
   */
  public static formatWeekMeta(date: Date): string {
    const year = date.getFullYear();
    const week = DateHelper.getWeekNumber(date);
    return i18n.t('date.weekMeta', { year, week });
  }

  /**
   * Formats month and year in the active language, e.g. "October 2026" or "2026. október"
   */
  public static formatMonthYear(date: Date): string {
    return i18n.formatMonthYear(date);
  }

  /**
   * Formats short month metadata, e.g. "31 days · 2026" or "31 nap · 2026"
   */
  public static formatMonthMeta(date: Date): string {
    const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return i18n.t('date.monthMeta', { days, year: date.getFullYear() });
  }

  /**
   * Checks if two dates represent the same calendar day.
   */
  public static isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  /**
   * Generates the 7 calendar days for the week starting at Monday.
   */
  public static getWeekDays(monday: Date): Array<{
    dayName: string;
    dayNum: number;
    date: Date;
    isToday: boolean;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shortDays = i18n.getShortUpperDays();

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        dayName: shortDays[i],
        dayNum: d.getDate(),
        date: d,
        isToday: DateHelper.isSameDay(d, today),
      };
    });
  }

  /**
   * Returns a localized time-appropriate greeting ('Good morning' / 'Jó reggelt')
   * based on the current local hour of the user's device.
   */
  public static getTimeBasedGreeting(date: Date = new Date()): string {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) {
      return i18n.t('greeting.morning');
    } else if (hour >= 12 && hour < 17) {
      return i18n.t('greeting.afternoon');
    } else {
      return i18n.t('greeting.evening');
    }
  }

  /**
   * Returns the device's local timezone identifier ('Europe/Budapest').
   */
  public static getDeviceTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }
}
