import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export interface WeekPhaseSelectorProps {
  /** Total number of weeks in the current plan structure (e.g., 2 or 4) */
  readonly totalWeeks: number;
  /** Active week index (0-indexed: 0, 1, 2, 3) */
  readonly currentWeekIndex: number;
  /** Callback fired when user selects a week */
  readonly onSelectWeek: (weekIndex: number) => void;
}

/**
 * WeekPhaseSelector
 *
 * Isolated component providing an elegant, interactive week/phase switch bar.
 * Replaces hardcoded "Week A:" or "Phase 1:" prefixes with a clean dedicated UI selector.
 */
export const WeekPhaseSelector: React.FC<WeekPhaseSelectorProps> = ({
  totalWeeks,
  currentWeekIndex,
  onSelectWeek,
}) => {
  if (totalWeeks <= 1) {
    return null;
  }

  const weeks = Array.from({ length: totalWeeks }, (_, i) => i);

  return (
    <View style={styles.container}>
      <View style={styles.selectorBar}>
        {weeks.map((weekIdx) => {
          const isSelected = weekIdx === currentWeekIndex;
          const weekLabel = `Week ${weekIdx + 1}`;

          return (
            <TouchableOpacity
              key={weekIdx}
              activeOpacity={0.75}
              onPress={() => onSelectWeek(weekIdx)}
              style={[
                styles.weekTab,
                isSelected ? styles.weekTabActive : styles.weekTabInactive,
              ]}
            >
              {isSelected && (
                <Ionicons
                  name="sparkles"
                  size={12}
                  color={Colors.accent.blue}
                  style={styles.activeIcon}
                />
              )}
              <Text
                style={[
                  styles.weekTabText,
                  isSelected ? styles.weekTabTextActive : styles.weekTabTextInactive,
                ]}
              >
                {weekLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  selectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121C30',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 4,
  },
  weekTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 11,
    gap: 5,
  },
  weekTabActive: {
    backgroundColor: 'rgba(74, 184, 248, 0.16)',
    borderWidth: 1.2,
    borderColor: Colors.accent.blue,
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  weekTabInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: 'transparent',
  },
  activeIcon: {
    marginRight: -1,
  },
  weekTabText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  weekTabTextActive: {
    color: Colors.accent.blue,
    fontWeight: '800',
  },
  weekTabTextInactive: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});
