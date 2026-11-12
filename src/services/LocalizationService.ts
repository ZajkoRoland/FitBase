import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EQUIPMENT_HU_MAP,
  resolveEnglishExerciseTitle,
  resolveHungarianExerciseTitle,
} from './ExerciseHuCatalog';

export type SupportedLanguageCode = 'en' | 'hu' | 'de' | 'es' | 'fr';

export const STORAGE_LANGUAGE_KEY = '@fitbase_app_language';

import { en as EN_TRANSLATIONS, hu as HU_TRANSLATIONS } from '@/locales';


// A hét napjainak nyelvtani alakjai
interface DayForms {
  full: string;         // Hétfő
  fullLower: string;    // hétfő
  shortUpper: string;   // HÉT
  calendarCol: string;  // H
  adjectival: string;   // hétfői (pl. "hétfői edzésterv")
  adjectivalCap: string;// Hétfői
  sublative: string;    // hétfőre (pl. "hétfőre nincs edzés")
  sublativeCap: string; // Hétfőre
  accusative: string;   // a hétfőt (pl. "Jelöld meg a hétfőt pihenőnapként")
}

const HU_DAY_FORMS: readonly DayForms[] = [
  { full: 'Hétfő', fullLower: 'hétfő', shortUpper: 'HÉT', calendarCol: 'H', adjectival: 'hétfői', adjectivalCap: 'Hétfői', sublative: 'hétfőre', sublativeCap: 'Hétfőre', accusative: 'a hétfőt' },
  { full: 'Kedd', fullLower: 'kedd', shortUpper: 'KE', calendarCol: 'K', adjectival: 'keddi', adjectivalCap: 'Keddi', sublative: 'keddre', sublativeCap: 'Keddre', accusative: 'a keddet' },
  { full: 'Szerda', fullLower: 'szerda', shortUpper: 'SZE', calendarCol: 'Sz', adjectival: 'szerdai', adjectivalCap: 'Szerdai', sublative: 'szerdára', sublativeCap: 'Szerdára', accusative: 'a szerdát' },
  { full: 'Csütörtök', fullLower: 'csütörtök', shortUpper: 'CSÜT', calendarCol: 'Cs', adjectival: 'csütörtöki', adjectivalCap: 'Csütörtöki', sublative: 'csütörtökre', sublativeCap: 'Csütörtökre', accusative: 'a csütörtököt' },
  { full: 'Péntek', fullLower: 'péntek', shortUpper: 'PÉN', calendarCol: 'P', adjectival: 'pénteki', adjectivalCap: 'Pénteki', sublative: 'péntekre', sublativeCap: 'Péntekre', accusative: 'a pénteket' },
  { full: 'Szombat', fullLower: 'szombat', shortUpper: 'SZO', calendarCol: 'Sz', adjectival: 'szombati', adjectivalCap: 'Szombati', sublative: 'szombatra', sublativeCap: 'Szombatra', accusative: 'a szombatot' },
  { full: 'Vasárnap', fullLower: 'vasárnap', shortUpper: 'VAS', calendarCol: 'V', adjectival: 'vasárnapi', adjectivalCap: 'Vasárnapi', sublative: 'vasárnapra', sublativeCap: 'Vasárnapra', accusative: 'a vasárnapot' },
];

