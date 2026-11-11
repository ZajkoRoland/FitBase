import { exerciseRepository } from '@/repositories/ExerciseRepository';
import { resolveCatalogSlugFromTitle } from '@/services/ExerciseHuCatalog';
import { i18n } from '@/services/LocalizationService';
import { ExerciseDetail } from '@/types/exercise';
import { Exercise } from './PlanService';

function formatExerciseSubjectHu(localizedName: string): string {
  const trimmed = localizedName.trim();
  if (!trimmed) return 'A gyakorlat';

  // Preserve capitalized proper nouns / acronyms at start of phrase
  const keepUpperPattern = /^(TRX|EZ|IT|L-|V-|T-|Arnold|Zercher|Zottman|Pendlay|Spoto|Nordic|Pilates|Superman|Svend|Pallof|Jefferson|Hack|Dead Bug|Muscle-Up|Battle)/;
  const displayName = keepUpperPattern.test(trimmed)
    ? trimmed
    : trimmed.charAt(0).toLowerCase() + trimmed.slice(1);

  const firstChar = trimmed.charAt(0).toLowerCase();
  const useAz =
    /^[aáeéiíoóöőuúüű]/.test(firstChar) || firstChar === '1' || firstChar === '5';

  return `${useAz ? 'Az' : 'A'} ${displayName}`;
}

/**
 * ExerciseLookupService
 *
 * Domain service implementing in-memory caching for resolving
 * exercise details, descriptions, execution instructions, and motion pose images
 * directly from the catalog database and RepDB REST API.
 */
export class ExerciseLookupService {
  private static instance: ExerciseLookupService;
  private readonly cache: Map<string, ExerciseDetail> = new Map();

  private constructor() { }

  public static getInstance(): ExerciseLookupService {
    if (!ExerciseLookupService.instance) {
      ExerciseLookupService.instance = new ExerciseLookupService();
    }
    return ExerciseLookupService.instance;
  }

  /**
   * Localizes any ExerciseDetail object into Hungarian when Hungarian is active,
   * ensuring no English descriptions or step instructions appear on the UI.
   */
  public localizeDetail(detail: ExerciseDetail): ExerciseDetail {
    if (!i18n.isHungarian()) {
      return detail;
    }

    const localizedName = i18n.translateExerciseTitle(detail.name, detail.slug);
    const primaryMusclesHu =
      detail.primary_muscles?.map((m) => i18n.translateMuscleName(m.name)).join(', ') ||
      i18n.t('library.detail.fullBody');
    const equipHu = i18n.translateEquipment(detail.equipment?.name ?? 'Bodyweight');
    const diffHu = i18n.translateDifficulty(detail.difficulty);
    const subjectHu = formatExerciseSubjectHu(localizedName);

    let generatedDescription: string;
    let generatedInstructions: string[];

    if (detail.category === 'stretching') {
      generatedDescription = `${subjectHu} egy mobilitást és hajlékonyságot fejlesztő nyújtó gyakorlat, amely célzottan a következő területet lazítja: ${primaryMusclesHu.toLowerCase()}.`;
      generatedInstructions = [
        'Helyezkedj el stabilan a kiinduló pozícióban, és lazítsd el a vállövedet.',
        `Lassan, rángatás nélkül vedd fel a nyújtó helyzetet, amíg kellemes feszülést nem érzel a célzott izmokban (${primaryMusclesHu.toLowerCase()}).`,
        'Tartsd meg a pozíciót egyenletes, mély légzés mellett, majd óvatosan térj vissza a kiinduló helyzetbe.',
      ];
    } else if (detail.category === 'cardio' || detail.category === 'plyometrics') {
      generatedDescription = `${subjectHu} egy dinamikus állóképességi és kalóriaégető gyakorlat, amely intenzíven megdolgoztatja a következő izmokat: ${primaryMusclesHu.toLowerCase()}.`;
      generatedInstructions = [
        'Vedd fel a stabil, vállszéles alapállást enyhén behajlított térdekkel és feszes törzzsel.',
        'Hajtsd végre a dinamikus mozdulatsort folyamatos, egyenletes ritmusban, ügyelve az ízületkímélő kivitelezésre.',
        'Tartsd fenn az egyenletes légzést és a helyes testtartást a teljes sorozat alatt.',
      ];
    } else {
      generatedDescription = `${subjectHu} egy ${diffHu.toLowerCase()} szintű erősítő gyakorlat (${equipHu.toLowerCase()}), amely célzottan a következő izomcsoportokat fejleszti: ${primaryMusclesHu.toLowerCase()}.`;
      generatedInstructions = [
        `Vedd fel a stabil kiinduló testhelyzetet (${equipHu.toLowerCase()} használatával), feszítsd meg a törzsizmokat, és tartsd egyenesen a gerincedet.`,
        `Végezd el a munkafázist kontrollált tempóban, a célzott izomcsoport (${primaryMusclesHu.toLowerCase()}) tudatos megfeszítésével, miközben kifújod a levegőt.`,
        'Engedd vissza a terhelést lassan és kontrolláltan a kiinduló helyzetbe belégzés közben, majd ismételd meg az előírt ismétlésszámban.',
      ];
    }

    return {
      ...detail,
      name: localizedName,
      description: generatedDescription,
      instructions: generatedInstructions,
      tips: ['Figyelj a szabályos kivitelezésre és az egyenletes légzésre a teljes gyakorlat során.'],
    };
  }

