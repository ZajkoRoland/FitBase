import { ExerciseRepository, exerciseRepository } from '@/repositories/ExerciseRepository';
import { normalizeForExerciseSearch } from '@/services/ExerciseHuCatalog';
import { i18n } from '@/services/LocalizationService';
import type {
  BodyPart,
  ExerciseDetail,
  ExerciseFilterOptions,
  ExercisePage,
  ExerciseQueryParams,
  ExerciseSummary,
} from '@/types/exercise';

export const CATEGORIES = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Legs',
  'Arms',
  'Core',
  'Full Body',
] as const;

export type CategoryName = typeof CATEGORIES[number];

export type FilterDimension = 'body_part' | 'equipment' | 'difficulty';

export interface FilterOptionItem {
  readonly label: string;
  readonly value: string;
}

export interface MultiFilterState {
  bodyParts: readonly string[];
  equipment: readonly string[];
  difficulties: readonly string[];
}

export const INITIAL_MULTI_FILTER_STATE: MultiFilterState = {
  bodyParts: [],
  equipment: [],
  difficulties: [],
};

export type ActiveFilterState = MultiFilterState;
export const INITIAL_FILTER_STATE = INITIAL_MULTI_FILTER_STATE;

export const FILTER_DIMENSIONS: readonly { readonly key: FilterDimension; readonly label: string }[] = [
  { key: 'body_part', label: 'Body Part' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'difficulty', label: 'Difficulty' },
];

export const BODY_PART_OPTIONS: readonly FilterOptionItem[] = [
  { label: 'All', value: 'all' },
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Legs', value: 'upper_legs' },
  { label: 'Arms', value: 'upper_arms' },
  { label: 'Core', value: 'core' },
  { label: 'Full Body', value: 'full_body' },
];