const EN_DAY_FORMS: readonly DayForms[] = [
  { full: 'Monday', fullLower: 'Monday', shortUpper: 'MON', calendarCol: 'M', adjectival: "Monday's", adjectivalCap: "Monday's", sublative: 'Monday', sublativeCap: 'Monday', accusative: 'Monday' },
  { full: 'Tuesday', fullLower: 'Tuesday', shortUpper: 'TUE', calendarCol: 'T', adjectival: "Tuesday's", adjectivalCap: "Tuesday's", sublative: 'Tuesday', sublativeCap: 'Tuesday', accusative: 'Tuesday' },
  { full: 'Wednesday', fullLower: 'Wednesday', shortUpper: 'WED', calendarCol: 'W', adjectival: "Wednesday's", adjectivalCap: "Wednesday's", sublative: 'Wednesday', sublativeCap: 'Wednesday', accusative: 'Wednesday' },
  { full: 'Thursday', fullLower: 'Thursday', shortUpper: 'THU', calendarCol: 'T', adjectival: "Thursday's", adjectivalCap: "Thursday's", sublative: 'Thursday', sublativeCap: 'Thursday', accusative: 'Thursday' },
  { full: 'Friday', fullLower: 'Friday', shortUpper: 'FRI', calendarCol: 'F', adjectival: "Friday's", adjectivalCap: "Friday's", sublative: 'Friday', sublativeCap: 'Friday', accusative: 'Friday' },
  { full: 'Saturday', fullLower: 'Saturday', shortUpper: 'SAT', calendarCol: 'S', adjectival: "Saturday's", adjectivalCap: "Saturday's", sublative: 'Saturday', sublativeCap: 'Saturday', accusative: 'Saturday' },
  { full: 'Sunday', fullLower: 'Sunday', shortUpper: 'SUN', calendarCol: 'S', adjectival: "Sunday's", adjectivalCap: "Sunday's", sublative: 'Sunday', sublativeCap: 'Sunday', accusative: 'Sunday' },
];

const HU_MONTHS_CAP = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December',
];

const HU_MONTHS_LOWER = [
  'január', 'február', 'március', 'április', 'május', 'június',
  'július', 'augusztus', 'szeptember', 'október', 'november', 'december',
];

const HU_MONTHS_SHORT = [
  'jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.',
  'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.',
];

const EN_MONTHS_CAP = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Dinamikus edzéscímek és zónák fordítási szótára
const WORKOUT_TITLE_HU_MAP: Record<string, string> = {
  'rest day': 'Pihenőnap',
  'rest': 'Pihenőnap',
  'pihenőnap': 'Pihenőnap',
  'workout': 'Edzés',
  'workout day': 'Edzésnap',
  'scheduled workout': 'Ütemezett edzés',
  'workout session': 'Edzés',
  'full body & core': 'Teljes test és törzs',
  'full body': 'Teljes test',
  'upper body': 'Felsőtest',
  'lower body': 'Alsótest',
  'back & shoulders': 'Hát és váll',
  'chest & triceps': 'Mell és tricepsz',
  'chest & arms': 'Mell és kar',
  'back & biceps': 'Hát és bicepsz',
  'back & arms': 'Hát és kar',
  'chest & shoulders': 'Mell és váll',
  'chest & back': 'Mell és hát',
  'shoulders & arms': 'Váll és kar',
  'legs & core': 'Láb és törzs',
  'arms & core': 'Kar és törzs',
  'chest': 'Mell edzés',
  'back': 'Hát edzés',
  'shoulders': 'Váll edzés',
  'leg day': 'Lábnap',
  'legs': 'Lábnap',
  'biceps': 'Bicepsz',
  'triceps': 'Tricepsz',
  'arm day': 'Karnap',
  'arms': 'Karnap',
  'core & abs': 'Törzs és has',
  'core': 'Törzs és has',
  'cardio & conditioning': 'Kardió és állóképesség',
  'cardio': 'Kardió',
  'push day': 'Toló nap (Push)',
  'pull day': 'Húzó nap (Pull)',
  'upper body strength': 'Felsőtest erő',
  'lower body power': 'Alsótest erő',
  'active recovery & core': 'Aktív regeneráció és törzs',
  'hiit & full body': 'HIIT és teljes test',
};

const ZONE_NAME_HU_MAP: Record<string, string> = {
  'chest': 'Mell',
  'back': 'Hát',
  'shoulders': 'Váll',
  'arms': 'Kar',
  'upper arms': 'Kar',
  'lower arms': 'Alkar',
  'legs': 'Láb',
  'upper legs': 'Combizmok',
  'lower legs': 'Vádli',
  'core': 'Törzs',
  'waist': 'Derék és has',
  'full body': 'Teljes test',
  'cardio': 'Kardió',
  'compound': 'Összetett',
  'general': 'Általános',
  'blueprint': 'Tervsablon',
};

