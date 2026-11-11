import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { bodyMetricsService } from '@/services/BodyMetricsService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * BodyProgressCard
 * Links account-isolated profile body metrics with target weight progression and WHO BMI classification.
 */
export const BodyProgressCard: React.FC = () => {
  const { t, i18n } = useLanguage();
  const { profile } = useProfile();
  const [fallbackTarget, setFallbackTarget] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.target_weight !== undefined && profile?.target_weight !== null) {
      setFallbackTarget(profile.target_weight);
    } else if (profile?.id) {
      bodyMetricsService.getTargetWeight(profile.id).then((target) => {
        setFallbackTarget(target);
      });
    } else {
      setFallbackTarget(null);
    }
  }, [profile?.target_weight, profile?.id]);

  const weight = profile?.weight ?? null;
  const height = profile?.height ?? null;
  const targetWeight = profile?.target_weight ?? fallbackTarget;

  const bmiResult =
    weight && height ? bodyMetricsService.calculateBmi(weight, height) : null;

  const progress =
    weight && targetWeight
      ? bodyMetricsService.calculateProgress(weight, targetWeight)
      : null;

  if (!weight && !targetWeight) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('statistics.body.sectionTitle')}</Text>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.weightLabel}>{t('statistics.body.currentWeight')}</Text>
            <Text style={styles.weightValue}>
              {weight ? `${i18n.formatNumber(weight)} kg` : '--'}
            </Text>
          </View>

          {targetWeight !== null && (
            <>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={Colors.text.secondary}
                style={{ alignSelf: 'center' }}
              />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.weightLabel}>{t('statistics.body.targetGoal')}</Text>
                <Text style={[styles.weightValue, { color: Colors.accent.blue }]}>
                  {i18n.formatNumber(targetWeight)} kg
                </Text>
              </View>
            </>
          )}
        </View>

        {progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressHint}>{progress.label}</Text>
              <Text style={styles.progressPercent}>
                {progress.isReached
                  ? '100%'
                  : t('statistics.body.kgLeft', {
                      diff: i18n.formatNumber(progress.diffKg),
                    })}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: progress.isReached ? '100%' : '72%' },
                ]}
              />
            </View>
          </View>
        )}

        {bmiResult && (
          <View style={styles.bmiRow}>
            <View style={styles.bmiInfo}>
              <Text style={styles.bmiLabel}>{t('statistics.body.bmiLabel')}</Text>
              <Text style={styles.bmiValue}>{i18n.formatNumber(bmiResult.bmi)}</Text>
            </View>
            <View
              style={[
                styles.bmiBadge,
                {
                  backgroundColor: `${bmiResult.color}1F`,
                  borderColor: `${bmiResult.color}4D`,
                },
              ]}
            >
              <Text style={[styles.bmiBadgeText, { color: bmiResult.color }]}>
                {bmiResult.label}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border.navy,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weightLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  progressContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressHint: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent.blue,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.background.subtle,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.blue,
  },
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.default,
  },
  bmiInfo: {
    gap: 2,
  },
  bmiLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  bmiValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  bmiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  bmiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
