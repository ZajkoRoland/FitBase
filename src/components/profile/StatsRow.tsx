import { Colors } from '@/constants/Colors';
import { useProfile } from '@/context/ProfileProvider';
import { shareService } from '@/services/ShareService';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function StatCard({
  value,
  label,
  sub,
  color,
}: {
  value: string;
  label: string;
  sub?: string;
  color: string;
}): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text
        style={[
          styles.val,
          { color, textShadowColor: color, textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } },
        ]}
      >
        {value}
      </Text>
      {Boolean(sub) && <Text style={styles.sub}>{sub}</Text>}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function StatsRow(): React.JSX.Element {
  const { profile } = useProfile();

  const handleShare = () => {
    shareService.shareProgress(profile);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>MY JOURNEY</Text>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Share your progress"
        >
          <Ionicons name="share-outline" size={14} color={Colors.accent.blue} />
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <StatCard
          value={String(profile?.sessions_this_week || 0)}
          label="Completed"
          color={Colors.accent.green}
        />
        <StatCard
          value={String(profile?.streak || 0)}
          label="Active Streak"
          color={Colors.accent.amber}
        />
        <StatCard
          value={String(profile?.total_hours || 0)}
          label="Time Trained"
          color={Colors.accent.blue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
    marginBottom: 4,
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
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.25)',
  },
  shareText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent.blue,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#1E2D4A',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  val: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  sub: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginTop: 4,
  },
});
