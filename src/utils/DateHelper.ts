import { i18n } from '@/services/LocalizationService';

// Naptár és dátum segédfüggvények (ISO hétszámok, hétfői nap meghatározása, napok rövidítései)
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

  // Lokalizált rövid napnevek (HÉT..VAS vagy MON..SUN)
  public static getLocalizedShortDays(): readonly string[] {
    return i18n.getShortUpperDays();
  }

  // Teljes napnév lekérése (pl. Hétfő / Monday)
  public static getFullDayName(day: string | number): string {
    return i18n.getDayForms(day).full;
  }

  // Az adott hét hétfői napjának meghatározása
  public static getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // ISO 8601 szerinti hétszám (1-53)
  public static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  // Hét intervallum formázása az aktív nyelven
  public static formatWeekRange(monday: Date): string {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return i18n.formatWeekRange(monday, sunday);
  }

  // Év és hétszám kiírása
  public static formatWeekMeta(date: Date): string {
    const year = date.getFullYear();
    const week = DateHelper.getWeekNumber(date);
    return i18n.t('date.weekMeta', { year, week });
  }

  // Hónap és év formázása
  public static formatMonthYear(date: Date): string {
    return i18n.formatMonthYear(date);
  }

  // Rövid havi metaadatok kiírása (napok száma és év)
  public static formatMonthMeta(date: Date): string {
    const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return i18n.t('date.monthMeta', { days, year: date.getFullYear() });
  }

  // Két dátum összehasonlítása napra pontosan
  public static isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  // A hét 7 napjának generálása hétfőtől kezdődően
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

  // Időszaknak megfelelő köszöntés az eszköz órája alapján
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

  // Eszköz időzónájának lekérése
  public static getDeviceTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }

  // YYYY-MM-DD helyi idő szerint
  public static getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