const MUSCLE_HU_MAP: Record<string, string> = {
  'chest': 'Mellizom',
  'pectoralis major': 'Nagy mellizom',
  'pectorals': 'Mellizmok',
  'back': 'Hátizom',
  'latissimus dorsi': 'Széles hátizom',
  'lats': 'Széles hátizom',
  'trapezius': 'Trapézizom',
  'traps': 'Trapézizom',
  'rhomboids': 'Rombuszizom',
  'erector spinae': 'Gerincmerevítő izom',
  'lower back': 'Alsó hát',
  'shoulders': 'Vállizom',
  'deltoids': 'Deltaizom',
  'anterior deltoid': 'Elülső deltaizom',
  'anterior deltoids': 'Elülső deltaizom',
  'lateral deltoid': 'Oldalsó deltaizom',
  'posterior deltoid': 'Hátsó deltaizom',
  'biceps': 'Bicepsz',
  'biceps brachii': 'Kétfejű karizom (bicepsz)',
  'brachialis': 'Karizom',
  'brachioradialis': 'Karorsói izom',
  'triceps': 'Tricepsz',
  'triceps brachii': 'Háromfejű karizom (tricepsz)',
  'forearms': 'Alkar',
  'forearm extensors': 'Alkar feszítőizmai',
  'forearm flexors': 'Alkar hajlítóizmai',
  'quadriceps': 'Négyfejű combizom',
  'quads': 'Combfeszítő',
  'hamstrings': 'Combhajlító',
  'glutes': 'Farizom',
  'gluteus maximus': 'Nagy farizom',
  'gluteus medius': 'Középső farizom',
  'calves': 'Vádli',
  'gastrocnemius': 'Vádli',
  'soleus': 'Gázlóizom',
  'tibialis anterior': 'Elülső sípcsonti izom',
  'abs': 'Hasizom',
  'abdominals': 'Hasizmok',
  'rectus abdominis': 'Egyenes hasizom',
  'transverse abdominis': 'Haránt hasizom',
  'obliques': 'Ferde hasizom',
  'serratus anterior': 'Elülső fűrészizom',
  'core': 'Törzsizmok',
  'hip flexors': 'Csípőhorpasz',
  'adductors': 'Combközelítő',
  'abductors': 'Combtávolító',
  'full body': 'Teljes test',
};



type LanguageChangeListener = (lang: SupportedLanguageCode) => void;

// Nyelvkezelő szolgáltatás: többnyelvű fordítások betöltése,
// magyar ragozások (hétfői, hétfőre, a hétfőt) és számformázás kezelése.
export class LocalizationService {
  private static instance: LocalizationService;
  private currentLanguage: SupportedLanguageCode = 'en';
  private listeners: Set<LanguageChangeListener> = new Set();
  private initialized = false;

  private constructor() { }

  public static getInstance(): LocalizationService {
    if (!LocalizationService.instance) {
      LocalizationService.instance = new LocalizationService();
    }
    return LocalizationService.instance;
  }

  public async init(): Promise<SupportedLanguageCode> {
    if (this.initialized) return this.currentLanguage;
    try {
      const saved = await AsyncStorage.getItem(STORAGE_LANGUAGE_KEY);
      if (saved && this.isValidLanguage(saved)) {
        this.currentLanguage = saved;
      }
    } catch {
      // Alapértelmezett nyelv használata hiba esetén
    }
    this.initialized = true;
    return this.currentLanguage;
  }

  private isValidLanguage(code: string): code is SupportedLanguageCode {
    return ['en', 'hu', 'de', 'es', 'fr'].includes(code);
  }

  public getLanguage(): SupportedLanguageCode {
    return this.currentLanguage;
  }

  public isHungarian(): boolean {
    return this.currentLanguage === 'hu';
  }

  public async setLanguage(code: string): Promise<void> {
    const validCode: SupportedLanguageCode = this.isValidLanguage(code) ? code : 'en';
    this.currentLanguage = validCode;
    this.initialized = true;
    try {
      await AsyncStorage.setItem(STORAGE_LANGUAGE_KEY, validCode);
    } catch {
      // Mentési hiba elnyelése
    }
    this.listeners.forEach((listener) => listener(validCode));
  }

