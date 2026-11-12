import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { RecoveryPillar } from '@/models/RecoveryPillar';
import { RestDayContentHelper } from '@/utils/RestDayContentHelper';
import { RecoveryPillarItem } from './RecoveryPillarItem';

export interface RecoveryPillarsCardProps {
  readonly initialPillars?: RecoveryPillar[];
  readonly onPillarsChange?: (pillars: RecoveryPillar[]) => void;
  readonly date?: Date;
}

export const RecoveryPillarsCard: React.FC<RecoveryPillarsCardProps> = ({
  initialPillars,
  onPillarsChange,
  date,
}) => {
  const { language, t } = useLanguage();
  const [pillars, setPillars] = useState<RecoveryPillar[]>(() =>
    initialPillars ?? RecoveryPillar.createDefaultPillars()
  );

  const completedCount = pillars.filter((p) => p.isCompleted).length;
  const totalCount = pillars.length;
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;

  const isFuture = RestDayContentHelper.isFuture(date);
  const isToday = RestDayContentHelper.isToday(date);

  const headline = isFuture
    ? t('plan.recovery.cardTitleFuture')
    : isToday
    ? t('plan.recovery.cardTitleToday')
    : t('plan.recovery.cardTitlePast');

  const badgeText = isFuture
    ? t('plan.recovery.badgeFuture')
    : isToday
    ? t('plan.recovery.doneCount', { completed: completedCount, total: totalCount })
    : t('plan.recovery.badgePast');

  useEffect(() => {
    if (!initialPillars) {
      const freshDefaults = RecoveryPillar.createDefaultPillars();
      setPillars((prev) =>
        freshDefaults.map((def) => {
          const existing = prev.find((p) => p.id === def.id);
          return existing && existing.isCompleted !== def.isCompleted ? def.toggle() : def;
        })
      );
    }
  }, [language, initialPillars]);

  const handleTogglePillar = (pillarId: string) => {
    const updated = pillars.map((pillar) => {
      if (pillar.id === pillarId) {
        return pillar.toggle();
      }
      return pillar;
    });

    setPillars(updated);
    if (onPillarsChange) {
      onPillarsChange(updated);
    }
  };

  return (
    <View style={styles.card}>
      {/* 1. Fejléc címmel és számlálóval */}
      <View style={styles.header}>
        <Text style={styles.headline}>{headline}</Text>

        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>{badgeText}</Text>
        </View>
      </View>

      {/* 2. Haladási sáv */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(progressRatio * 100)}%` },
          ]}
        />
      </View>

      {/* 3. Pillérek listája */}
      <View style={styles.list}>
        {pillars.map((pillar) => (
          <RecoveryPillarItem
            key={pillar.id}
            pillar={pillar}
            onToggle={handleTogglePillar}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0E172A',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 18,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  counterBadge: {
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.25)',
  },
  counterText: {
    color: Colors.accent.amber,
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.amber,
    borderRadius: 2,
  },
  list: {
    gap: 2,
  },
});
