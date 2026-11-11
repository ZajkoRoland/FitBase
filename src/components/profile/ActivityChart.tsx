import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { usePlan } from '@/context/PlanProvider';
import { useProfile } from '@/context/ProfileProvider';
import { profileService } from '@/services/ProfileService';

export function ActivityChart(): React.JSX.Element {
  const { profile } = useProfile();
  const { plannedWorkoutDays } = usePlan();
  const weeks = profileService.getActivityData(profile);
  const target = plannedWorkoutDays;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ACTIVITY · LAST 5 WEEKS</Text>
      <View style={styles.card}>
        <View style={styles.barsRow}>
          {weeks.map((w) => {
            const isGoalMet = w.count >= target;
            return (
              <View key={w.label} style={styles.barCol}>
                <Text style={[styles.countNum, isGoalMet && styles.countHigh]}>{w.count}</Text>
                <LinearGradient
                  colors={
                    isGoalMet
                      ? [Colors.accent.green, Colors.accent.green]
                      : [Colors.accent.blue, 'rgba(74, 184, 248, 0.4)']
                  }
                  style={[styles.barStack, { height: w.height }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
                <Text style={styles.weekLabel}>{w.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.text.secondary, letterSpacing: 1.5, marginBottom: 14 },
  card: {
    backgroundColor: '#1E2D4A',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  barsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  barCol: { alignItems: 'center', flex: 1 },
  countNum: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary, marginBottom: 6 },
  countHigh: { color: Colors.accent.green, fontWeight: '800' },
  barStack: { width: 58, borderRadius: 6 },
  weekLabel: { fontSize: 10, color: Colors.text.secondary, marginTop: 8 },
});
