import { i18n } from '@/services/LocalizationService';

// Edzéstervek időtartamának típusai (1, 2 vagy 4 hetes ciklus)
export type PlanDurationType = '1_week' | '2_week' | '4_week';

export interface PlanStructureCategory {
  readonly id: PlanDurationType;
  readonly title: string;
  readonly subtitle: string;
  readonly badge: string;
  readonly description: string;
  readonly weeksCount: number;
  readonly iconName: 'calendar-outline' | 'repeat-outline' | 'trending-up-outline';
}

export class WorkoutPlanStructure {
  public static get CATEGORIES(): PlanStructureCategory[] {
    return [
      {
        id: '1_week',
        title: i18n.t('plan.structure.1w.title'),
        subtitle: i18n.t('plan.structure.1w.subtitle'),
        badge: i18n.t('plan.structure.1w.badge'),
        description: i18n.t('plan.structure.1w.desc'),
        weeksCount: 1,
        iconName: 'calendar-outline',
      },
      {
        id: '2_week',
        title: i18n.t('plan.structure.2w.title'),
        subtitle: i18n.t('plan.structure.2w.subtitle'),
        badge: i18n.t('plan.structure.2w.badge'),
        description: i18n.t('plan.structure.2w.desc'),
        weeksCount: 2,
        iconName: 'repeat-outline',
      },
      {
        id: '4_week',
        title: i18n.t('plan.structure.4w.title'),
        subtitle: i18n.t('plan.structure.4w.subtitle'),
        badge: i18n.t('plan.structure.4w.badge'),
        description: i18n.t('plan.structure.4w.desc'),
        weeksCount: 4,
        iconName: 'trending-up-outline',
      },
    ];
  }

  public static getCategory(id: PlanDurationType): PlanStructureCategory {
    const categories = this.CATEGORIES;
    const found = categories.find((cat) => cat.id === id);
    return found || categories[0];
  }
}
