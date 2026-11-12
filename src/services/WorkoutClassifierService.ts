import type { Exercise } from './PlanService';

export type BodyZone =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'full_body'
  | 'cardio';

export interface WorkoutClassification {
  readonly title: string;
  readonly meta: string;
  readonly primaryZone: BodyZone | null;
  readonly zones: readonly BodyZone[];
}

// Az edzésnaphoz rendelt gyakorlatok elemzése és a nap nevének automatikus meghatározása
// (pl. 'Teljes test', 'Felsőtest', 'Hát és váll', 'Mell és tricepsz', 'Lábnap')
export class WorkoutClassifier {
  private static readonly UPPER_BODY_ZONES: readonly BodyZone[] = [
    'chest',
    'back',
    'shoulders',
    'arms',
  ];

  // Izomcsoport zóna (mell, hát, váll, stb.) meghatározása a gyakorlat címe vagy címkéje alapján
  public static detectZone(exercise: Exercise): BodyZone | null {
    const badge = (exercise.badgeText || '').toLowerCase().trim();
    const title = (exercise.title || '').toLowerCase().trim();

    // 1. Zóna meghatározása a címke alapján
    if (badge.includes('chest') || badge.includes('mell')) return 'chest';
    if (badge.includes('back') || badge.includes('hát') || badge.includes('lats')) return 'back';
    if (badge.includes('shoulder') || badge.includes('váll') || badge.includes('delt')) return 'shoulders';
    if (badge.includes('arm') || badge.includes('bicep') || badge.includes('tricep') || badge.includes('kar')) return 'arms';
    if (
      badge.includes('leg') ||
      badge.includes('quad') ||
      badge.includes('hamstring') ||
      badge.includes('calf') ||
      badge.includes('calve') ||
      badge.includes('glute') ||
      badge.includes('láb')
    ) {
      return 'legs';
    }
    if (badge.includes('core') || badge.includes('ab') || badge.includes('has') || badge.includes('törzs')) return 'core';
    if (badge.includes('full') || badge.includes('teljes')) return 'full_body';
    if (badge.includes('cardio') || badge.includes('futás') || badge.includes('endurance')) return 'cardio';

    // 2. Tartalék keresés a cím alapján
    if (
      title.includes('press') &&
      (title.includes('bench') || title.includes('chest') || title.includes('incline') || title.includes('push-up') || title.includes('pushup') || title.includes('dip'))
    ) {
      return 'chest';
    }
    if (
      title.includes('pull-up') ||
      title.includes('pullup') ||
      title.includes('pulldown') ||
      title.includes('row') ||
      title.includes('lat') ||
      title.includes('deadlift')
    ) {
      return 'back';
    }
    if (
      title.includes('overhead') ||
      title.includes('shoulder') ||
      title.includes('lateral raise') ||
      title.includes('military') ||
      title.includes('rear delt')
    ) {
      return 'shoulders';
    }
    if (
      title.includes('curl') ||
      title.includes('tricep') ||
      title.includes('skull crusher') ||
      title.includes('hammer')
    ) {
      return 'arms';
    }
    if (
      title.includes('squat') ||
      title.includes('lunge') ||
      title.includes('leg extension') ||
      title.includes('calf') ||
      title.includes('romanian') ||
      title.includes('step-up')
    ) {
      return 'legs';
    }
    if (
      title.includes('plank') ||
      title.includes('crunch') ||
      title.includes('russian twist') ||
      title.includes('sit-up') ||
      title.includes('hanging leg')
    ) {
      return 'core';
    }
    if (title.includes('burpee') || title.includes('high knee') || title.includes('mountain climber')) {
      return 'full_body';
    }

    return null;
  }

