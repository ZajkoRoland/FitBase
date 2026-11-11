import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { usePlan } from '@/context/PlanProvider';
import { Exercise, ExerciseSet, PlanService } from '@/services/PlanService';
import { calorieService } from '@/services/CalorieService';
import { ExerciseDetail } from '@/types/exercise';
import { exerciseLookupService } from '@/services/ExerciseLookupService';
import { ExercisePoseMotionPlayer } from './ExercisePoseMotionPlayer';
import { ExerciseCheckButton } from './ExerciseCheckButton';
import { EditExerciseSetsModal } from './EditExerciseSetsModal';

export interface PlanExerciseCardProps {
  readonly exercise: Exercise;
  readonly index: number;
  readonly dayIndex?: number;
  readonly isCompleted?: boolean;
  readonly onToggleComplete?: (completed: boolean) => void;
  readonly onRemove?: (exercise: Exercise) => void;
  readonly isReadOnly?: boolean;
}

export function PlanExerciseCard({
  exercise,
  index,
  dayIndex,
  isCompleted: isCompletedProp,
  onToggleComplete,
  onRemove,
  isReadOnly = true,
}: PlanExerciseCardProps): React.JSX.Element {
  const { language, t, i18n } = useLanguage();
  const { updateExerciseInDay, activeDayIndex } = usePlan();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showEditSetsModal, setShowEditSetsModal] = useState<boolean>(false);
  const [show1RMHelp, setShow1RMHelp] = useState<boolean>(false);
  const [localCompleted, setLocalCompleted] = useState<boolean>(false);
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const targetDay = dayIndex !== undefined ? dayIndex : activeDayIndex;

  const exerciseSets = useMemo(() => PlanService.ensureExerciseSets(exercise), [exercise]);
  const exerciseVolume = useMemo(() => PlanService.calculateTotalVolume(exerciseSets), [exerciseSets]);
  const exerciseCalories = useMemo(
    () => calorieService.calculateExerciseCalories(exercise, 75),
    [exercise]
  );
  const exerciseBest1RM = useMemo(() => {
    return exerciseSets.reduce(
      (max, s) => Math.max(max, PlanService.calculateEstimated1RM(s.weightKg, s.reps)),
      0
    );
  }, [exerciseSets]);

  const handleSaveSets = useCallback(
    async (updatedSets: ExerciseSet[], newRestSeconds: number) => {
      try {
        await updateExerciseInDay(targetDay, exercise.id, {
          sets: updatedSets,
          restSeconds: newRestSeconds,
        });
      } catch (err) {
        console.warn('[PlanExerciseCard] Failed to save exercise sets:', err);
      } finally {
        setShowEditSetsModal(false);
      }
    },
    [updateExerciseInDay, targetDay, exercise.id]
  );

  const completed = isCompletedProp ?? localCompleted;

  const handleToggleComplete = useCallback((newState: boolean) => {
    if (isReadOnly) return;
    if (onToggleComplete) {
      onToggleComplete(newState);
    } else {
      setLocalCompleted(newState);
    }
  }, [isReadOnly, onToggleComplete]);

  const handleRequestRemove = useCallback(() => {
    if (onRemove) {
      onRemove(exercise);
    }
  }, [onRemove, exercise]);

  const { setsReps, restTime } = useMemo(() => {
    const raw = (exercise.details || '').trim();
    const parts = raw.split('·').map((p) => p.trim()).filter(Boolean);

    let restPart = '';
    const nonRestParts: string[] = [];

    for (const p of parts) {
      if (/(\d+)\s*(mp|s|sec|min|perc|rest|pihen)/i.test(p)) {
        restPart = p;
      } else {
        nonRestParts.push(p);
      }
    }

    const setsReps = nonRestParts.length > 0
      ? nonRestParts.join(' · ').replace(/x/gi, '×')
      : parts[0]?.replace(/x/gi, '×') || raw;

    const restTime = exercise.restSeconds
      ? i18n.formatRestBadge(`${exercise.restSeconds} mp`)
      : restPart
        ? i18n.formatRestBadge(restPart)
        : i18n.formatRestBadge('60 mp');

    return { setsReps, restTime };
  }, [exercise.details, exercise.restSeconds, language, i18n]);

  // Load rich details when expanded or when language changes while expanded
  useEffect(() => {
    if (isExpanded) {
      let isMounted = true;
      setLoading(true);

      exerciseLookupService
        .resolveExerciseDetails(exercise)
        .then((data) => {
          if (isMounted) setDetail(data);
        })
        .catch((err) => {
          console.warn('[PlanExerciseCard] Error resolving exercise detail:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isExpanded, exercise, language]);

  const handleToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  const localizedTitle = i18n.translateExerciseTitle(exercise.title, exercise.slug);
  const startImageUrl = detail?.images?.start || exercise.startImageUrl;
  const peakImageUrl = detail?.images?.peak || exercise.peakImageUrl;
  const description = detail?.description || exercise.description;
  const instructions = detail?.instructions || exercise.instructions || [];

  return (
    <View style={[styles.card, isExpanded && styles.cardActive]}>
      {/* 1. Card Header Row */}
      <TouchableOpacity
        style={styles.headerPressable}
        onPress={handleToggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.topRow}>
          <ExerciseCheckButton
            isCompleted={completed}
            onToggle={handleToggleComplete}
            disabled={isReadOnly}
            size={24}
          />

          <View style={styles.infoCol}>
            <Text style={styles.title} numberOfLines={2}>
              {localizedTitle}
            </Text>
            <Text style={styles.restText}>{restTime}</Text>
          </View>

          <View style={styles.rightMeta}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setShowEditSetsModal(true);
              }}
              style={styles.quickEditBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.setsRepsText}>{setsReps}</Text>
              <Ionicons name="create-outline" size={13} color={Colors.accent.blue} />
            </TouchableOpacity>

            <View style={styles.chevronWrapper}>
              <Svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke={isExpanded ? Colors.accent.blue : 'rgba(255, 255, 255, 0.3)'}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isExpanded ? <Path d="M18 15l-6-6-6 6" /> : <Path d="M6 9l6 6 6-6" />}
              </Svg>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* 2. Expanded Content Accordion */}
      {isExpanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />

          {loading && !detail ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.accent.blue} size="small" />
              <Text style={styles.loadingText}>{t('plan.loadingDetails')}</Text>
            </View>
          ) : (
            <>
              {/* Hands-free Start/Peak Motion Player */}
              <ExercisePoseMotionPlayer
                startImageUrl={startImageUrl}
                peakImageUrl={peakImageUrl}
                exerciseTitle={localizedTitle}
                cycleDurationMs={2000}
              />

              {/* Sets and Weight Summary & Edit Card */}
              <View style={styles.setsCardBlock}>
                <View style={styles.setsHeaderRow}>
                  <View style={styles.setsHeaderLeft}>
                    <Ionicons name="barbell-outline" size={15} color={Colors.accent.blue} />
                    <Text style={styles.setsSectionTitle}>{t('plan.setsSummaryHeading')}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setShowEditSetsModal(true)}
                    style={styles.editSetsChip}
                  >
                    <Ionicons name="create-outline" size={13} color={Colors.accent.blue} />
                    <Text style={styles.editSetsChipText}>{t('plan.editSetsBtnShort')}</Text>
                  </TouchableOpacity>
                </View>

                {/* Badges for each set */}
                <View style={styles.setsBadgesGrid}>
                  {exerciseSets.map((s) => (
                    <View key={s.setNumber} style={styles.setDetailPill}>
                      <Text style={styles.setDetailPillNum}>#{s.setNumber}</Text>
                      <Text style={styles.setDetailPillText}>
                        {s.weightKg > 0 ? `${s.reps} ${t('plan.repsSuffix')} · ${s.weightKg} kg` : `${s.reps} ${t('plan.repsSuffix')}`}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Volume, 1RM & Calories footer stats */}
                <View style={styles.setsFooterStats}>
                  {exerciseVolume > 0 && (
                    <Text style={styles.setsFooterText}>
                      {t('plan.totalVolumeBadge', { vol: exerciseVolume })}
                    </Text>
                  )}
                  {exerciseBest1RM > 0 && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShow1RMHelp((prev) => !prev)}
                      style={styles.oneRMBadgeBtn}
                    >
                      <Text style={styles.setsFooterText}>
                        {t('plan.best1RMBadge', { oneRm: exerciseBest1RM })}
                      </Text>
                      <Ionicons name="information-circle-outline" size={13} color={Colors.accent.blue} />
                    </TouchableOpacity>
                  )}
                  <View style={styles.calorieBadge}>
                    <Ionicons name="flame" size={11} color={Colors.accent.orange} />
                    <Text style={styles.calorieBadgeText}>~{exerciseCalories} kcal</Text>
                  </View>
                </View>

                {/* Collapsible 1RM educational explanation */}
                {show1RMHelp && (
                  <View style={styles.oneRMHelpBox}>
                    <View style={styles.oneRMHelpHeader}>
                      <Ionicons name="bulb-outline" size={14} color={Colors.accent.amber} />
                      <Text style={styles.oneRMHelpTitle}>{t('plan.1rmExplanationTitle')}</Text>
                    </View>
                    <Text style={styles.oneRMHelpBody}>{t('plan.1rmExplanationBody')}</Text>
                  </View>
                )}
              </View>

              {description && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>{t('plan.descriptionHeading')}</Text>
                  <Text style={styles.descBody}>{description}</Text>
                </View>
              )}

              {instructions.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>{t('plan.executionStepsHeading')}</Text>
                  <View style={styles.stepsList}>
                    {instructions.map((step, sIdx) => (
                      <View key={sIdx} style={styles.stepRow}>
                        <View style={styles.stepNumBox}>
                          <Text style={styles.stepNumText}>{sIdx + 1}</Text>
                        </View>
                        <Text style={styles.stepBodyText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Remove from Routine Action Button */}
              {onRemove && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleRequestRemove}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF6B81" />
                  <Text style={styles.removeButtonText}>{t('plan.removeFromRoutineBtn')}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {/* 3. Edit Sets & Weights Bottom-Sheet Modal */}
      {showEditSetsModal && (
        <EditExerciseSetsModal
          visible={showEditSetsModal}
          exercise={exercise}
          onClose={() => setShowEditSetsModal(false)}
          onSave={handleSaveSets}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#121C32',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: 'rgba(74, 184, 248, 0.35)',
    backgroundColor: '#15223C',
  },
  headerPressable: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoCol: {
    flex: 1,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  restText: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 184, 248, 0.1)',
  },
  setsRepsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  chevronWrapper: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 8,
  },
  setsCardBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 12,
  },
  setsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  setsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setsSectionTitle: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  editSetsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.3)',
  },
  editSetsChipText: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '700',
  },
  setsBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  setDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10, 16, 26, 0.6)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  setDetailPillNum: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '800',
  },
  setDetailPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  setsFooterStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  calorieBadgeText: {
    color: Colors.accent.orange,
    fontSize: 11,
    fontWeight: '700',
  },
  setsFooterText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  oneRMBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  oneRMHelpBox: {
    marginTop: 10,
    backgroundColor: 'rgba(74, 184, 248, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.2)',
  },
  oneRMHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  oneRMHelpTitle: {
    color: Colors.accent.amber,
    fontSize: 12,
    fontWeight: '700',
  },
  oneRMHelpBody: {
    color: '#B5C2D2',
    fontSize: 11,
    lineHeight: 16,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  sectionBlock: {
    marginTop: 12,
  },
  sectionLabel: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
  },
  descBody: {
    color: '#B5C2D2',
    fontSize: 13,
    lineHeight: 19,
  },
  stepsList: {
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '800',
  },
  stepBodyText: {
    color: Colors.text.primary,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 129, 0.25)',
  },
  removeButtonText: {
    color: '#FF6B81',
    fontSize: 13,
    fontWeight: '700',
  },
});
