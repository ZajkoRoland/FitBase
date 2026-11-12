import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { RecoveryPillar } from '@/models/RecoveryPillar';
import { ExerciseCheckButton } from './ExerciseCheckButton';

export interface RecoveryPillarItemProps {
  readonly pillar: RecoveryPillar;
  readonly onToggle: (pillarId: string) => void;
}

// Regenerációs pillér elem kártya
export const RecoveryPillarItem: React.FC<RecoveryPillarItemProps> = ({
  pillar,
  onToggle,
}) => {
  const handleToggle = () => {
    onToggle(pillar.id);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleToggle}
      style={[
        styles.container,
        pillar.isCompleted && styles.containerCompleted,
      ]}
    >
      {/* 1. Kategória ikon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${pillar.accentColor}18` }, // 10%-os áttetsző háttérszín
        ]}
      >
        <Ionicons
          name={pillar.iconName as any}
          size={20}
          color={pillar.accentColor}
        />
      </View>

      {/* 2. Középső információs rész */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              pillar.isCompleted && styles.titleCompleted,
            ]}
          >
            {pillar.title}
          </Text>
          <View style={styles.targetBadge}>
            <Text style={[styles.targetText, { color: pillar.accentColor }]}>
              {pillar.target}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {pillar.description}
        </Text>
      </View>

      {/* 3. Pipa gomb */}
      <View style={styles.checkWrapper}>
        <ExerciseCheckButton
          size={24}
          isCompleted={pillar.isCompleted}
          onToggle={handleToggle}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121C32',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10,
  },
  containerCompleted: {
    backgroundColor: 'rgba(18, 28, 50, 0.65)',
    borderColor: 'rgba(74, 222, 128, 0.25)',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  titleCompleted: {
    color: Colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  targetBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  targetText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  description: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
  },
  checkWrapper: {
    marginLeft: 4,
  },
});
