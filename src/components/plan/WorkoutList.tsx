import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { Exercise, WorkoutDay } from '@/services/PlanService';
import { usePlan } from '@/context/PlanProvider';
import { ConfirmActionModal } from '@/components/common/ConfirmActionModal';
import { PlanExerciseCard } from './PlanExerciseCard';

export interface WorkoutListProps {
  readonly activeDay: WorkoutDay;
  readonly dayIndex?: number;
  readonly customEyebrow?: string;
  readonly isHistorical?: boolean;
  readonly isToday?: boolean;
}

export const WorkoutList: React.FC<WorkoutListProps> = ({
  activeDay,
  dayIndex = 0,
  customEyebrow,
  isHistorical = false,
  isToday = false,
}) => {
  const router = useRouter();
  const { t, i18n, isHungarian } = useLanguage();
  const {
    removeExerciseFromDay,
    setTargetDayIndexForAdd,
    setDayAsRest,
    completedExerciseIds,
  } = usePlan();
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [showRestConfirm, setShowRestConfirm] = useState(false);

  const exercises = activeDay.exercises ?? [];
  const hasExercises = exercises.length > 0;
  const countText = i18n.formatExerciseCount(exercises.length);

  const rawTail = activeDay.workoutMeta
    ? activeDay.workoutMeta.split('·').pop()?.trim() || t('plan.approxDuration', { mins: 40 })
    : t('plan.blueprintLabel');

  const metaText = activeDay.workoutMeta
    ? hasExercises
      ? `${countText} · ${i18n.translateWorkoutMeta(rawTail)}`
      : `${i18n.formatExerciseCount(0)} · ${i18n.translateWorkoutMeta(activeDay.workoutMeta)}`
    : `${countText} · ${t('plan.blueprintLabel')}`;

  const handleOpenLibrary = () => {
    setTargetDayIndexForAdd(dayIndex);
    router.navigate('/(tabs)/library');
  };

  const handleRequestRemoveExercise = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
  };

  const handleConfirmRemove = () => {
    if (exerciseToDelete) {
      removeExerciseFromDay(dayIndex, exerciseToDelete.id);
      setExerciseToDelete(null);
    }
  };

  const handleSwitchToRestDay = () => {
    if (exercises.length === 0) {
      setDayAsRest(dayIndex);
    } else {
      setShowRestConfirm(true);
    }
  };

  const handleConfirmSetRest = () => {
    setDayAsRest(dayIndex);
    setShowRestConfirm(false);
  };

  const displayWorkoutTitle = hasExercises
    ? i18n.translateWorkoutTitle(activeDay.workoutTitle)
    : t('plan.workoutDayFallback');

  return (
    <View style={styles.container}>
      {/* 1. Active Day Header */}
      <View style={styles.header}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>{customEyebrow || t('plan.dailyWorkoutEyebrow')}</Text>
          {isHistorical ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#10B981" />
              <Text style={styles.completedBadgeText}>
                {isHungarian ? 'Elvégezve' : 'Completed'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleSwitchToRestDay}
              style={styles.restDayBadge}
            >
              <Ionicons name="moon-outline" size={13} color="#FFB800" />
              <Text style={styles.restDayBadgeText}>{t('plan.setAsRestDayBtn')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {displayWorkoutTitle}
          </Text>
          <Text style={styles.metaText}>{metaText}</Text>
        </View>
      </View>

      {/* 2. Vertically Stacked Exercises */}
      <View style={styles.list}>
        {exercises.map((exercise, index) => (
          <PlanExerciseCard
            key={exercise.id || index}
            exercise={exercise}
            index={index}
            dayIndex={dayIndex}
            isCompleted={isHistorical ? true : Boolean(isToday && completedExerciseIds[exercise.id])}
            isReadOnly={true}
            onRemove={isHistorical ? undefined : handleRequestRemoveExercise}
          />
        ))}

        {/* Add Exercise to Routine Button (hidden on historical past workouts) */}
        {!isHistorical && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenLibrary}
            style={styles.addExerciseButton}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={18} color={Colors.accent.blue} />
            </View>
            <Text style={styles.addExerciseText}>{t('plan.addExerciseToRoutineBtn')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Exercise removal confirmation modal */}
      <ConfirmActionModal
        visible={Boolean(exerciseToDelete)}
        title={t('plan.removeExerciseTitle')}
        description={t('plan.removeExerciseDesc')}
        highlightItemName={
          exerciseToDelete
            ? i18n.translateExerciseTitle(exerciseToDelete.title, exerciseToDelete.slug)
            : undefined
        }
        confirmText={t('plan.removeBtn')}
        cancelText={t('common.cancel')}
        isDestructive={true}
        onConfirm={handleConfirmRemove}
        onCancel={() => setExerciseToDelete(null)}
      />

      {/* Rest day confirmation modal */}
      <ConfirmActionModal
        visible={showRestConfirm}
        title={t('plan.setRestModalTitle')}
        description={t('plan.setRestModalDesc')}
        confirmText={t('plan.setRestConfirmBtn')}
        cancelText={t('common.cancel')}
        iconName="moon-outline"
        isDestructive={false}
        onConfirm={handleConfirmSetRest}
        onCancel={() => setShowRestConfirm(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
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
  restDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 5,
    backgroundColor: 'rgba(255, 184, 0, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
  },
  restDayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFB800',
    letterSpacing: 0.2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  completedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  metaText: {
    flexShrink: 0,
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 20,
    flexDirection: 'column',
    gap: 10,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 184, 248, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(74, 184, 248, 0.30)',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 16,
    gap: 10,
    marginTop: 6,
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseText: {
    color: Colors.accent.blue,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
