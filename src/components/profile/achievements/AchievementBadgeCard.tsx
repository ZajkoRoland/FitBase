import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { Achievement, AchievementTier } from '@/models/Achievement';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AchievementBadgeCardProps {
  achievement: Achievement;
}

const TIER_STYLES: Record<
  AchievementTier,
  { color: string; bgColor: string; labelKey: 'achievements.tier.bronze' | 'achievements.tier.silver' | 'achievements.tier.gold' | 'achievements.tier.diamond' }
> = {
  bronze: {
    labelKey: 'achievements.tier.bronze',
    color: '#CD7F32',
    bgColor: 'rgba(205, 127, 50, 0.15)',
  },
  silver: {
    labelKey: 'achievements.tier.silver',
    color: '#E0E0E0',
    bgColor: 'rgba(224, 224, 224, 0.15)',
  },
  gold: {
    labelKey: 'achievements.tier.gold',
    color: '#FFD700',
    bgColor: 'rgba(255, 215, 0, 0.15)',
  },
  diamond: {
    labelKey: 'achievements.tier.diamond',
    color: '#00E5FF',
    bgColor: 'rgba(0, 229, 255, 0.15)',
  },
};

/**
 * AchievementBadgeCard
 * Renders an isolated achievement card with distinct unlocked glow vs. locked progress states.
 */
export const AchievementBadgeCard: React.FC<AchievementBadgeCardProps> = ({
  achievement,
}) => {
  const { t } = useLanguage();
  const tier = TIER_STYLES[achievement.tier];
  const progressPercent = Math.min(
    Math.round((achievement.currentValue / achievement.targetValue) * 100),
    100
  );
  const remaining = Math.max(achievement.targetValue - achievement.currentValue, 0);

  return (
    <View
      style={[
        styles.card,
        achievement.isUnlocked && styles.cardUnlocked,
        achievement.isUnlocked && { borderColor: `${tier.color}40` },
      ]}
    >
      <View style={styles.topRow}>
        {/* Badge Icon Halo */}
        <View
          style={[
            styles.iconHalo,
            achievement.isUnlocked
              ? { backgroundColor: tier.bgColor, borderColor: `${tier.color}60` }
              : styles.iconHaloLocked,
          ]}
        >
          <Ionicons
            name={
              achievement.isUnlocked
                ? (achievement.icon as any)
                : 'lock-closed-outline'
            }
            size={22}
            color={achievement.isUnlocked ? tier.color : Colors.text.secondary}
          />
        </View>

        {/* Title & Description */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                !achievement.isUnlocked && styles.titleLocked,
              ]}
              numberOfLines={1}
            >
              {achievement.title}
            </Text>
            <View
              style={[
                styles.tierBadge,
                { backgroundColor: tier.bgColor, borderColor: `${tier.color}50` },
              ]}
            >
              <Text style={[styles.tierText, { color: tier.color }]}>
                {t(tier.labelKey)}
              </Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {achievement.description}
          </Text>
        </View>
      </View>

      {/* Status Bar / Progress Bar */}
      {achievement.isUnlocked ? (
        <View style={styles.unlockedFooter}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.accent.green} />
          <Text style={styles.unlockedText}>{t('achievements.card.unlocked')}</Text>
        </View>
      ) : (
        <View style={styles.lockedFooter}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {t('achievements.card.progress', {
                current: achievement.currentValue,
                target: achievement.targetValue,
                unit: achievement.unit ?? '',
              }).trim()}
            </Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.max(progressPercent, 4)}%` },
              ]}
            />
          </View>
          <Text style={styles.remainingHint}>
            {t('achievements.card.remaining', { count: remaining })}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.navy,
    marginBottom: 12,
  },
  cardUnlocked: {
    backgroundColor: '#15233E',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconHalo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconHaloLocked: {
    backgroundColor: Colors.background.subtle,
    borderColor: Colors.border.default,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  titleLocked: {
    color: Colors.text.secondary,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  unlockedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent.green,
  },
  lockedFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent.blue,
  },
  progressBarBg: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.background.subtle,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accent.blue,
  },
  remainingHint: {
    fontSize: 10,
    color: Colors.text.dim,
    fontWeight: '500',
  },
});