  // Edzésnap címének és leírásának meghatározása a gyakorlatok alapján
  public static classify(
    exercises: Exercise[] = [],
    fallbackTitle?: string
  ): WorkoutClassification {
    if (!exercises || exercises.length === 0) {
      return {
        title: fallbackTitle || 'Workout Day',
        meta: '',
        primaryZone: null,
        zones: [],
      };
    }

    // Zónák összegzése és gyakoriságuk számolása
    const zoneCounts = new Map<BodyZone, number>();
    for (const ex of exercises) {
      const zone = this.detectZone(ex);
      if (zone) {
        zoneCounts.set(zone, (zoneCounts.get(zone) || 0) + 1);
      }
    }

    const uniqueZones = Array.from(zoneCounts.keys());
    const hasLegs = zoneCounts.has('legs');
    const hasCore = zoneCounts.has('core');
    const hasFullBodyExercise = zoneCounts.has('full_body');
    const upperZones = uniqueZones.filter((z) => this.UPPER_BODY_ZONES.includes(z));

    const estimatedMinutes = Math.max(15, exercises.length * 8);

    // 1. szabály: Teljes testes edzés vagy alsó- és felsőtest vegyesen
    if (hasFullBodyExercise || (hasLegs && upperZones.length >= 1)) {
      const title = hasCore && exercises.length >= 4 ? 'Full Body & Core' : 'Full Body';
      const meta = `Compound · Full Body · ~${estimatedMinutes}min`;
      return {
        title,
        meta,
        primaryZone: 'full_body',
        zones: uniqueZones,
      };
    }

    // 2. szabály: Felsőtest (legalább 3 különböző felsőtest zóna)
    if (!hasLegs && upperZones.length >= 3) {
      const title = 'Upper Body';
      const meta = `${upperZones.map(this.formatZoneName).join(' · ')} · ~${estimatedMinutes}min`;
      return {
        title,
        meta,
        primaryZone: 'chest',
        zones: uniqueZones,
      };
    }

    // 3. szabály: Két zóna kombinációja (pl. hát és váll, mell és tricepsz)
    if (uniqueZones.length === 2) {
      const [z1, z2] = uniqueZones;
      const title = this.formatTwoZoneTitle(z1, z2, exercises);
      const meta = `${this.formatZoneName(z1)} · ${this.formatZoneName(z2)} · ~${estimatedMinutes}min`;
      return {
        title,
        meta,
        primaryZone: z1,
        zones: uniqueZones,
      };
    }

    // 4. szabály: Egyetlen domináns zóna
    if (uniqueZones.length === 1) {
      const [singleZone] = uniqueZones;
      const title = this.formatSingleZoneTitle(singleZone, exercises);
      const meta = `${this.formatZoneName(singleZone)} · ~${estimatedMinutes}min`;
      return {
        title,
        meta,
        primaryZone: singleZone,
        zones: uniqueZones,
      };
    }

    // 5. szabály: A két leggyakoribb zóna kiválasztása
    const sortedZones = Array.from(zoneCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([z]) => z);

    if (sortedZones.length >= 2) {
      const [top1, top2] = sortedZones;
      const title = this.formatTwoZoneTitle(top1, top2, exercises);
      const meta = `${sortedZones.slice(0, 3).map(this.formatZoneName).join(' · ')} · ~${estimatedMinutes}min`;
      return {
        title,
        meta,
        primaryZone: top1,
        zones: sortedZones,
      };
    }

    // Alapértelmezett edzéstípus, ha nem határozható meg domináns zóna
    return {
      title: fallbackTitle || 'Workout',
      meta: `${exercises.length} exercises · ~${estimatedMinutes}min`,
      primaryZone: null,
      zones: uniqueZones,
    };
  }

  // Két testzónás edzés címének formázása
  private static formatTwoZoneTitle(
    z1: BodyZone,
    z2: BodyZone,
    exercises: Exercise[]
  ): string {
    const pair = new Set([z1, z2]);

    if (pair.has('back') && pair.has('shoulders')) {
      return 'Back & Shoulders';
    }
    if (pair.has('chest') && pair.has('arms')) {
      // Tricepsz vagy kar specifikus megnevezés ellenőrzése
      const hasTriceps = exercises.some(
        (e) => (e.badgeText + e.title).toLowerCase().includes('tricep')
      );
      return hasTriceps ? 'Chest & Triceps' : 'Chest & Arms';
    }
    if (pair.has('back') && pair.has('arms')) {
      const hasBiceps = exercises.some(
        (e) => (e.badgeText + e.title).toLowerCase().includes('bicep')
      );
      return hasBiceps ? 'Back & Biceps' : 'Back & Arms';
    }
    if (pair.has('chest') && pair.has('shoulders')) {
      return 'Chest & Shoulders';
    }
    if (pair.has('chest') && pair.has('back')) {
      return 'Chest & Back';
    }
    if (pair.has('shoulders') && pair.has('arms')) {
      return 'Shoulders & Arms';
    }
    if (pair.has('legs') && pair.has('core')) {
      return 'Legs & Core';
    }
    if (pair.has('arms') && pair.has('core')) {
      return 'Arms & Core';
    }

    return `${this.formatZoneName(z1)} & ${this.formatZoneName(z2)}`;
  }

  // Egy testzónás edzés címének formázása
  private static formatSingleZoneTitle(zone: BodyZone, exercises: Exercise[]): string {
    switch (zone) {
      case 'chest':
        return 'Chest';
      case 'back':
        return 'Back';
      case 'shoulders':
        return 'Shoulders';
      case 'legs':
        return 'Leg Day';
      case 'arms': {
        const hasBiceps = exercises.some(
          (e) => (e.badgeText + e.title).toLowerCase().includes('bicep')
        );
        const hasTriceps = exercises.some(
          (e) => (e.badgeText + e.title).toLowerCase().includes('tricep')
        );
        if (hasBiceps && !hasTriceps) return 'Biceps';
        if (hasTriceps && !hasBiceps) return 'Triceps';
        return 'Arm Day';
      }
      case 'core':
        return 'Core & Abs';
      case 'cardio':
        return 'Cardio & Conditioning';
      case 'full_body':
        return 'Full Body';
      default:
        return 'Workout';
    }
  }

  // Testzóna megnevezése
  private static formatZoneName(zone: BodyZone): string {
    switch (zone) {
      case 'chest':
        return 'Chest';
      case 'back':
        return 'Back';
      case 'shoulders':
        return 'Shoulders';
      case 'arms':
        return 'Arms';
      case 'legs':
        return 'Legs';
      case 'core':
        return 'Core';
      case 'full_body':
        return 'Full Body';
      case 'cardio':
        return 'Cardio';
      default:
        return zone;
    }
  }
}
