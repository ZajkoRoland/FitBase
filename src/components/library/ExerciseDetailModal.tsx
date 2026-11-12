import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { exerciseRepository } from '@/repositories/ExerciseRepository';
import { exerciseLookupService } from '@/services/ExerciseLookupService';
import type { ExerciseDetail, ExerciseSummary } from '@/types/exercise';
import { ExercisePoseMotionPlayer } from '@/components/common/ExercisePoseMotionPlayer';
import { ExerciseProgressChart } from '@/components/analytics/ExerciseProgressChart';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_NAV_PADDING = Platform.OS === 'android' ? 68 : 24;

export interface ExerciseDetailModalProps {
  visible: boolean;
  exerciseSummary: ExerciseSummary | null;
  onClose: () => void;
  onAddToWorkout?: (exercise: ExerciseDetail) => void;
  targetDayName?: string;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  visible,
  exerciseSummary,
  onClose,
  onAddToWorkout,
  targetDayName,
}) => {
  const { language, t, i18n, isHungarian } = useLanguage();
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  const lastSummaryRef = useRef<ExerciseSummary | null>(null);
  if (exerciseSummary) {
    lastSummaryRef.current = exerciseSummary;
  }
  const activeSummary = exerciseSummary || lastSummaryRef.current;

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);
  const sheetHeightRef = useRef(SCREEN_HEIGHT * 0.75);

  useEffect(() => {
    if (visible && exerciseSummary) {
      isDismissing.current = false;
      translateY.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0.25,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, exerciseSummary]);

  const handleDismiss = (onFinished?: (() => void) | unknown) => {
    const callback = typeof onFinished === 'function' ? (onFinished as () => void) : undefined;
    if (isDismissing.current) return;
    isDismissing.current = true;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isDismissing.current = false;
      onClose();
      if (callback) {
        callback();
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = sheetHeightRef.current * 0.5;
        if (gestureState.dy >= threshold || gestureState.vy > 0.75) {
          handleDismiss();
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!exerciseSummary || !visible) {
      setDetail(null);
      setShowFullDesc(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    exerciseRepository
      .getBySlug(exerciseSummary.slug)
      .then((data) => {
        if (isMounted) {
          setDetail(exerciseLookupService.localizeDetail(data));
        }
      })
      .catch((err) => {
        console.error('Error fetching exercise detail:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [exerciseSummary, visible, language]);

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => {
        isDismissing.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if ((!visible && !isDismissing.current) || !activeSummary) {
    return null;
  }

  const name = i18n.translateExerciseTitle(
    detail?.name ?? activeSummary.name,
    detail?.slug ?? activeSummary.slug
  );
  const startImageUrl =
    detail?.images?.start ??
    detail?.images?.main ??
    detail?.image_url ??
    activeSummary.image_url;
  const peakImageUrl = detail?.images?.peak ?? null;

  const getDifficultyLevel = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case 'beginner':
        return 1;
      case 'intermediate':
      case 'medium':
        return 2;
      case 'advanced':
        return 3;
      case 'expert':
        return 4;
      default:
        return 2;
    }
  };

  const rawDifficulty = detail?.difficulty ?? activeSummary.difficulty;
  const diffLevel = getDifficultyLevel(rawDifficulty);
  const localizedDifficulty = i18n.translateDifficulty(rawDifficulty);
  const localizedCategory = i18n.translateCategory(detail?.category ?? activeSummary.category);
  const localizedEquipment = i18n.translateEquipment(
    detail?.equipment?.name ?? activeSummary.equipment?.name
  );

  const primaryMuscleNames =
    detail?.primary_muscles?.map((m) => i18n.translateMuscleName(m.name)).join(', ') ||
    activeSummary.primary_muscles?.map((m) => i18n.translateMuscleName(m.name)).join(', ') ||
    t('library.detail.fullBody');

  const secondaryMuscleNames =
    detail?.secondary_muscles?.map((m) => i18n.translateMuscleName(m.name)).join(', ');

  const allMusclesText = secondaryMuscleNames
    ? `${primaryMuscleNames}, ${secondaryMuscleNames}`
    : primaryMuscleNames;

  const durationText =
    detail?.category === 'cardio'
      ? t('library.detail.durationCardio')
      : t('library.detail.durationDefault');
  const restTimeText =
    rawDifficulty === 'advanced'
      ? t('library.detail.restAdvanced')
      : t('library.detail.restDefault');

  const dayForms = targetDayName ? i18n.getDayForms(targetDayName) : null;
  const addButtonLabel = dayForms
    ? t('library.detail.addToDayRoutine', {
        day: isHungarian ? dayForms.adjectival : dayForms.full,
      })
    : t('library.detail.addToWorkout');

  return (
    <Modal
      visible={visible || isDismissing.current}
      animationType="none"
      transparent
      onRequestClose={() => handleDismiss()}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => handleDismiss()} />
        </Animated.View>

        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) sheetHeightRef.current = h;
          }}
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Felső húzóka lehúzási gesztussal */}
          <View {...panResponder.panHandlers} style={styles.dragHandleWrapper}>
            <View style={styles.dragHandle} />
          </View>

          {/* Fejléc lehúzási gesztussal */}
          <View {...panResponder.panHandlers} style={styles.headerRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {name}
            </Text>
            <Pressable onPress={() => handleDismiss()} hitSlop={12} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Gyakorlat mozgás animáció */}
            <ExercisePoseMotionPlayer
              startImageUrl={startImageUrl}
              peakImageUrl={peakImageUrl}
              exerciseTitle={name}
              height={220}
              cycleDurationMs={2000}
              containerStyle={styles.heroContainer}
            />

            {loading ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator color={Colors.accent.blue} size="small" />
              </View>
            ) : (
              <>
                {/* Leírás kártya */}
                {detail?.description && (
                  <View style={styles.infoCard}>
                    <Text style={styles.sectionHeading}>{t('library.detail.descriptionHeading')}</Text>
                    <Text
                      style={styles.descriptionText}
                      numberOfLines={showFullDesc ? undefined : 2}
                    >
                      {detail.description}
                    </Text>
                    <Pressable
                      onPress={() => setShowFullDesc((prev) => !prev)}
                      style={styles.showMoreButton}
                    >
                      <Text style={styles.showMoreText}>
                        {showFullDesc ? t('library.detail.showLess') : t('library.detail.showMore')}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* Lenyitható részletek kártya */}
                <View style={styles.infoCard}>
                  <Pressable
                    style={styles.cardHeaderRow}
                    onPress={() => setDetailsExpanded((prev) => !prev)}
                  >
                    <View style={styles.accordionHeaderLeft}>
                      <View style={styles.infoIconCircle}>
                        <Text style={styles.infoIconText}>ⓘ</Text>
                      </View>
                      <Text style={styles.accordionTitle}>{t('library.detail.detailsHeading')}</Text>
                    </View>
                    <Text style={styles.chevronText}>
                      {detailsExpanded ? '▲' : '▼'}
                    </Text>
                  </Pressable>

                  {detailsExpanded && (
                    <View style={styles.metricsGrid}>
                      {/* 1. sor: Típus és nehézség */}
                      <View style={styles.metricCell}>
                        <Text style={styles.metricLabel}>{t('library.detail.activityType')}</Text>
                        <Text style={styles.metricValue}>
                          {localizedCategory}
                        </Text>
                      </View>

                      <View style={styles.metricCell}>
                        <View style={styles.difficultyHeaderRow}>
                          <Text style={styles.metricLabel}>{t('library.detail.difficulty')}</Text>
                        </View>
                        <Text
                          style={[
                            styles.metricValue,
                            {
                              color:
                                diffLevel === 1
                                  ? Colors.accent.green
                                  : diffLevel === 2
                                    ? Colors.accent.amber
                                    : Colors.accent.rose,
                            },
                          ]}
                        >
                          {localizedDifficulty} ⓘ
                        </Text>

                        {/* Nehézségi szint jelző */}
                        <View style={styles.difficultyMeter}>
                          <View
                            style={[
                              styles.meterBar,
                              {
                                backgroundColor:
                                  diffLevel >= 1
                                    ? Colors.accent.green
                                    : 'rgba(255,255,255,0.18)',
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.meterBar,
                              {
                                backgroundColor:
                                  diffLevel >= 2
                                    ? Colors.accent.amber
                                    : 'rgba(255,255,255,0.18)',
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.meterBar,
                              {
                                backgroundColor:
                                  diffLevel >= 3
                                    ? Colors.accent.orange
                                    : 'rgba(255,255,255,0.18)',
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.meterBar,
                              {
                                backgroundColor:
                                  diffLevel >= 4
                                    ? Colors.accent.rose
                                    : 'rgba(255,255,255,0.18)',
                              },
                            ]}
                          />
                        </View>
                      </View>

                      {/* 2. sor: Eszköz és izomcsoportok */}
                      <View style={styles.metricCell}>
                        <Text style={styles.metricLabel}>{t('library.detail.equipment')}</Text>
                        <Text style={styles.metricValue}>
                          {localizedEquipment}
                        </Text>
                      </View>

                      <View style={styles.metricCell}>
                        <Text style={styles.metricLabel}>{t('library.detail.muscles')}</Text>
                        <Text style={styles.musclesValue} numberOfLines={3}>
                          {allMusclesText}
                        </Text>
                      </View>

                      {/* 3. sor: Időtartam és pihenőidő */}
                      <View style={styles.metricCell}>
                        <Text style={styles.metricLabel}>{t('library.detail.duration')}</Text>
                        <Text style={styles.metricValue}>{durationText}</Text>
                      </View>

                      <View style={styles.metricCell}>
                        <Text style={styles.metricLabel}>{t('library.detail.restTime')}</Text>
                        <Text style={styles.metricValue}>{restTimeText}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Végrehajtási utasítások */}
                {detail?.instructions && detail.instructions.length > 0 && (
                  <View style={styles.infoCard}>
                    <Text style={styles.sectionHeading}>{t('library.detail.instructionsHeading')}</Text>
                    {detail.instructions.map((step, index) => (
                      <View key={index} style={styles.stepRow}>
                        <View style={styles.stepBadge}>
                          <Text style={styles.stepBadgeText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Egyéni fejlődési diagram */}
                {activeSummary?.slug ? (
                  <View style={styles.chartSectionContainer}>
                    <ExerciseProgressChart
                      slug={activeSummary.slug}
                      exerciseTitle={name}
                    />
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>

          {/* Alsó műveleti gomb */}
          <View style={styles.bottomBar}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => {
                if (detail && onAddToWorkout) {
                  handleDismiss(() => {
                    onAddToWorkout(detail);
                  });
                } else {
                  handleDismiss();
                }
              }}
            >
              <Text style={styles.actionButtonText}>
                {addButtonLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  sheetContainer: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    minHeight: '65%',
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingBottom: 0,
  },
  dragHandleWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  heroContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  loadingWrapper: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: 16,
  },
  chartSectionContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    color: Colors.accent.blue,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accent.blue,
  },
  chevronText: {
    fontSize: 12,
    color: Colors.accent.blue,
    fontWeight: '700',
  },
  difficultyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text.secondary,
  },
  showMoreButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent.blue,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  metricCell: {
    width: '47%',
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  difficultyMeter: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  meterBar: {
    width: 20,
    height: 6,
    borderRadius: 3,
  },
  fullWidthMetric: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    paddingTop: 12,
  },
  musclesValue: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
    borderWidth: 1,
    borderColor: Colors.accent.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent.blue,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: BOTTOM_NAV_PADDING,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  actionButton: {
    backgroundColor: Colors.accent.blue,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    boxShadow: '0 0 4px rgba(74, 184, 248, 0.30)',
  },
  actionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#08101E',
  },
  actionButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
    boxShadow: 'none',
  },
  actionButtonTextDisabled: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alreadyAddedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
    backgroundColor: 'rgba(74, 184, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.20)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  alreadyAddedText: {
    color: Colors.accent.blue,
    fontSize: 12,
    fontWeight: '600',
  },
});
