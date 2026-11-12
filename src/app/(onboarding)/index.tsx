import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FitbaseCustomDialog } from '@/components/common/FitbaseCustomDialog';
import { OnboardingBottomButton } from '@/components/onboarding/OnboardingBottomButton';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingOptionCard } from '@/components/onboarding/OnboardingOptionCard';
import { OnboardingUnitToggle } from '@/components/onboarding/OnboardingUnitToggle';
import { OnboardingWheelPicker } from '@/components/onboarding/OnboardingWheelPicker';
import { useLanguage } from '@/context/LanguageProvider';
import { usePlan } from '@/context/PlanProvider';
import { useProfile } from '@/context/ProfileProvider';
import { FitbaseDialogConfig } from '@/models/DialogConfig';
import { planRepository } from '@/repositories/PlanRepository';
import { profileRepository } from '@/repositories/ProfileRepository';
import { planService } from '@/services/PlanService';

type GenderType = 'female' | 'male' | 'other';
type HeightUnit = 'cm' | 'ft';
type WeightUnit = 'kg' | 'lbs';
type FitnessGoal = 'Muscle Gain' | 'Fat Loss' | 'General Fitness' | 'Endurance';
type FitnessLevel = 'Beginner' | 'Intermediate' | 'Advanced';

const TOTAL_STEPS = 7;

function formatFeetInches(totalInches: number): string {
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}' ${inches}"`;
}

