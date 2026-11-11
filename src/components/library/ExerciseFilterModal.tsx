import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import {
  INITIAL_MULTI_FILTER_STATE,
  libraryService,
  type FilterOptionItem,
  type MultiFilterState,
} from '@/services/LibraryService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ExerciseFilterModalProps {
  visible: boolean;
  filters: MultiFilterState;
  onChangeFilters: (newFilters: MultiFilterState) => void;
  onClose: () => void;
}

export const ExerciseFilterModal: React.FC<ExerciseFilterModalProps> = ({
  visible,
  filters,
  onChangeFilters,
  onClose,
}) => {
  const { t } = useLanguage();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);
  const sheetHeightRef = useRef(SCREEN_HEIGHT * 0.75);

  useEffect(() => {
    if (visible) {
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
          toValue: 0.5,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropAnim]);

  const handleDismiss = () => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 240,
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
    });
  };

  const handleResetAll = () => {
    onChangeFilters(INITIAL_MULTI_FILTER_STATE);
  };

  const hasAnyActiveFilters =
    filters.bodyParts.length > 0 ||
    filters.equipment.length > 0 ||
    filters.difficulties.length > 0;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = sheetHeightRef.current * 0.45;
        if (gestureState.dy > threshold || gestureState.vy > 1.2) {
          handleDismiss();
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => {
        isDismissing.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible && !isDismissing.current) {
    return null;
  }

  const bodyPartOptions = libraryService.getLocalizedBodyPartOptions();
  const equipmentOptions = libraryService.getLocalizedEquipmentOptions();
  const difficultyOptions = libraryService.getLocalizedDifficultyOptions();

  const renderSection = (
    title: string,
    options: readonly FilterOptionItem[],
    selectedValues: readonly string[],
    onToggle: (val: string) => void
  ) => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.pillsWrap}>
          {options.map((opt) => {
            const isAllPill = opt.value === 'all';
            const isSelected = isAllPill
              ? selectedValues.length === 0
              : selectedValues.includes(opt.value);

            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.pill,
                  isSelected ? styles.pillSelected : styles.pillUnselected,
                ]}
                onPress={() => onToggle(opt.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pillText,
                    isSelected ? styles.pillTextSelected : styles.pillTextUnselected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={styles.backdropPressable} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY }] }]}
          onLayout={(e) => {
            sheetHeightRef.current = e.nativeEvent.layout.height;
          }}
        >
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handleBar} />
          </View>

          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>{t('library.filtersTitle')}</Text>
            <View style={styles.headerActions}>
              {hasAnyActiveFilters && (
                <TouchableOpacity
                  onPress={handleResetAll}
                  style={styles.resetButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.resetButtonText}>{t('library.resetAll')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleDismiss}
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderSection(
              t('library.filterBodyPart'),
              bodyPartOptions,
              filters.bodyParts,
              (val) => {
                const next = libraryService.toggleFilterItem(filters.bodyParts, val);
                onChangeFilters({ ...filters, bodyParts: next });
              }
            )}

            {renderSection(
              t('library.filterEquipment'),
              equipmentOptions,
              filters.equipment,
              (val) => {
                const next = libraryService.toggleFilterItem(filters.equipment, val);
                onChangeFilters({ ...filters, equipment: next });
              }
            )}

            {renderSection(
              t('library.filterDifficulty'),
              difficultyOptions,
              filters.difficulties,
              (val) => {
                const next = libraryService.toggleFilterItem(filters.difficulties, val);
                onChangeFilters({ ...filters, difficulties: next });
              }
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#152038',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  handleContainer: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A4866',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent.blue,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8896A5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  pillUnselected: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pillTextUnselected: {
    color: '#8896A5',
  },
});
