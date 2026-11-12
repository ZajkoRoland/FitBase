import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { i18n } from '@/services/LocalizationService';

export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

export interface BmiResult {
  readonly bmi: number;
  readonly category: BmiCategory;
  readonly localizedCategory: string;
  readonly color: string;
  readonly label: string;
}

export interface WeightProgress {
  readonly targetWeight: number;
  readonly diffKg: number;
  readonly label: string;
  readonly isLoss: boolean;
  readonly isReached: boolean;
}

const STORAGE_TARGET_WEIGHT_PREFIX = '@fitbase_target_weight';
const STORAGE_DEMOGRAPHICS_PREFIX = '@fitbase_demographics';

export interface DemographicMetrics {
  readonly gender?: string | null;
  readonly age?: number | null;
}

// Testtömeg-index (BMI) és célsúly előrehaladás kiszámítása a testsúly és magasság alapján
export class BodyMetricsService {
  private activeUserId: string | null = null;

  public static getInstance(): BodyMetricsService {
    return bodyMetricsService;
  }

  public setActiveUserId(userId: string | null): void {
    this.activeUserId = userId;
  }

  private getStorageKey(userId?: string | null): string | null {
    const uid = userId ?? this.activeUserId;
    if (!uid) return null;
    return `${STORAGE_TARGET_WEIGHT_PREFIX}_${uid}`;
  }

  // BMI és kategória kiszámítása (WHO képlet: súly kg / [magasság m]^2)
  public calculateBmi(weightKg?: number | null, heightCm?: number | null): BmiResult | null {
    if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
      return null;
    }

    const heightMeters = heightCm / 100;
    const rawBmi = weightKg / (heightMeters * heightMeters);
    const bmi = parseFloat(rawBmi.toFixed(1));

    if (bmi < 18.5) {
      return {
        bmi,
        category: 'Underweight',
        localizedCategory: i18n.t('bmi.underweight'),
        color: Colors.accent.sky,
        label: i18n.t('bmi.underweight'),
      };
    } else if (bmi < 25.0) {
      return {
        bmi,
        category: 'Normal',
        localizedCategory: i18n.t('bmi.normal'),
        color: Colors.accent.green,
        label: i18n.t('bmi.normalWeight'),
      };
    } else if (bmi < 30.0) {
      return {
        bmi,
        category: 'Overweight',
        localizedCategory: i18n.t('bmi.overweight'),
        color: Colors.accent.amber,
        label: i18n.t('bmi.overweight'),
      };
    } else {
      return {
        bmi,
        category: 'Obese',
        localizedCategory: i18n.t('bmi.obese'),
        color: '#FF5252',
        label: i18n.t('bmi.obese'),
      };
    }
  }

  // Cél testsúlytól való eltérés és irány kiszámítása
  public calculateProgress(
    currentWeight?: number | null,
    targetWeight?: number | null
  ): WeightProgress | null {
    if (!currentWeight || !targetWeight || currentWeight <= 0 || targetWeight <= 0) {
      return null;
    }

    const diffKg = parseFloat(Math.abs(currentWeight - targetWeight).toFixed(1));
    const isReached = currentWeight === targetWeight;
    const isLoss = currentWeight > targetWeight;

    let label: string;
    if (isReached) {
      label = i18n.t('weight.goalReached');
    } else if (isLoss) {
      label = i18n.t('weight.toLose', { diff: diffKg });
    } else {
      label = i18n.t('weight.toGain', { diff: diffKg });
    }

    return {
      targetWeight,
      diffKg,
      label,
      isLoss,
      isReached,
    };
  }

  // Cél testsúly lekérése a helyi tárolóból
  public async getTargetWeight(userId?: string | null): Promise<number | null> {
    try {
      const key = this.getStorageKey(userId);
      if (!key) return null;
      const val = await AsyncStorage.getItem(key);
      if (val !== null) {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Cél testsúly mentése a helyi tárolóba
  public async saveTargetWeight(targetWeight: number | null, userId?: string | null): Promise<void> {
    try {
      const key = this.getStorageKey(userId);
      if (!key) return;
      if (targetWeight === null || isNaN(targetWeight)) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, String(targetWeight));
      }
    } catch {
      // Helyi tárhely hiba figyelmen kívül hagyása
    }
  }

  private getDemographicsKey(userId?: string | null): string | null {
    const uid = userId ?? this.activeUserId;
    if (!uid) return null;
    return `${STORAGE_DEMOGRAPHICS_PREFIX}_${uid}`;
  }

  public async getDemographics(userId?: string | null): Promise<DemographicMetrics | null> {
    try {
      const key = this.getDemographicsKey(userId);
      if (!key) return null;
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as DemographicMetrics;
    } catch {
      return null;
    }
  }

  public async saveDemographics(metrics: DemographicMetrics, userId?: string | null): Promise<void> {
    try {
      const key = this.getDemographicsKey(userId);
      if (!key) return;
      const existing = (await this.getDemographics(userId)) ?? {};
      const merged: DemographicMetrics = {
        gender: metrics.gender !== undefined ? metrics.gender : existing.gender,
        age: metrics.age !== undefined ? metrics.age : existing.age,
      };
      await AsyncStorage.setItem(key, JSON.stringify(merged));
    } catch {
      // Helyi tárhely hiba figyelmen kívül hagyása
    }
  }
}

export const bodyMetricsService = new BodyMetricsService();
