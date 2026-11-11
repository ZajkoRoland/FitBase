import { i18n } from '@/services/LocalizationService';
import { DateHelper } from './DateHelper';

/**
 * RestDayContentHelper
 *
 * OOP utility class providing diverse, situationally aware titles and descriptions
 * for rest days across today, future, and past dates in English and Hungarian.
 */
export class RestDayContentHelper {
  private static readonly TODAY_HU = [
    'Pihenj egyet, megérdemelted! A tested ma építi újjá és erősíti meg az izomrostokat.',
    'Ma a regenerációé a főszerep. Fókuszálj az elegendő alvásra és a bőséges hidratációra!',
    'Aktív pihenés: egy könnyű séta vagy kímélő nyújtás ma csodákra képes.',
    'Az igazi fejlődés a pihenőnapokon történik. Töltsd fel a raktáraidat minőségi ételekkel!',
    'Adj időt az idegrendszerednek és az ízületeidnek a regenerálódásra a következő edzés előtt!',
    'A minőségi pihenés az edzés fele. Hallgass a tested jelzéseire és töltődj fel mára!',
    'Feltöltődés a cél: hidratálj bőségesen, táplálkozz tudatosan és aludj egy kiadósat!',
  ];

  private static readonly FUTURE_HU = [
    'Ezen a napon pihenő és regeneráció van beütemezve a heti edzésterhelés kipihenésére.',
    'Tervezett pihenőnap: a felkészülés és feltöltődés ideje lesz a következő edzések előtt.',
    'Ütemezett regeneráció: alvás, bőséges hidratáció és minőségi pihenés van tervben erre a napra.',
    'A periodizáció része: ezen a napon a szervezet felkészül a következő mikrociklusra.',
    'Tervezett regenerációs nap: kiváló alkalom lesz egy könnyed sétára vagy regenerációs nyújtásra.',
    'Beütemezett pihenő: az izomzat fejlődéséhez elengedhetetlen a heti beépített szünet.',
  ];

  private static readonly PAST_HU = [
    'Ezen a napon sikeresen lezajlott a pihenés és a regeneráció a következő edzésekhez.',
    'Kipihent, sikeres pihenőnap volt a heti edzésciklusban a szervezet feltöltődésére.',
    'A regeneráció sikeresen lezárult ezen a napon.',
  ];

  private static readonly TODAY_EN = [
    "Take a break, you've earned it! Your body is repairing and strengthening muscle fibers today.",
    'Recovery takes center stage today. Focus on quality sleep and ample hydration!',
    'Active recovery day: a gentle walk or light mobility work works wonders today.',
    'True gains happen on rest days. Refuel your glycogen stores with nutritious meals!',
    'Give your central nervous system and joints time to recharge before the next workout!',
    'Quality rest is half the workout. Listen to your body and recharge fully today!',
    'Today is all about rejuvenation: stay hydrated, eat well, and enjoy restorative sleep!',
  ];

  private static readonly FUTURE_EN = [
    'Rest and recovery are scheduled for this day to balance your weekly training load.',
    'Planned rest day: a time to recharge and prepare ahead of your upcoming workouts.',
    'Scheduled recovery: sleep, ample hydration, and quality downtime are planned for this day.',
    'Part of your periodization: your body will prepare for the next training cycle on this day.',
    'Planned recovery: a great opportunity for a light walk or restorative stretching.',
    'Scheduled downtime: essential for muscle repair and joint health between workouts.',
  ];

  private static readonly PAST_EN = [
    'Rest and recovery were completed on this day in preparation for subsequent workouts.',
    'A successful rest day dedicated to recharging and rebuilding your body.',
    'Rest and muscle recovery were successfully completed on this day.',
  ];

  /**
   * Compares the target date to current calendar date (ignoring time).
   */
  public static getDayStatus(targetDate?: Date): 'today' | 'future' | 'past' {
    if (!targetDate) return 'today';

    const now = new Date();
    if (DateHelper.isSameDay(targetDate, now)) {
      return 'today';
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetStart = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    ).getTime();

    if (targetStart > todayStart) {
      return 'future';
    }
    return 'past';
  }

  public static isToday(targetDate?: Date): boolean {
    return this.getDayStatus(targetDate) === 'today';
  }

  public static isFuture(targetDate?: Date): boolean {
    return this.getDayStatus(targetDate) === 'future';
  }

  public static isPast(targetDate?: Date): boolean {
    return this.getDayStatus(targetDate) === 'past';
  }

  /**
   * Returns a localized, situational title for the rest day card.
   */
  public static getTitle(targetDate?: Date): string {
    const status = this.getDayStatus(targetDate);
    if (status === 'today') {
      return i18n.t('plan.restCardTitleToday');
    }
    if (status === 'future') {
      return i18n.t('plan.restCardTitleFuture');
    }
    return i18n.t('plan.restCardTitlePast');
  }

  /**
   * Returns a situational, varied, deterministic description for the rest day.
   */
  public static getDescription(targetDate?: Date, dayIndex?: number): string {
    const status = this.getDayStatus(targetDate);
    const isHu = i18n.isHungarian();
    const date = targetDate || new Date();

    let pool: readonly string[];
    if (status === 'today') {
      pool = isHu ? this.TODAY_HU : this.TODAY_EN;
    } else if (status === 'future') {
      pool = isHu ? this.FUTURE_HU : this.FUTURE_EN;
    } else {
      pool = isHu ? this.PAST_HU : this.PAST_EN;
    }

    const seed = date.getDate() + (dayIndex !== undefined ? dayIndex * 3 : date.getDay() * 2);
    const index = Math.abs(seed) % pool.length;
    return pool[index];
  }
}

