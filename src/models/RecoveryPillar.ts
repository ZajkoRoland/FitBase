import { i18n } from '@/services/LocalizationService';

export type RecoveryCategory = 'hydration' | 'sleep' | 'nutrition' | 'mobility';

export interface IRecoveryPillarData {
  id: string;
  category: RecoveryCategory;
  title: string;
  target: string;
  description: string;
  accentColor: string;
  iconName: string;
  isCompleted?: boolean;
}

// Pihenőnapi regenerációs szokások modellje
export class RecoveryPillar {
  public readonly id: string;
  public readonly category: RecoveryCategory;
  private readonly rawTitle: string;
  private readonly rawTarget: string;
  private readonly rawDescription: string;
  public readonly accentColor: string;
  public readonly iconName: string;
  public readonly isCompleted: boolean;

  constructor(data: IRecoveryPillarData) {
    this.id = data.id;
    this.category = data.category;
    this.rawTitle = data.title;
    this.rawTarget = data.target;
    this.rawDescription = data.description;
    this.accentColor = data.accentColor;
    this.iconName = data.iconName;
    this.isCompleted = Boolean(data.isCompleted);
  }

  public get title(): string {
    switch (this.id) {
      case 'pillar-hydration':
        return i18n.t('plan.recovery.hydrationTitle');
      case 'pillar-sleep':
        return i18n.t('plan.recovery.sleepTitle');
      case 'pillar-nutrition':
        return i18n.t('plan.recovery.nutritionTitle');
      default:
        return this.rawTitle;
    }
  }

  public get target(): string {
    switch (this.id) {
      case 'pillar-hydration':
        return i18n.t('plan.recovery.hydrationTarget');
      case 'pillar-sleep':
        return i18n.t('plan.recovery.sleepTarget');
      case 'pillar-nutrition':
        return i18n.t('plan.recovery.nutritionTarget');
      default:
        return this.rawTarget;
    }
  }

  public get description(): string {
    switch (this.id) {
      case 'pillar-hydration':
        return i18n.t('plan.recovery.hydrationDesc');
      case 'pillar-sleep':
        return i18n.t('plan.recovery.sleepDesc');
      case 'pillar-nutrition':
        return i18n.t('plan.recovery.nutritionDesc');
      default:
        return this.rawDescription;
    }
  }

  // Befejezett állapot váltása
  public toggle(): RecoveryPillar {
    return new RecoveryPillar({
      id: this.id,
      category: this.category,
      title: this.rawTitle,
      target: this.rawTarget,
      description: this.rawDescription,
      accentColor: this.accentColor,
      iconName: this.iconName,
      isCompleted: !this.isCompleted,
    });
  }

  // Alapértelmezett regenerációs szokások listája
  public static createDefaultPillars(): RecoveryPillar[] {
    return [
      new RecoveryPillar({
        id: 'pillar-hydration',
        category: 'hydration',
        title: i18n.t('plan.recovery.hydrationTitle'),
        target: i18n.t('plan.recovery.hydrationTarget'),
        description: i18n.t('plan.recovery.hydrationDesc'),
        accentColor: '#4AB8F8',
        iconName: 'water-outline',
        isCompleted: false,
      }),
      new RecoveryPillar({
        id: 'pillar-sleep',
        category: 'sleep',
        title: i18n.t('plan.recovery.sleepTitle'),
        target: i18n.t('plan.recovery.sleepTarget'),
        description: i18n.t('plan.recovery.sleepDesc'),
        accentColor: '#A78BFA',
        iconName: 'moon-outline',
        isCompleted: false,
      }),
      new RecoveryPillar({
        id: 'pillar-nutrition',
        category: 'nutrition',
        title: i18n.t('plan.recovery.nutritionTitle'),
        target: i18n.t('plan.recovery.nutritionTarget'),
        description: i18n.t('plan.recovery.nutritionDesc'),
        accentColor: '#FFB300',
        iconName: 'restaurant-outline',
        isCompleted: false,
      }),
    ];
  }
}