  /**
   * Resolves the catalog slug from either the exercise's explicit slug or its title.
   * Matches against the entire 650-exercise RepDB catalog via ExerciseHuCatalog.
   */
  public getSlug(exercise: Exercise): string {
    if (exercise.slug) return exercise.slug;

    const catalogSlug = resolveCatalogSlugFromTitle(exercise.title);
    if (catalogSlug) {
      return catalogSlug;
    }

    const normalizedTitle = exercise.title.toLowerCase().trim();
    return normalizedTitle.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Fetches or resolves full details for an exercise with multi-tier caching.
   */
  public async resolveExerciseDetails(exercise: Exercise): Promise<ExerciseDetail | null> {
    const slug = this.getSlug(exercise);
    const isHu = i18n.isHungarian();
    const cacheKey = `${slug}_${isHu ? 'hu' : 'en'}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const remoteDetail = await exerciseRepository.getBySlug(slug);
      if (remoteDetail) {
        const localized = this.localizeDetail(remoteDetail);
        this.cache.set(cacheKey, localized);
        return localized;
      }
    } catch {
      try {
        const searchResult = await exerciseRepository.list({ q: exercise.title, limit: 1 });
        if (searchResult.items.length > 0) {
          const matchedSlug = searchResult.items[0].slug;
          const matchedDetail = await exerciseRepository.getBySlug(matchedSlug);
          const localized = this.localizeDetail(matchedDetail);
          this.cache.set(cacheKey, localized);
          return localized;
        }
      } catch {
        // Fallback below
      }
    }

    // If offline or remote fetch failed, but exercise has startImageUrl / peakImageUrl stored in plan,
    // construct a minimal detail using the real exercise image URLs so the motion animation works!
    if (exercise.startImageUrl || exercise.peakImageUrl || exercise.description) {
      const localizedName = i18n.translateExerciseTitle(exercise.title, slug);
      const syntheticDetail: ExerciseDetail = {
        slug,
        name: localizedName,
        category: 'strength',
        difficulty: 'intermediate',
        body_part: 'full_body',
        equipment: null,
        met: exercise.met || 4.5,
        primary_muscles: [],
        secondary_muscles: [],
        image_url: exercise.startImageUrl || exercise.peakImageUrl || null,
        language: isHu ? 'hu' : 'en',
        description:
          exercise.description ||
          (isHu
            ? `${localizedName} célzott erősítő gyakorlat.`
            : `${exercise.title} strength training exercise.`),
        instructions: exercise.instructions || [
          isHu ? 'Vedd fel a stabil kiinduló testhelyzetet.' : 'Assume the stable starting position.',
          isHu ? 'Hajtsd végre a mozdulatot egyenletes, kontrollált tempóban.' : 'Perform the movement in a steady tempo.',
          isHu ? 'Térj vissza a kiinduló helyzetbe, és ismételd meg az előírt ismétlésszámban.' : 'Return to starting position and repeat.',
        ],
        tips: [
          isHu
            ? 'Figyelj a szabályos kivitelezésre és az egyenletes légzésre.'
            : 'Focus on proper form and steady breathing.',
        ],
        images: {
          start: exercise.startImageUrl || '',
          peak: exercise.peakImageUrl || '',
          main: exercise.startImageUrl || '',
        },
        goals: ['strength'],
        tags: [],
        is_unilateral: false,
        is_bodyweight: true,
        variation_group: null,
      };
      this.cache.set(cacheKey, syntheticDetail);
      return syntheticDetail;
    }

    return null;
  }
}

export const exerciseLookupService = ExerciseLookupService.getInstance();
