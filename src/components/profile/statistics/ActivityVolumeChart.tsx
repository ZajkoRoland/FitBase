import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { usePlan } from '@/context/PlanProvider';
import { useProfile } from '@/context/ProfileProvider';
import { profileService } from '@/services/ProfileService';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const MAX_SCALE = 7;
const BAR_MAX_HEIGHT = 96;

// Heti aktivitási oszlopdiagram
export const ActivityVolumeChart: React.FC = () => {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const { plannedWorkoutDays } = usePlan();
  const weeks = profileService.getActivityData(profile);
  const targetWorkouts = plannedWorkoutDays;
  const targetLineBottom = Math.round(
    (Math.min(targetWorkouts, MAX_SCALE) / MAX_SCALE) * BAR_MAX_HEIGHT
  );

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t('statistics.activity.sectionTitle')}</Text>
        <View style={styles.targetLegendBadge}>
          <View style={styles.legendDot} />
          <Text style={styles.targetLegend}>
            {t('statistics.activity.targetPerWeek', { count: targetWorkouts })}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.chartContainer}>
          {/* Heti célérték referencia vonal */}
          <View
            style={[styles.targetLineContainer, { bottom: targetLineBottom + 26 }]}
            pointerEvents="none"
          >
            <View style={styles.targetTagBadge}>
              <Text style={styles.targetLeftTag}>{targetWorkouts}</Text>
            </View>
            <View style={styles.targetDottedLine} />
          </View>

          {/* Oszlopok */}
          <View style={styles.barsRow}>
            {weeks.map((w) => {
              const isGoalMet = w.count >= targetWorkouts;
              const barHeight = Math.max(
                16,
                Math.round((Math.min(w.count, MAX_SCALE) / MAX_SCALE) * BAR_MAX_HEIGHT)
              );

              return (
                <View key={w.label} style={styles.barCol}>
                  <View style={styles.countBadge}>
                    <Text style={[styles.countNum, isGoalMet && styles.countHigh]}>
                      {w.count}
                    </Text>
                    {isGoalMet && <View style={styles.starDot} />}
                  </View>

                  <LinearGradient
                    colors={
                      isGoalMet
                        ? [Colors.accent.green, 'rgba(0, 230, 118, 0.45)']
                        : [Colors.accent.blue, 'rgba(74, 184, 248, 0.3)']
                    }
                    style={[styles.barStack, { height: barHeight }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />

                  <Text style={[styles.weekLabel, isGoalMet && styles.weekLabelActive]}>
                    {w.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1.2,
  },
  targetLegendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(74, 184, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.2)',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.blue,
  },
  targetLegend: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent.blue,
  },
  card: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.navy,
  },
  chartContainer: {
    position: 'relative',
    height: 156,
    justifyContent: 'flex-end',
  },
  targetLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.25)',
    marginRight: 6,
  },
  targetLeftTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accent.blue,
    letterSpacing: 0.5,
  },
  targetDottedLine: {
    flex: 1,
    height: 1,
    borderWidth: 0.8,
    borderColor: 'rgba(74, 184, 248, 0.35)',
    borderStyle: 'dashed',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 156,
    zIndex: 2,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginBottom: 6,
    backgroundColor: '#152038',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 10,
    elevation: 3,
  },
  countNum: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  countHigh: {
    color: Colors.accent.green,
    fontWeight: '800',
  },
  starDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accent.green,
  },
  barStack: {
    width: 40,
    borderRadius: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  weekLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 8,
    fontWeight: '600',
    height: 18,
  },
  weekLabelActive: {
    color: Colors.text.primary,
  },
});
