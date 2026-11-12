import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { WorkoutDay } from '@/services/PlanService';

export interface WeeklyDayCardProps {
  readonly item: WorkoutDay;
  readonly dayNum: number;
  readonly dayLetter: string;
  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly onPress: () => void;
  readonly style?: StyleProp<ViewStyle>;
}

export function WeeklyDayCard({
  item,
  dayNum,
  dayLetter,
  isToday,
  isSelected,
  onPress,
  style,
}: WeeklyDayCardProps): React.JSX.Element {
  const { t, i18n } = useLanguage();
  const isRest = item.type === 'rest';
  const exerciseCount = item.exercises?.length ?? 0;

  const routineTitle = isRest
    ? t('plan.restDayTitle')
    : i18n.translateWorkoutTitle(item.workoutTitle);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 1. Fejléc: nap rövidítése és mai nap jelzés */}
      <View style={styles.cardHeader}>
        <Text style={[styles.dayLetter, isSelected && styles.dayLetterSelected]}>
          {dayLetter}
        </Text>
        {isToday && (
          <View style={[styles.todayBadge, isSelected && styles.todayBadgeSelected]}>
            <Text style={[styles.todayText, isSelected && styles.todayTextSelected]}>
              {t('plan.todayBadge')}
            </Text>
          </View>
        )}
      </View>

      {/* 2. Nap száma */}
      <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
        {dayNum}
      </Text>

      {/* 3. Alsó információs rész */}
      <View style={styles.bottomContent}>
        <Text
          style={[
            styles.routineTitle,
            isRest && styles.routineTitleRest,
            isSelected && styles.routineTitleSelected,
          ]}
          numberOfLines={2}
        >
          {routineTitle}
        </Text>

        {isRest ? (
          <View style={styles.restIndicatorRow}>
            <Ionicons name="moon" size={10} color={Colors.accent.amber} />
            <Text style={styles.restSubText}>{t('plan.recoveryLabel')}</Text>
          </View>
        ) : (
          <Text
            style={[
              styles.exerciseCountText,
              isSelected && styles.exerciseCountTextSelected,
            ]}
            numberOfLines={1}
          >
            {i18n.formatExerciseCount(exerciseCount)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 82,
    height: 150,
    borderRadius: 20,
    backgroundColor: '#152038',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  cardSelected: {
    borderColor: Colors.accent.blue,
    backgroundColor: '#18253E',
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLetter: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayLetterSelected: {
    color: Colors.text.primary,
  },
  todayBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(74, 184, 248, 0.4)',
  },
  todayBadgeSelected: {
    backgroundColor: Colors.accent.blue,
  },
  todayText: {
    color: Colors.accent.blue,
    fontSize: 8,
    fontWeight: '800',
  },
  todayTextSelected: {
    color: '#0D1528',
  },
  dayNumber: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: -2,
    marginBottom: 4,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  bottomContent: {
    minHeight: 48,
    justifyContent: 'flex-end',
    gap: 6,
  },
  routineTitle: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  routineTitleRest: {
    color: Colors.accent.amber,
  },
  routineTitleSelected: {
    color: '#FFFFFF',
  },
  exerciseCountText: {
    color: Colors.accent.blue,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  exerciseCountTextSelected: {
    color: Colors.accent.blue,
  },
  restIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restSubText: {
    color: '#8A9DBA',
    fontSize: 9.5,
    fontWeight: '600',
  },
});