export const EQUIPMENT_OPTIONS: readonly FilterOptionItem[] = [
  { label: 'All', value: 'all' },
  { label: 'Bodyweight', value: 'none' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Barbell', value: 'barbell' },
  { label: 'Kettlebell', value: 'kettlebell' },
  { label: 'Cable', value: 'cable' },
  { label: 'EZ Bar', value: 'ez_bar' },
  { label: 'Smith Machine', value: 'smith_machine' },
  { label: 'Pull Up Bar', value: 'pull_up_bar' },
  { label: 'Band', value: 'resistance_band' },
];

export const DIFFICULTY_OPTIONS: readonly FilterOptionItem[] = [
  { label: 'All', value: 'all' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const BODY_PART_LABEL_KEYS: Record<string, string> = {
  all: 'filter.all',
  chest: 'filter.bodyPart.chest',
  back: 'filter.bodyPart.back',
  shoulders: 'filter.bodyPart.shoulders',
  upper_legs: 'filter.bodyPart.legs',
  upper_arms: 'filter.bodyPart.arms',
  core: 'filter.bodyPart.core',
  full_body: 'filter.bodyPart.fullBody',
};

const EQUIPMENT_LABEL_KEYS: Record<string, string> = {
  all: 'filter.all',
  none: 'filter.equipment.bodyweight',
  dumbbell: 'filter.equipment.dumbbell',
  barbell: 'filter.equipment.barbell',
  kettlebell: 'filter.equipment.kettlebell',
  cable: 'filter.equipment.cable',
  ez_bar: 'filter.equipment.ezBar',
  smith_machine: 'filter.equipment.smithMachine',
  pull_up_bar: 'filter.equipment.pullUpBar',
  resistance_band: 'filter.equipment.band',
};

const DIFFICULTY_LABEL_KEYS: Record<string, string> = {
  all: 'filter.all',
  beginner: 'filter.difficulty.beginner',
  intermediate: 'filter.difficulty.intermediate',
  advanced: 'filter.difficulty.advanced',
};

/**
 * LibraryService
 *
 * Encapsulates the domain operations, categorizations, and multi-dimensional
 * filtering logic on top of ExerciseRepository.
 */
export class LibraryService {
  private static instance: LibraryService;
  private cachedCatalog: ExerciseSummary[] | null = null;
  private catalogPromise: Promise<ExerciseSummary[]> | null = null;

  private constructor(
    private readonly repo: ExerciseRepository = exerciseRepository
  ) { }

  public static getInstance(): LibraryService {
    if (!LibraryService.instance) {
      LibraryService.instance = new LibraryService();
    }
    return LibraryService.instance;
  }

  public getCategories(): readonly string[] {
    return CATEGORIES;
  }

  public getFilterDimensions(): readonly { readonly key: FilterDimension; readonly label: string }[] {
    return FILTER_DIMENSIONS;
  }

  public getLocalizedBodyPartOptions(): readonly FilterOptionItem[] {
    return BODY_PART_OPTIONS.map((opt) => ({
      value: opt.value,
      label: BODY_PART_LABEL_KEYS[opt.value] ? i18n.t(BODY_PART_LABEL_KEYS[opt.value]) : opt.label,
    }));
  }

  public getLocalizedEquipmentOptions(): readonly FilterOptionItem[] {
    return EQUIPMENT_OPTIONS.map((opt) => ({
      value: opt.value,
      label: EQUIPMENT_LABEL_KEYS[opt.value] ? i18n.t(EQUIPMENT_LABEL_KEYS[opt.value]) : opt.label,
    }));
  }

  public getLocalizedDifficultyOptions(): readonly FilterOptionItem[] {
    return DIFFICULTY_OPTIONS.map((opt) => ({
      value: opt.value,
      label: DIFFICULTY_LABEL_KEYS[opt.value] ? i18n.t(DIFFICULTY_LABEL_KEYS[opt.value]) : opt.label,
    }));
  }

  public getOptionsForDimension(dimension: FilterDimension): readonly FilterOptionItem[] {
    switch (dimension) {
      case 'body_part':
        return this.getLocalizedBodyPartOptions();
      case 'equipment':
        return this.getLocalizedEquipmentOptions();
      case 'difficulty':
        return this.getLocalizedDifficultyOptions();
      default:
        return [];
    }
  }

  public isDimensionActive(dimension: FilterDimension, state: MultiFilterState): boolean {
    switch (dimension) {
      case 'body_part':
        return state.bodyParts.length > 0;
      case 'equipment':
        return state.equipment.length > 0;
      case 'difficulty':
        return state.difficulties.length > 0;
      default:
        return false;
    }
  }

  public hasAnyFilterActive(state: MultiFilterState, searchQuery: string): boolean {
    return (
      state.bodyParts.length > 0 ||
      state.equipment.length > 0 ||
      state.difficulties.length > 0 ||
      searchQuery.trim().length > 0
    );
  }

  public toggleFilterItem(list: readonly string[], item: string): readonly string[] {
    if (item === 'all') {
      return [];
    }
    if (list.includes(item)) {
      return list.filter((x) => x !== item);
    }
    return [...list, item];
  }

  /**
   * Maps high-level UI category tabs to the underlying backend anatomical body_part filter.
   */
  public mapCategoryToBodyPart(category: string): BodyPart | undefined {
    switch (category.trim().toLowerCase()) {
      case 'chest':
        return 'chest';
      case 'back':
        return 'back';
      case 'shoulders':
        return 'shoulders';
      case 'legs':
        return 'upper_legs';
      case 'arms':
        return 'upper_arms';
      case 'core':
        return 'core';
      case 'full body':
        return 'full_body';
      default:
        return undefined;
    }
  }

  private async loadFullCatalog(): Promise<ExerciseSummary[]> {
    if (this.cachedCatalog) {
      return this.cachedCatalog;
    }
    if (this.catalogPromise) {
      return this.catalogPromise;
    }

    this.catalogPromise = (async () => {
      try {
        const batchSize = 100;
        const firstPage = await this.repo.list({ limit: batchSize, offset: 0 });
        const allItems: ExerciseSummary[] = [...firstPage.items];
        const total = firstPage.total;

        if (total > allItems.length) {
          const offsets: number[] = [];
          for (let off = batchSize; off < total; off += batchSize) {
            offsets.push(off);
          }
          const pages = await Promise.all(
            offsets.map((off) => this.repo.list({ limit: batchSize, offset: off }))
          );
          for (const page of pages) {
            allItems.push(...page.items);
          }
        }

        this.cachedCatalog = allItems;
        return allItems;
      } finally {
        this.catalogPromise = null;
      }
    })();

    return this.catalogPromise;
  }

  private matchesFilters(item: ExerciseSummary, params: ExerciseQueryParams): boolean {
    if (params.body_part) {
      const parts = params.body_part.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0 && !parts.includes(item.body_part)) {
        return false;
      }
    }

    if (params.difficulty) {
      const diffs = params.difficulty.split(',').map((s) => s.trim()).filter(Boolean);
      if (diffs.length > 0 && !diffs.includes(item.difficulty)) {
        return false;
      }
    }

    if (params.category && item.category !== params.category) {
      return false;
    }

    if (params.equipment) {
      const eqSlugs = params.equipment.split(',').map((s) => s.trim()).filter(Boolean);
      if (eqSlugs.length > 0) {
        const hasNone = eqSlugs.includes('none');
        const namedSlugs = eqSlugs.filter((s) => s !== 'none');
        const isBodyweight = item.equipment === null;
        const eqSlug = item.equipment?.slug ?? '';
        const matchesNone = hasNone && isBodyweight;
        const matchesNamed = namedSlugs.length > 0 && namedSlugs.includes(eqSlug);
        if (!matchesNone && !matchesNamed) {
          return false;
        }
      }
    }

    if (params.muscle) {
      const hasPrimary = item.primary_muscles.some((m) => m.slug === params.muscle);
      if (!hasPrimary) {
        return false;
      }
    }

    return true;
  }

  public async getExercises(params: ExerciseQueryParams = {}): Promise<ExercisePage> {
    const rawQuery = params.q?.trim() ?? '';
    if (!rawQuery || !i18n.isHungarian()) {
      return this.repo.list(params);
    }

    const queryNorm = normalizeForExerciseSearch(rawQuery);
    const queryTokens = queryNorm.split(' ').filter(Boolean);
    if (queryTokens.length === 0) {
      return this.repo.list({ ...params, q: undefined });
    }

    const catalog = await this.loadFullCatalog();
    const scored: { item: ExerciseSummary; rank: number; index: number }[] = [];

    for (let idx = 0; idx < catalog.length; idx++) {
      const item = catalog[idx];
      if (!this.matchesFilters(item, params)) {
        continue;
      }

      const huTitle = i18n.translateExerciseTitle(item.name, item.slug);
      const huNorm = normalizeForExerciseSearch(huTitle);
      const enNorm = normalizeForExerciseSearch(item.name);
      const slugNorm = normalizeForExerciseSearch(item.slug);
      const titlePool = `${huNorm} ${enNorm} ${slugNorm}`;

      const musclesNorm = item.primary_muscles
        .map((m) => normalizeForExerciseSearch(i18n.translateMuscleName(m.name)))
        .join(' ');
      const equipNorm = normalizeForExerciseSearch(
        i18n.translateEquipment(item.equipment?.name ?? 'none')
      );
      const fullPool = `${titlePool} ${musclesNorm} ${equipNorm}`;

      const matchesAll = queryTokens.every((tok) => fullPool.includes(tok));
      if (!matchesAll) {
        continue;
      }

      let rank = 2;
      if (huNorm.startsWith(queryNorm) || enNorm.startsWith(queryNorm)) {
        rank = 0;
      } else if (queryTokens.every((tok) => titlePool.includes(tok))) {
        rank = 1;
      }

      scored.push({ item, rank, index: idx });
    }

    scored.sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.index - b.index));

    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    const sliced = scored.slice(offset, offset + limit).map((entry) => entry.item);

    return {
      items: sliced,
      total: scored.length,
      limit,
      offset,
    };
  }

  public async getExerciseDetail(slug: string, lang = 'en'): Promise<ExerciseDetail> {
    return this.repo.getBySlug(slug, lang);
  }

  public async getFilterOptions(): Promise<ExerciseFilterOptions> {
    return this.repo.getFilters();
  }
}

export const libraryService = LibraryService.getInstance();
