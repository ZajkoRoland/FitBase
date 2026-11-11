import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { AchievementCategory } from '@/models/Achievement';
import { achievementsService } from '@/services/AchievementsService';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AchievementBadgeCard } from './AchievementBadgeCard';

interface AchievementsModalProps {
  visible: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | AchievementCategory;

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  visible,
  onClose,
}) => {
  const { language, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { profile, achievements: contextAchievements, playerRank: contextRank } = useProfile();
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');

  const allAchievements = useMemo(() => {
    if (contextAchievements && contextAchievements.length > 0) {
      return contextAchievements;
    }
    return achievementsService.getAchievements(profile);
  }, [contextAchievements, profile, language]);

  const playerRank = useMemo(() => {
    return contextRank ?? achievementsService.calculatePlayerRank(allAchievements);
  }, [contextRank, allAchievements, language]);

  const filteredAchievements = useMemo(() => {
    if (selectedFilter === 'all') {
      return allAchievements;
    }
    return allAchievements.filter((a) => a.category === selectedFilter);
  }, [allAchievements, selectedFilter]);

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: t('achievements.filter.all') },
    { id: 'streak', label: t('achievements.filter.streak') },
    { id: 'workouts', label: t('achievements.filter.workouts') },
    { id: 'dedication', label: t('achievements.filter.dedication') },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top > 0 ? insets.top : 16,
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('achievements.closeA11y')}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
            <Text style={styles.backText}>{t('achievements.backProfile')}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('achievements.title')}</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom, 48) + 24,
            },
          ]}
        >
          <View style={styles.rankCard}>
            <View style={styles.rankHeader}>
              <View style={styles.rankIconBadge}>
                <Ionicons name="trophy" size={26} color={Colors.accent.amber} />
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.levelLabel}>
                  {t('achievements.levelFitness', { level: playerRank.level })}
                </Text>
                <Text style={styles.rankTitle}>{playerRank.title}</Text>
              </View>
            </View>

            <View style={styles.rankProgressRow}>
              <Text style={styles.rankProgressText}>
                {t('achievements.badgesUnlocked', {
                  unlocked: playerRank.unlockedCount,
                  total: playerRank.totalCount,
                })}
              </Text>
              <Text style={styles.rankPercentText}>
                {playerRank.progressPercent}%
              </Text>
            </View>

            <View style={styles.rankProgressBarBg}>
              <View
                style={[
                  styles.rankProgressBarFill,
                  { width: `${Math.max(playerRank.progressPercent, 5)}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.filtersRow}>
            {filterTabs.map((tab) => {
              const active = selectedFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(tab.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.badgesList}>
            {filteredAchievements.map((item) => (
              <AchievementBadgeCard key={item.id} achievement={item} />
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.navy,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    minWidth: 70,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  rankCard: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.3)',
    marginBottom: 18,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  rankIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 179, 0, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.4)',
  },
  rankInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accent.amber,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  rankProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  rankPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent.amber,
  },
  rankProgressBarBg: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.background.subtle,
    overflow: 'hidden',
  },
  rankProgressBarFill: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accent.amber,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.border.navy,
  },
  filterChipActive: {
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
    borderColor: Colors.accent.blue,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.accent.blue,
    fontWeight: '700',
  },
  badgesList: {
    gap: 2,
  },
});