// Onboarding képernyő: 7 lépéses bevezető folyamat az alapadatok és edzéscélok megadásához
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { profile, refreshProfile } = useProfile();
  const { refreshPlan } = usePlan();
  const { t } = useLanguage();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [dialogConfig, setDialogConfig] = useState<FitbaseDialogConfig | null>(null);

  // Alapadatok és edzéscélok
  const [gender, setGender] = useState<GenderType>('male');
  const [age, setAge] = useState<number>(25);

  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightCm, setHeightCm] = useState<number>(175);

  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [weightKg, setWeightKg] = useState<number>(74);

  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('Muscle Gain');
  const [targetWeightKg, setTargetWeightKg] = useState<number>(78);
  const [hasCustomizedTargetWeight, setHasCustomizedTargetWeight] = useState<boolean>(false);
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>('Intermediate');

  const handleFinish = async () => {
    if (!profile) return;
    setSubmitting(true);

    try {
      await planRepository.saveWeek(planService.getWeekPlan());
    } catch (error: any) {
      setDialogConfig(
        FitbaseDialogConfig.error(
          t('onboarding.errorTitle'),
          `${t('onboarding.errSavePlan')}${error?.message ?? ''}`
        )
      );
      setSubmitting(false);
      return;
    }

    try {
      await profileRepository.update({
        gender,
        age,
        height: Math.round(heightCm),
        weight: parseFloat(weightKg.toFixed(1)),
        target_weight: parseFloat(targetWeightKg.toFixed(1)),
        fitness_goal: fitnessGoal,
        fitness_level: fitnessLevel,
        onboarding_completed: true,
      });
    } catch (error: any) {
      setDialogConfig(
        FitbaseDialogConfig.error(
          t('onboarding.errorTitle'),
          `${t('onboarding.errUpdateProfile')}${error?.message ?? ''}`
        )
      );
      setSubmitting(false);
      return;
    }

    await Promise.all([refreshPlan(), refreshProfile()]);
    setSubmitting(false);
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      if (step === 5 && !hasCustomizedTargetWeight) {
        if (fitnessGoal === 'Fat Loss') {
          setTargetWeightKg(Math.max(40, weightKg - 5));
        } else if (fitnessGoal === 'Muscle Gain') {
          setTargetWeightKg(Math.min(180, weightKg + 4));
        } else {
          setTargetWeightKg(weightKg);
        }
      }
      setStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = useCallback(() => {
    setStep((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);

  // Magasság kezelése (cm és ft/in átváltás)
  const displayedHeight = heightUnit === 'cm' ? Math.round(heightCm) : Math.round(heightCm / 2.54);
  const handleHeightChange = useCallback(
    (val: number) => {
      if (heightUnit === 'cm') {
        setHeightCm(val);
      } else {
        setHeightCm(parseFloat((val * 2.54).toFixed(1)));
      }
    },
    [heightUnit]
  );

  // Testsúly kezelése (kg és lbs átváltás)
  const displayedWeight = weightUnit === 'kg' ? Math.round(weightKg) : Math.round(weightKg * 2.20462);
  const handleWeightChange = useCallback(
    (val: number) => {
      if (weightUnit === 'kg') {
        setWeightKg(val);
      } else {
        setWeightKg(parseFloat((val / 2.20462).toFixed(2)));
      }
    },
    [weightUnit]
  );

  // Cél testsúly kezelése
  const displayedTargetWeight =
    weightUnit === 'kg' ? Math.round(targetWeightKg) : Math.round(targetWeightKg * 2.20462);
  const handleTargetWeightChange = useCallback(
    (val: number) => {
      setHasCustomizedTargetWeight(true);
      if (weightUnit === 'kg') {
        setTargetWeightKg(val);
      } else {
        setTargetWeightKg(parseFloat((val / 2.20462).toFixed(2)));
      }
    },
    [weightUnit]
  );

  const stepMeta = useMemo(() => {
    switch (step) {
      case 1:
        return {
          title: t('onboarding.stepGenderTitle'),
          subtitle: t('onboarding.stepGenderSubtitle'),
        };
      case 2:
        return {
          title: t('onboarding.stepAgeTitle'),
          subtitle: t('onboarding.stepAgeSubtitle'),
        };
      case 3:
        return {
          title: t('onboarding.stepHeightTitle'),
          subtitle: t('onboarding.stepHeightSubtitle'),
        };
      case 4:
        return {
          title: t('onboarding.stepWeightTitle'),
          subtitle: t('onboarding.stepWeightSubtitle'),
        };
      case 5:
        return {
          title: t('onboarding.stepGoalTitle'),
          subtitle: t('onboarding.stepGoalSubtitle'),
        };
      case 6:
        return {
          title: t('onboarding.stepTargetWeightTitle'),
          subtitle: t('onboarding.stepTargetWeightSubtitle'),
        };
      case 7:
      default:
        return {
          title: t('onboarding.stepLevelTitle'),
          subtitle: t('onboarding.stepLevelSubtitle'),
        };
    }
  }, [step, t]);

  const isFinalStep = step === TOTAL_STEPS;
  const isWheelStep = step === 2 || step === 3 || step === 4 || step === 6;
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12) + 12;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 4,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      {/* Fejléc és folyamatjelző sáv */}
      <OnboardingHeader
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
        backLabel={t('onboarding.backBtn')}
      />

      {/* Fejléc szöveg */}
      <View style={styles.headingBlock}>
        <Text style={styles.title}>{stepMeta.title}</Text>
        <Text style={styles.subtitle}>{stepMeta.subtitle}</Text>
      </View>

      {/* Lépés tartalma */}
      {isWheelStep ? (
        <View style={styles.wheelStepBody}>
          {step === 3 && (
            <View style={styles.toggleRow}>
              <OnboardingUnitToggle<HeightUnit>
                options={['cm', 'ft']}
                selected={heightUnit}
                onSelect={setHeightUnit}
              />
            </View>
          )}

          {(step === 4 || step === 6) && (
            <View style={styles.toggleRow}>
              <OnboardingUnitToggle<WeightUnit>
                options={['kg', 'lbs']}
                selected={weightUnit}
                onSelect={setWeightUnit}
              />
            </View>
          )}

          <View style={styles.wheelCenterZone}>
            {step === 2 && (
              <OnboardingWheelPicker
                key="wheel-age"
                min={14}
                max={99}
                value={age}
                onValueChange={setAge}
              />
            )}

            {step === 3 && (
              <OnboardingWheelPicker
                key={`wheel-height-${heightUnit}`}
                min={heightUnit === 'cm' ? 130 : 48}
                max={heightUnit === 'cm' ? 225 : 84}
                value={displayedHeight}
                onValueChange={handleHeightChange}
                formatValue={heightUnit === 'ft' ? formatFeetInches : undefined}
                unitLabel={
                  heightUnit === 'cm'
                    ? t('onboarding.centimeter')
                    : t('onboarding.feetInches')
                }
              />
            )}

            {step === 4 && (
              <OnboardingWheelPicker
                key={`wheel-weight-${weightUnit}`}
                min={weightUnit === 'kg' ? 35 : 77}
                max={weightUnit === 'kg' ? 180 : 396}
                value={displayedWeight}
                onValueChange={handleWeightChange}
                unitLabel={
                  weightUnit === 'kg'
                    ? t('onboarding.kilogram')
                    : t('onboarding.pounds')
                }
              />
            )}

            {step === 6 && (
              <OnboardingWheelPicker
                key={`wheel-target-weight-${weightUnit}`}
                min={weightUnit === 'kg' ? 35 : 77}
                max={weightUnit === 'kg' ? 180 : 396}
                value={displayedTargetWeight}
                onValueChange={handleTargetWeightChange}
                unitLabel={
                  weightUnit === 'kg'
                    ? t('onboarding.kilogram')
                    : t('onboarding.pounds')
                }
              />
            )}
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.cardsScroll}
          contentContainerStyle={styles.cardsScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {step === 1 && (
            <View style={styles.optionsList}>
              <OnboardingOptionCard
                label={t('onboarding.genderFemale')}
                iconName="female"
                selected={gender === 'female'}
                onSelect={() => setGender('female')}
              />
              <OnboardingOptionCard
                label={t('onboarding.genderMale')}
                iconName="male"
                selected={gender === 'male'}
                onSelect={() => setGender('male')}
              />
              <OnboardingOptionCard
                label={t('onboarding.genderOther')}
                iconName="radio-button-off"
                selected={gender === 'other'}
                onSelect={() => setGender('other')}
              />
            </View>
          )}

          {step === 5 && (
            <View style={styles.optionsList}>
              <OnboardingOptionCard
                label={t('onboarding.goalMuscle')}
                iconName="barbell-outline"
                selected={fitnessGoal === 'Muscle Gain'}
                onSelect={() => setFitnessGoal('Muscle Gain')}
              />
              <OnboardingOptionCard
                label={t('onboarding.goalWeightLoss')}
                iconName="flame-outline"
                selected={fitnessGoal === 'Fat Loss'}
                onSelect={() => setFitnessGoal('Fat Loss')}
              />
              <OnboardingOptionCard
                label={t('onboarding.goalMaintenance')}
                iconName="body-outline"
                selected={fitnessGoal === 'General Fitness'}
                onSelect={() => setFitnessGoal('General Fitness')}
              />
              <OnboardingOptionCard
                label={t('onboarding.goalEndurance')}
                iconName="heart-outline"
                selected={fitnessGoal === 'Endurance'}
                onSelect={() => setFitnessGoal('Endurance')}
              />
            </View>
          )}

          {step === 7 && (
            <View style={styles.optionsList}>
              <OnboardingOptionCard
                label={t('onboarding.levelBeginner')}
                iconName="fitness-outline"
                selected={fitnessLevel === 'Beginner'}
                onSelect={() => setFitnessLevel('Beginner')}
                variant="final"
              />
              <OnboardingOptionCard
                label={t('onboarding.levelIntermediate')}
                iconName="flash-outline"
                selected={fitnessLevel === 'Intermediate'}
                onSelect={() => setFitnessLevel('Intermediate')}
                variant="final"
              />
              <OnboardingOptionCard
                label={t('onboarding.levelAdvanced')}
                iconName="trophy-outline"
                selected={fitnessLevel === 'Advanced'}
                onSelect={() => setFitnessLevel('Advanced')}
                variant="final"
              />
            </View>
          )}
        </ScrollView>
      )}

      {/* Alsó tovább gomb */}
      <View style={styles.bottomBar}>
        <OnboardingBottomButton
          title={isFinalStep ? t('onboarding.finishBtn') : t('onboarding.continueBtn')}
          onPress={handleNext}
          variant={isFinalStep ? 'final' : 'primary'}
          loading={submitting}
        />
      </View>

      {/* Hibaüzenet párbeszédablak */}
      <FitbaseCustomDialog
        visible={Boolean(dialogConfig)}
        config={dialogConfig}
        onClose={() => setDialogConfig(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1222',
    paddingHorizontal: 24,
  },
  headingBlock: {
    width: '100%',
    marginTop: 28,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#5B6E8C',
    textAlign: 'left',
    marginTop: 6,
  },
  wheelStepBody: {
    flex: 1,
    width: '100%',
  },
  toggleRow: {
    marginTop: 26,
    alignItems: 'center',
  },
  wheelCenterZone: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsScroll: {
    flex: 1,
    width: '100%',
    marginTop: 28,
  },
  cardsScrollContent: {
    paddingBottom: 16,
  },
  optionsList: {
    width: '100%',
  },
  bottomBar: {
    width: '100%',
    paddingTop: 12,
  },
});
