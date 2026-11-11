import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';

export interface WeeklyPerformanceCardProps {
  /** Completed workouts count out of total (e.g. 5) */
  readonly completedWorkouts?: number;
  /** Target workouts for the week (e.g. 6) */
  readonly targetWorkouts?: number;
  /** Active minutes recorded this week (e.g. 215) */
  readonly activeMinutes?: number;
  /** Target progress percentage (0 - 100, default 90) */
  readonly progressPercent?: number;
}

/**
 * WeeklyPerformanceCard
 *
 * Isolated bottom card visualizing weekly performance:
 * - "HETI TELJESÍTMÉNY" badge & Motivational status ("Jó úton haladsz")
 * - Two KPI metrics: Completed workouts (e.g. 5/6) and Active minutes (215 p)
 * - Weekly target progress bar in FitBase brand blue palette.
 */
export const WeeklyPerformanceCard: React.FC<WeeklyPerformanceCardProps> = ({
  completedWorkouts = 5,
  targetWorkouts = 6,
  activeMinutes = 215,
  progressPercent = 90,
}) => {
  const boundedProgress = Math.min(100, Math.max(0, progressPercent));

  return (
    <View style={styles.card}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Text style={styles.badgeLabel}>WEEKLY PERFORMANCE</Text>
        <Text style={styles.headline}>You're on track</Text>
      </View>

      {/* 2. KPI Metrics Row */}
      <View style={styles.metricsRow}>
        {/* Workouts KPI */}
        <View style={styles.kpiItem}>
          <View style={styles.kpiValueRow}>
            <Text style={styles.kpiLargeNum}>{completedWorkouts}</Text>
            <Text style={styles.kpiDenominator}>/{targetWorkouts}</Text>
          </View>
          <Text style={styles.kpiLabel}>Workouts</Text>
        </View>

        {/* Divider */}
        <View style={styles.kpiDivider} />

        {/* Active Minutes KPI */}
        <View style={styles.kpiItem}>
          <View style={styles.kpiValueRow}>
            <Text style={styles.kpiLargeNum}>{activeMinutes}</Text>
            <Text style={styles.kpiUnit}>m</Text>
          </View>
          <Text style={styles.kpiLabel}>Active time</Text>
        </View>
      </View>

      {/* 3. Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Weekly goal</Text>
          <Text style={styles.progressValueText}>{boundedProgress}%</Text>
        </View>

        <View style={styles.track}>
          <View style={[styles.fillBar, { width: `${boundedProgress}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121C32',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 24,
  },
  header: {
    marginBottom: 18,
  },
  badgeLabel: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  kpiItem: {
    flex: 1,
  },
  kpiDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginBottom: 4,
  },
  kpiLargeNum: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  kpiDenominator: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  kpiUnit: {
    color: Colors.accent.blue,
    fontSize: 16,
    fontWeight: '700',
  },
  kpiLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressValueText: {
    color: Colors.accent.blue,
    fontSize: 13,
    fontWeight: '800',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0A101D',
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    backgroundColor: Colors.accent.blue,
    borderRadius: 3,
  },
});