  public subscribe(listener: LanguageChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Szöveg fordítása kulcs alapján, opcionális paraméterek behelyettesítésével
  public t(key: string, params?: Record<string, string | number>): string {
    const dict = this.currentLanguage === 'hu' ? HU_TRANSLATIONS : EN_TRANSLATIONS;
    let template = dict[key] ?? EN_TRANSLATIONS[key] ?? key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        const formattedVal =
          this.currentLanguage === 'hu' && typeof v === 'number'
            ? this.formatNumber(v)
            : String(v);
        template = template.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), formattedVal);
      }
    }

    return template;
  }

  // Számok formázása (magyarban vessző, angolban pont tizedesjegy)
  public formatNumber(value: number): string {
    const str = String(value);
    if (this.currentLanguage === 'hu') {
      return str.replace('.', ',');
    }
    return str;
  }

  // Hét napjának indexe (0 = hétfő ... 6 = vasárnap)
  public resolveDayIndex(dayOrIndex: string | number): number {
    if (typeof dayOrIndex === 'number') {
      return ((dayOrIndex % 7) + 7) % 7;
    }
    const clean = dayOrIndex.trim().toLowerCase();
    const map: Record<string, number> = {
      mon: 0, monday: 0, hét: 0, hétfő: 0, hetfo: 0,
      tue: 1, tuesday: 1, ked: 1, kedd: 1,
      wed: 2, wednesday: 2, sze: 2, szerda: 2,
      thu: 3, thursday: 3, csü: 3, csütörtök: 3, csutortok: 3,
      fri: 4, friday: 4, pén: 4, péntek: 4, pentek: 4,
      sat: 5, saturday: 5, szo: 5, szombat: 5,
      sun: 6, sunday: 6, vas: 6, vasárnap: 6, vasarnap: 6,
    };
    return map[clean] ?? 0;
  }

  public getDayForms(dayOrIndex: string | number): DayForms {
    const idx = this.resolveDayIndex(dayOrIndex);
    return this.currentLanguage === 'hu' ? HU_DAY_FORMS[idx] : EN_DAY_FORMS[idx];
  }

  public getCalendarColumnHeaders(): readonly string[] {
    const list = this.currentLanguage === 'hu' ? HU_DAY_FORMS : EN_DAY_FORMS;
    return list.map((d) => d.calendarCol);
  }

  public getShortUpperDays(): readonly string[] {
    const list = this.currentLanguage === 'hu' ? HU_DAY_FORMS : EN_DAY_FORMS;
    return list.map((d) => d.shortUpper);
  }

  public getMonthName(monthIndex: number, capitalized = true): string {
    const idx = ((monthIndex % 12) + 12) % 12;
    if (this.currentLanguage === 'hu') {
      return capitalized ? HU_MONTHS_CAP[idx] : HU_MONTHS_LOWER[idx];
    }
    return EN_MONTHS_CAP[idx];
  }

  public getShortMonthName(monthIndex: number): string {
    const idx = ((monthIndex % 12) + 12) % 12;
    if (this.currentLanguage === 'hu') {
      return HU_MONTHS_SHORT[idx];
    }
    return EN_MONTHS_SHORT[idx];
  }

  // Dátum fejléc formázása a köszöntéshez
  public formatGreetingDate(date: Date = new Date()): string {
    const jsDay = date.getDay();
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
    const monthIdx = date.getMonth();
    const dayNum = date.getDate();

    if (this.currentLanguage === 'hu') {
      const monthName = HU_MONTHS_CAP[monthIdx];
      const dayName = HU_DAY_FORMS[dayIdx].fullLower;
      return `${monthName} ${dayNum}., ${dayName}`;
    }

    return `${EN_DAY_FORMS[dayIdx].full}, ${EN_MONTHS_CAP[monthIdx]} ${dayNum}`;
  }

  // Heti időintervallum formázása
  public formatWeekRange(monday: Date, sunday: Date): string {
    const startMonth = monday.getMonth();
    const endMonth = sunday.getMonth();
    const startDay = monday.getDate();
    const endDay = sunday.getDate();

    if (this.currentLanguage === 'hu') {
      const sMonth = HU_MONTHS_SHORT[startMonth];
      const eMonth = HU_MONTHS_SHORT[endMonth];
      if (startMonth === endMonth) {
        return `${sMonth} ${startDay}–${endDay}.`;
      }
      return `${sMonth} ${startDay}. – ${eMonth} ${endDay}.`;
    }

    const sMonth = EN_MONTHS_SHORT[startMonth];
    const eMonth = EN_MONTHS_SHORT[endMonth];
    if (startMonth === endMonth) {
      return `${sMonth} ${startDay}–${endDay}`;
    }
    return `${sMonth} ${startDay} – ${eMonth} ${endDay}`;
  }

  // Hónap és év formázása
  public formatMonthYear(date: Date): string {
    const year = date.getFullYear();
    const monthIdx = date.getMonth();
    if (this.currentLanguage === 'hu') {
      return `${year}. ${HU_MONTHS_LOWER[monthIdx]}`;
    }
    return `${EN_MONTHS_CAP[monthIdx]} ${year}`;
  }

  // Rövid hónap és nap formázása
  public formatShortMonthDay(date: Date): string {
    const monthIdx = date.getMonth();
    const day = date.getDate();
    if (this.currentLanguage === 'hu') {
      return `${HU_MONTHS_SHORT[monthIdx]} ${day}.`;
    }
    return `${EN_MONTHS_SHORT[monthIdx]} ${day}`;
  }

  // Gyakorlatok számának formázása
  public formatExerciseCount(count: number): string {
    if (count === 0) return this.t('home.timer.zeroExercises');
    if (count === 1) return this.t('home.timer.exerciseCountOne');
    return this.t('home.timer.exerciseCountMany', { count });
  }

  // Dinamikus edzéscímek fordítása
  public translateWorkoutTitle(title?: string | null): string {
    if (!title) return this.t('plan.workoutFallback');
    const clean = title.trim();
    if (this.currentLanguage !== 'hu') {
      if (clean.toLowerCase() === 'pihenőnap') return 'Rest Day';
      return clean;
    }

    const lower = clean.toLowerCase();
    if (WORKOUT_TITLE_HU_MAP[lower]) {
      return WORKOUT_TITLE_HU_MAP[lower];
    }

    // Kétzónás megnevezések kezelése (pl. Mell és Hát)
    if (clean.includes(' & ')) {
      const parts = clean.split(' & ').map((p) => {
        const k = p.trim().toLowerCase();
        return ZONE_NAME_HU_MAP[k] || WORKOUT_TITLE_HU_MAP[k] || p.trim();
      });
      return parts.join(' és ');
    }

    return clean;
  }

  // Edzés metaadatok fordítása (pl. időtartam, gyakorlatok száma)
  public translateWorkoutMeta(meta?: string | null): string {
    if (!meta) return '';
    if (this.currentLanguage !== 'hu') return meta;

    return meta
      .split('·')
      .map((segment) => {
        const s = segment.trim();
        const lower = s.toLowerCase();
        if (ZONE_NAME_HU_MAP[lower]) {
          return ZONE_NAME_HU_MAP[lower];
        }
        // Időtartam felismerése (pl. ~45 perc)
        const minMatch = s.match(/^~?\s*(\d+)\s*min$/i);
        if (minMatch) {
          return `~${minMatch[1]} perc`;
        }
        // Gyakorlatszám felismerése (pl. 4 gyakorlat)
        const exMatch = s.match(/^(\d+)\s*exercises?$/i);
        if (exMatch) {
          return `${exMatch[1]} gyakorlat`;
        }
        return s;
      })
      .join(' · ');
  }

  // Gyakorlat címének fordítása a magyar katalógus alapján
  public translateExerciseTitle(title: string, slug?: string | null): string {
    if (!title && !slug) return '';
    if (this.currentLanguage !== 'hu') {
      return resolveEnglishExerciseTitle(title, slug);
    }
    return resolveHungarianExerciseTitle(title, slug);
  }

  // Sorozatok és pihenőidők kétnyelvű fordítása
  public translateExerciseDetails(details: string): string {
    if (!details) return '';
    if (this.currentLanguage === 'hu') {
      return details
        .replace(/(\d+)\s*s\s*rest/gi, '$1 mp pihenő')
        .replace(/(\d+)\s*sec\s*rest/gi, '$1 mp pihenő')
        .replace(/(\d+)\s*sets\b/gi, '$1 sorozat')
        .replace(/(\d+)\s*set\b/gi, '$1 sorozat')
        .replace(/(\d+)\s*reps\b/gi, '$1 ism.')
        .replace(/\brest\b/gi, 'pihenő');
    }
    return details
      .replace(/(\d+)\s*mp\s*pihenő/gi, '$1s rest')
      .replace(/(\d+)\s*mp\b/gi, '$1s rest')
      .replace(/(\d+)\s*sorozat\b/gi, '$1 sets')
      .replace(/(\d+)\s*ism\./gi, '$1 reps')
      .replace(/(\d+)\s*ism\b/gi, '$1 reps')
      .replace(/\bpihenő\b/gi, 'rest');
  }

  // Pihenőidő jelvény formázása
  public formatRestBadge(rawPart?: string): string {
    if (!rawPart) return this.currentLanguage === 'hu' ? '60 mp pihenő' : '60s rest';

    // Ha a szöveg nem időérték, az alapértelmezett értéket adjuk vissza
    if (/(kg|lb|ism|rep|sorozat|set)/i.test(rawPart) || !/(\d+)\s*(mp|s|sec|min|perc|rest|pihen)/i.test(rawPart)) {
      return this.currentLanguage === 'hu' ? '60 mp pihenő' : '60s rest';
    }

    if (this.currentLanguage === 'hu') {
      let cleaned = rawPart
        .trim()
        .replace(/(\d+)\s*s\s*rest/gi, '$1 mp pihenő')
        .replace(/(\d+)\s*s\b/gi, '$1 mp')
        .replace(/\brest\b/gi, 'pihenő');
      if (!cleaned.toLowerCase().includes('pihenő')) {
        cleaned = `${cleaned} pihenő`;
      }
      return cleaned;
    }

    let cleaned = rawPart
      .trim()
      .replace(/(\d+)\s*mp\s*pihenő/gi, '$1s rest')
      .replace(/(\d+)\s*mp\b/gi, '$1s rest')
      .replace(/mp pihenő/gi, 's rest')
      .replace(/pihenő/gi, 'rest');
    if (!cleaned.toLowerCase().includes('rest') && !cleaned.toLowerCase().includes('s')) {
      cleaned = `${cleaned} rest`;
    }
    return cleaned;
  }

  // Izomcsoport és zóna címkék fordítása
  public translateBadgeText(badge?: string | null): string {
    if (!badge) return '';
    const clean = badge.replace(/_/g, ' ').trim();
    if (this.currentLanguage !== 'hu') return clean.toUpperCase();
    const lower = clean.toLowerCase();
    if (ZONE_NAME_HU_MAP[lower]) {
      return ZONE_NAME_HU_MAP[lower].toUpperCase();
    }
    return clean.toUpperCase();
  }

  // Eszköz nevének fordítása
  public translateEquipment(name?: string | null): string {
    if (!name) return this.t('filter.equipment.bodyweight');
    const lower = name.replace(/[_-]/g, ' ').trim().toLowerCase();
    const map: Record<string, string> = {
      'none': 'filter.equipment.bodyweight',
      'bodyweight': 'filter.equipment.bodyweight',
      'body weight': 'filter.equipment.bodyweight',
      'dumbbell': 'filter.equipment.dumbbell',
      'dumbbells': 'filter.equipment.dumbbell',
      'barbell': 'filter.equipment.barbell',
      'kettlebell': 'filter.equipment.kettlebell',
      'cable': 'filter.equipment.cable',
      'ez bar': 'filter.equipment.ezBar',
      'ez curl bar': 'filter.equipment.ezBar',
      'smith machine': 'filter.equipment.smithMachine',
      'pull up bar': 'filter.equipment.pullUpBar',
      'pull-up bar': 'filter.equipment.pullUpBar',
      'band': 'filter.equipment.band',
      'resistance band': 'filter.equipment.band',
    };
    if (map[lower]) return this.t(map[lower]);
    if (this.currentLanguage === 'hu' && EQUIPMENT_HU_MAP[lower]) {
      return EQUIPMENT_HU_MAP[lower];
    }
    return name;
  }

  // Nehézségi szint fordítása
  public translateDifficulty(difficulty?: string | null): string {
    if (!difficulty) return this.t('filter.difficulty.intermediate');
    const lower = difficulty.trim().toLowerCase();
    switch (lower) {
      case 'beginner':
      case 'kezdő':
        return this.t('filter.difficulty.beginner');
      case 'intermediate':
      case 'medium':
      case 'középhaladó':
        return this.t('filter.difficulty.intermediate');
      case 'advanced':
      case 'haladó':
        return this.t('filter.difficulty.advanced');
      case 'expert':
      case 'profi':
        return this.t('filter.difficulty.expert');
      default:
        return difficulty;
    }
  }

  // Kategória fordítása
  public translateCategory(category?: string | null): string {
    if (!category) return '';
    if (this.currentLanguage !== 'hu') return category.toUpperCase();
    const lower = category.trim().toLowerCase();
    const map: Record<string, string> = {
      'strength': 'ERŐNLÉTI',
      'cardio': 'KARDIÓ',
      'stretching': 'NYÚJTÁS',
      'mobility': 'MOBILITÁS',
      'plyometrics': 'PLIOMETRIA',
      'powerlifting': 'ERŐEMELÉS',
      'strongman': 'STRONGMAN',
      'olympic': 'SÚLYEMELÉS',
      'olympic weightlifting': 'SÚLYEMELÉS',
      'calisthenics': 'SAJÁT TESTSÚLYOS',
    };
    return map[lower] ?? category.toUpperCase();
  }

  // Izomnevek fordítása
  public translateMuscleName(name: string): string {
    if (!name) return '';
    if (this.currentLanguage !== 'hu') return name;
    const lower = name.trim().toLowerCase();
    return MUSCLE_HU_MAP[lower] ?? name;
  }

  // Célkitűzés fordítása
  public translateFitnessGoal(goal?: string | null): string {
    if (!goal) return this.t('goal.muscleGain');
    const lower = goal.trim().toLowerCase();
    const map: Record<string, string> = {
      'muscle gain': 'goal.muscleGain',
      'izomépítés': 'goal.muscleGain',
      'fat loss': 'goal.fatLoss',
      'zsírégetés': 'goal.fatLoss',
      'strength': 'goal.strength',
      'erőnövelés': 'goal.strength',
      'endurance': 'goal.endurance',
      'állóképesség': 'goal.endurance',
      'general fitness': 'goal.generalFitness',
      'általános fittség': 'goal.generalFitness',
    };
    return map[lower] ? this.t(map[lower]) : goal;
  }

  // Edzettségi szint fordítása
  public translateFitnessLevel(level?: string | null): string {
    if (!level) return this.t('filter.difficulty.intermediate');
    return this.translateDifficulty(level);
  }

  // Felhasználó nemének fordítása
  public translateGender(gender?: string | null): string | null {
    if (!gender) return null;
    switch (gender.trim().toLowerCase()) {
      case 'female':
      case 'nő':
        return this.t('onboarding.genderFemale');
      case 'male':
      case 'férfi':
        return this.t('onboarding.genderMale');
      case 'other':
      case 'prefer not to say':
        return this.t('onboarding.genderOther');
      default:
        return gender;
    }
  }

  // Értesítés időbélyeg formázása
  public translateNotificationTimestamp(ts: string): string {
    if (!ts) return this.t('date.today');
    if (this.currentLanguage === 'hu') {
      if (ts.trim().toLowerCase() === 'today') return 'Ma';
      return ts.replace(/^Today,\s*/i, 'Ma, ');
    }
    if (ts.trim().toLowerCase() === 'ma') return 'Today';
    return ts.replace(/^Ma,\s*/i, 'Today, ');
  }
}

export const i18n = LocalizationService.getInstance();

