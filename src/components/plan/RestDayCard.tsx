import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { RestDayContentHelper } from '@/utils/RestDayContentHelper';

export interface RestDayCardProps {
  readonly title?: string;
  readonly desc?: string;
  readonly onStartWorkout?: () => void;
  readonly customEyebrow?: string;
  readonly date?: Date;
  readonly dayIndex?: number;
}

export const RestDayCard: React.FC<RestDayCardProps> = ({
  title,
  desc,
  onStartWorkout,
  customEyebrow,
  date,
  dayIndex,
}) => {
  const { t, i18n } = useLanguage();
  const displayTitle = title
    ? i18n.translateWorkoutTitle(title)
    : RestDayContentHelper.getTitle(date);
  const displayDesc = desc ?? RestDayContentHelper.getDescription(date, dayIndex);

  return (
    <View style={styles.container}>
      <View style={styles.eyebrowRow}>
        <Text style={styles.eyebrow}>{customEyebrow || t('plan.restCardEyebrow')}</Text>
        {onStartWorkout && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onStartWorkout}
            style={styles.addWorkoutBadge}
          >
            <Ionicons name="add" size={13} color={Colors.accent.blue} />
            <Text style={styles.addWorkoutBadgeText}>{t('plan.addWorkoutBtn')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <LinearGradient
        colors={['#141E36', '#0E1628']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.headerRow}>
          <View style={styles.iconWrapper}>
            <Ionicons name="moon" size={18} color={Colors.accent.amber} />
          </View>
          <Text style={styles.title}>{displayTitle}</Text>
        </View>
        <Text style={styles.desc}>{displayDesc}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  eyebrow: {
    flex: 1,
    flexShrink: 1,
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  addWorkoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    backgroundColor: 'rgba(74, 184, 248, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
  },
  addWorkoutBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent.blue,
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 179, 0, 0.28)',
    alignItems: 'center',
    shadowColor: Colors.accent.amber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 6,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  desc: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
