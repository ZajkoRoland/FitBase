import { Colors } from '@/constants/Colors';
import { useProfile } from '@/context/ProfileProvider';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function WeeklyGoal(): React.JSX.Element {
  const { profile } = useProfile();
  const current = profile?.sessions_this_week || 0;
  const target = 4;
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>WEEKLY GOAL</Text>
        <Text style={styles.fraction}>
          <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>{current}</Text>
          <Text style={{ color: Colors.text.secondary }}> / </Text>
          <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>{target}</Text>
        </Text>
      </View>
      <View style={styles.barBg}>
        <LinearGradient colors={[Colors.accent.green, Colors.accent.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.hint}>
        {remaining > 0 ? `${remaining} more workouts to hit the weekly goal.` : 'Weekly goal achieved! 🎉'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20, paddingTop: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 12, fontWeight: '700', color: Colors.text.secondary, letterSpacing: 1.5 },
  fraction: { fontSize: 16, fontWeight: '700' },
  barBg: { height: 6, borderRadius: 3, backgroundColor: Colors.background.subtle },
  barFill: { height: 6, borderRadius: 3 },
  hint: { fontSize: 12, color: Colors.text.secondary, marginTop: 8 },
});
