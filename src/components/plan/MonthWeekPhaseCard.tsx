import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';

export interface MonthWeekPhaseCardProps {
  readonly weekIndex: number;
  readonly title: string;
  readonly focus: string;
  readonly workoutDaysCount: number;
  readonly restDaysCount: number;
  readonly isCurrentActiveWeek: boolean;
  readonly onOpenWeek: (weekIndex: number) => void;
}

// Heti fázis kártya a havi edzéstervben
export const MonthWeekPhaseCard: React.FC<MonthWeekPhaseCardProps> = ({
  weekIndex,
  title,
  focus,
  workoutDaysCount,
  restDaysCount,
  isCurrentActiveWeek,
  onOpenWeek,
}) => {
  const weekNumber = weekIndex + 1;

  return (
    <View style={[styles.card, isCurrentActiveWeek && styles.cardActive]}>
      {/* Fejlécsor */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={styles.badgeRow}>
            <View style={[styles.weekBadge, isCurrentActiveWeek && styles.weekBadgeActive]}>
              <Text style={[styles.weekBadgeText, isCurrentActiveWeek && styles.weekBadgeTextActive]}>
                WEEK {weekNumber}
              </Text>
            </View>
            {isCurrentActiveWeek && (
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>ACTIVE</Text>
              </View>
            )}
          </View>

          <Text style={styles.phaseTitle}>{title}</Text>
          <Text style={styles.focusText}>{focus}</Text>
        </View>
      </View>

      {/* Mérőszámok sora */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <View style={styles.workoutIndicator} />
          <Text style={styles.metricText}>{workoutDaysCount} workouts</Text>
        </View>

        <View style={styles.metricItem}>
          <View style={styles.restIndicator} />
          <Text style={styles.metricText}>{restDaysCount} rest days</Text>
        </View>
      </View>

      {/* Hét megnyitása / szerkesztése gomb */}
      <TouchableOpacity
        style={[styles.actionButton, isCurrentActiveWeek && styles.actionButtonActive]}
        onPress={() => onOpenWeek(weekIndex)}
        activeOpacity={0.8}
      >
        <Text style={[styles.actionButtonText, isCurrentActiveWeek && styles.actionButtonTextActive]}>
          {isCurrentActiveWeek ? '✓ Open Active Week' : 'Select & Edit Week'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#152038',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    marginBottom: 12,
  },
  cardActive: {
    borderColor: 'rgba(74, 184, 248, 0.35)',
    backgroundColor: '#18243E',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  weekBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  weekBadgeActive: {
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
  },
  weekBadgeText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  weekBadgeTextActive: {
    color: Colors.accent.blue,
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
  },
  activeTagText: {
    color: Colors.accent.blue,
    fontSize: 10,
    fontWeight: '700',
  },
  phaseTitle: {
    color: Colors.text.primary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  focusText: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workoutIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.blue,
  },
  restIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.amber,
  },
  metricText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    borderColor: 'rgba(74, 184, 248, 0.3)',
  },
  actionButtonText: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonTextActive: {
    color: Colors.accent.blue,
    fontWeight: '700',
  },
});
