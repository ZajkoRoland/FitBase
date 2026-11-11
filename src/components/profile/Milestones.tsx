import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { useProfile } from '@/context/ProfileProvider';
import { profileService } from '@/services/ProfileService';

export function Milestones(): React.JSX.Element {
  const { profile } = useProfile();
  const milestones = profileService.getMilestones(profile);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>MILESTONES</Text>
      {milestones.map((m) => (
        <View key={m.text} style={[styles.row, m.done && styles.rowDone]}>
          <Text style={styles.emoji}>{m.emoji}</Text>
          <Text style={styles.text}>{m.text}</Text>
          <View style={[styles.check, m.done ? styles.checkDone : styles.checkPending]}>
            {m.done && (
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6 9 17l-5-5" />
              </Svg>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.text.secondary, letterSpacing: 1.5, marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2D4A',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginBottom: 10,
  },
  rowDone: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    borderColor: '#16A34A',
  },
  emoji: { fontSize: 20, marginRight: 12 },
  text: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  check: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: '#16A34A', borderColor: '#16A34A', borderWidth: 2 },
  checkPending: { borderWidth: 2, borderColor: Colors.text.secondary },
});
