import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';

export interface PlanQuickActionModalProps {
  readonly visible: boolean;
  readonly dayName: string;
  readonly dayIndex?: number;
  readonly isRestDay: boolean;
  readonly onClose: () => void;
  readonly onBuildPlan: () => void;
  readonly onAddExercise: () => void;
  readonly onToggleRestDay: () => void;
  readonly onDeleteEntirePlan: () => void;
}

export const PlanQuickActionModal: React.FC<PlanQuickActionModalProps> = ({
  visible,
  dayName,
  dayIndex,
  isRestDay,
  onClose,
  onBuildPlan,
  onAddExercise,
  onToggleRestDay,
  onDeleteEntirePlan,
}) => {
  const { t, i18n, isHungarian } = useLanguage();
  const animValue = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);

  const dayForms = i18n.getDayForms(dayIndex ?? dayName);

  useEffect(() => {
    if (visible) {
      isDismissing.current = false;
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, animValue]);

  const handleDismiss = (callback: () => void) => {
    isDismissing.current = true;
    Animated.timing(animValue, {
      toValue: 0,
      duration: 150,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      isDismissing.current = false;
      callback();
    });
  };

  if (!visible && !isDismissing.current) {
    return null;
  }

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const cardScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
    extrapolate: 'clamp',
  });

  const cardOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      transparent
      visible={visible || isDismissing.current}
      animationType="none"
      onRequestClose={() => handleDismiss(onClose)}
    >
      <View style={styles.overlay}>
        {/* Sötétített háttér */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => handleDismiss(onClose)} />
        </Animated.View>

        {/* Műveleti panel kártya */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Fejlécsor */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>{t('plan.quickActions.title')}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {t('plan.quickActions.subtitle', {
                  day: isHungarian ? dayForms.adjectivalCap : dayForms.full,
                })}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleDismiss(onClose)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={18} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          </View>

          {/* Műveletek listája */}
          <View style={styles.actionsContainer}>
            {/* 1. Teljes edzésterv készítése */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={[styles.actionItem, styles.actionItemHighlight]}
              onPress={() => handleDismiss(onBuildPlan)}
            >
              <View style={[styles.actionIconCircle, styles.actionIconPurple]}>
                <Ionicons name="sparkles" size={20} color="#B57CFF" />
              </View>
              <View style={styles.actionTextGroup}>
                <Text style={[styles.actionTitle, { color: '#E0C8FF' }]}>
                  {t('plan.quickActions.buildFullTitle')}
                </Text>
                <Text style={styles.actionDescription} numberOfLines={1}>
                  {t('plan.quickActions.buildFullDesc')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#B57CFF" />
            </TouchableOpacity>

            {/* 2. Gyakorlat hozzáadása */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.actionItem}
              onPress={() => handleDismiss(onAddExercise)}
            >
              <View style={[styles.actionIconCircle, styles.actionIconBlue]}>
                <Ionicons name="barbell-outline" size={20} color={Colors.accent.blue} />
              </View>
              <View style={styles.actionTextGroup}>
                <Text style={styles.actionTitle}>{t('plan.quickActions.addExerciseTitle')}</Text>
                <Text style={styles.actionDescription} numberOfLines={1}>
                  {t('plan.quickActions.addExerciseDesc', {
                    day: isHungarian ? dayForms.sublative : dayForms.full,
                  })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.3)" />
            </TouchableOpacity>

            {/* 3. Naptípus váltása (edzés / pihenőnap) */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.actionItem}
              onPress={() => handleDismiss(onToggleRestDay)}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  isRestDay ? styles.actionIconBlue : styles.actionIconAmber,
                ]}
              >
                <Ionicons
                  name={isRestDay ? 'fitness-outline' : 'moon-outline'}
                  size={20}
                  color={isRestDay ? Colors.accent.blue : Colors.accent.amber}
                />
              </View>
              <View style={styles.actionTextGroup}>
                <Text style={styles.actionTitle}>
                  {isRestDay
                    ? t('plan.quickActions.switchToWorkoutTitle')
                    : t('plan.quickActions.setAsRestTitle')}
                </Text>
                <Text style={styles.actionDescription} numberOfLines={1}>
                  {isRestDay
                    ? t('plan.quickActions.switchToWorkoutDesc', {
                        day: isHungarian ? dayForms.sublative : dayForms.full,
                      })
                    : t('plan.quickActions.setAsRestDesc', {
                        day: isHungarian ? dayForms.accusative : dayForms.full,
                      })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.3)" />
            </TouchableOpacity>

            {/* 4. Teljes edzésterv törlése */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.actionItem}
              onPress={() => handleDismiss(onDeleteEntirePlan)}
            >
              <View style={[styles.actionIconCircle, styles.actionIconRose]}>
                <Ionicons name="trash-outline" size={20} color={Colors.accent.rose} />
              </View>
              <View style={styles.actionTextGroup}>
                <Text style={[styles.actionTitle, { color: '#FF7373' }]}>
                  {t('plan.quickActions.deleteEntireTitle')}
                </Text>
                <Text style={styles.actionDescription} numberOfLines={1}>
                  {t('plan.quickActions.deleteEntireDesc')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.3)" />
            </TouchableOpacity>
          </View>

          {/* Mégse gomb */}
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.cancelButton}
            onPress={() => handleDismiss(onClose)}
          >
            <Text style={styles.cancelButtonText}>{t('plan.quickActions.cancelBtn')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#152038',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  actionItemHighlight: {
    backgroundColor: 'rgba(181, 124, 255, 0.08)',
    borderColor: 'rgba(181, 124, 255, 0.28)',
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconPurple: {
    backgroundColor: 'rgba(181, 124, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(181, 124, 255, 0.35)',
  },
  actionIconBlue: {
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.25)',
  },
  actionIconAmber: {
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.25)',
  },
  actionIconGreen: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.25)',
  },
  actionIconRose: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
  },
  actionTextGroup: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
