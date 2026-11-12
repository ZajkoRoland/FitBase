// Gyakorlatok magyar keresőindexe és megnevezései

import {
  EXERCISE_SLUG_HU_MAP,
  EXERCISE_ALIAS_HU_MAP,
  EQUIPMENT_HU_MAP,
} from '@/data/exerciseCatalogData';

export {
  EXERCISE_SLUG_HU_MAP,
  EXERCISE_ALIAS_HU_MAP,
  EQUIPMENT_HU_MAP,
};


// Magyar kisbetűs név -> slug gyorsítótár
let huLowerToSlugCache: Map<string, string> | null = null;

function getHuLowerToSlugMap(): Map<string, string> {
  if (huLowerToSlugCache) return huLowerToSlugCache;
  const map = new Map<string, string>();
  for (const [slug, huName] of Object.entries(EXERCISE_SLUG_HU_MAP)) {
    map.set(huName.toLowerCase(), slug);
  }
  huLowerToSlugCache = map;
  return map;
}

// Ékezetmentesítés a gyakorlatok kereséséhez
export function normalizeForExerciseSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function humanizeSlugEn(slug: string): string {
  const special: Record<string, string> = {
    'bench-press': 'Barbell Bench Press',
    'squat': 'Barbell Back Squat',
    'deadlift': 'Barbell Deadlift',
    'ohp': 'Overhead Press',
    'l-sit': 'L-Sit',
    'v-sit': 'V-Sit',
    'v-ups': 'V-Ups',
  };
  if (special[slug]) return special[slug];
  return slug
    .split('-')
    .map((word) => {
      if (word === 'db') return 'Dumbbell';
      if (word === 'ez') return 'EZ';
      if (word === 'trx') return 'TRX';
      if (word === 'rdl') return 'RDL';
      if (word === 'it') return 'IT';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Magyar gyakorlatnév feloldása slug vagy angol cím alapján
export function resolveHungarianExerciseTitle(title: string, slug?: string | null): string {
  const cleanSlug = slug?.trim().toLowerCase();
  if (cleanSlug && EXERCISE_SLUG_HU_MAP[cleanSlug]) {
    return EXERCISE_SLUG_HU_MAP[cleanSlug];
  }

  const cleanTitle = title.trim();
  if (!cleanTitle) return '';

  const lowerTitle = cleanTitle.toLowerCase();
  if (EXERCISE_ALIAS_HU_MAP[lowerTitle]) {
    return EXERCISE_ALIAS_HU_MAP[lowerTitle];
  }
  if (EXERCISE_SLUG_HU_MAP[lowerTitle]) {
    return EXERCISE_SLUG_HU_MAP[lowerTitle];
  }

  const derivedSlug = slugifyTitle(cleanTitle);
  if (EXERCISE_SLUG_HU_MAP[derivedSlug]) {
    return EXERCISE_SLUG_HU_MAP[derivedSlug];
  }
  if (derivedSlug.endsWith('s') && EXERCISE_SLUG_HU_MAP[derivedSlug.slice(0, -1)]) {
    return EXERCISE_SLUG_HU_MAP[derivedSlug.slice(0, -1)];
  }
  if (EXERCISE_SLUG_HU_MAP[`${derivedSlug}s`]) {
    return EXERCISE_SLUG_HU_MAP[`${derivedSlug}s`];
  }

  // Strip redundant leading "barbell " / "dumbbell " when RepDB name includes equipment prefix
  for (const prefix of ['barbell-', 'dumbbell-', 'bodyweight-']) {
    if (derivedSlug.startsWith(prefix)) {
      const stripped = derivedSlug.slice(prefix.length);
      if (EXERCISE_SLUG_HU_MAP[stripped]) {
        return EXERCISE_SLUG_HU_MAP[stripped];
      }
    }
  }

  return cleanTitle;
}

// Angol gyakorlatnév visszaadása, ha angol nyelv van kiválasztva
export function resolveEnglishExerciseTitle(title: string, slug?: string | null): string {
  const cleanTitle = title.trim();
  if (!cleanTitle) return '';

  const huToSlug = getHuLowerToSlugMap();
  const matchedSlug = huToSlug.get(cleanTitle.toLowerCase());
  if (matchedSlug) {
    return humanizeSlugEn(matchedSlug);
  }

  const cleanSlug = slug?.trim().toLowerCase();
  // Ha a cím ékezetes karaktereket tartalmaz és van slug, a slugból képezzük vissza az angol nevet
  if (cleanSlug && /[áéíóöőúüű]/i.test(cleanTitle)) {
    return humanizeSlugEn(cleanSlug);
  }

  return cleanTitle;
}

// Gyakorlat slug meghatározása a cím alapján
export function resolveCatalogSlugFromTitle(title: string): string | null {
  const cleanTitle = title.trim();
  if (!cleanTitle) return null;

  const huSlug = getHuLowerToSlugMap().get(cleanTitle.toLowerCase());
  if (huSlug) return huSlug;

  const derived = slugifyTitle(cleanTitle);
  if (EXERCISE_SLUG_HU_MAP[derived]) return derived;
  if (derived.endsWith('s') && EXERCISE_SLUG_HU_MAP[derived.slice(0, -1)]) {
    return derived.slice(0, -1);
  }
  if (EXERCISE_SLUG_HU_MAP[`${derived}s`]) {
    return `${derived}s`;
  }

  const aliasHu = EXERCISE_ALIAS_HU_MAP[cleanTitle.toLowerCase()];
  if (aliasHu) {
    const mapped = getHuLowerToSlugMap().get(aliasHu.toLowerCase());
    if (mapped) return mapped;
  }

  return null;
}
