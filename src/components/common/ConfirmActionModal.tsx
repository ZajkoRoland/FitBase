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
import { HoldToDeleteButton } from '@/components/profile/HoldToDeleteButton';

export interface ConfirmActionModalProps {
  /** Visibility state of the modal */
  readonly visible: boolean;
  /** Modal headline (e.g. "Remove Exercise?") */
  readonly title: string;
  /** Explanatory description */
  readonly description?: string;
  /** Item name highlighted in a central pill */
  readonly highlightItemName?: string;
  /** Text for confirmation action button (default: "Remove") */
  readonly confirmText?: string;
  /** Text for cancel action button (default: "Keep Exercise") */
  readonly cancelText?: string;
  /** Is this a destructive action (renders in danger red) */
  readonly isDestructive?: boolean;
  /** Requires holding the button for 3 seconds to confirm high-stakes deletion */
  readonly requireHoldToConfirm?: boolean;
  /** Duration in ms to hold when requireHoldToConfirm is true (default: 3000) */
  readonly holdDurationMs?: number;
  /** Optional icon name from Ionicons (default: "trash-outline") */
  readonly iconName?: keyof typeof Ionicons.glyphMap;
  /** Optional custom backdrop background color (default: 'rgba(0, 0, 0, 0.45)') */
  readonly backdropColor?: string;
  /** Optional custom card background color (default: '#152038') */
  readonly cardBackgroundColor?: string;
  /** Confirm callback */
  readonly onConfirm: () => void;
  /** Cancel / dismiss callback */
  readonly onCancel: () => void;
}

/**
 * ConfirmActionModal
 *
 * Fully styled, theme-compliant confirmation dialog replacing ugly native OS Alert.alert.
 * - Glassmorphic dark card (`#152038`) matching Fitbase design
 * - Smooth cubic ease-out entrance and exit animation without flickering
 * - Soft tinted warning icon pill
 * - Clear action hierarchy: secondary dismiss & prominent primary confirmation
 * - Configurable backdrop overlay color and opacity
 */
export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  visible,
  title,
  description,
  highlightItemName,
  confirmText,
  cancelText,
  isDestructive = true,
  requireHoldToConfirm = false,
  holdDurationMs = 3000,
  iconName = 'trash-outline',
  backdropColor,
  cardBackgroundColor,
  onConfirm,
  onCancel,
}) => {
  const { t } = useLanguage();
  const displayDescription = description ?? t('common.confirmActionDefault');
  const displayConfirmText = confirmText ?? t('common.remove');
  const displayCancelText = cancelText ?? t('common.cancel');

  const animValue = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);

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
      onRequestClose={() => handleDismiss(onCancel)}
    >
      <View style={styles.overlay}>
        {/* Animated backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            backdropColor ? { backgroundColor: backdropColor } : null,
            { opacity: backdropOpacity },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => handleDismiss(onCancel)}
          />
        </Animated.View>

        {/* Animated dialog card */}
        <Animated.View
          style={[
            styles.card,
            cardBackgroundColor ? { backgroundColor: cardBackgroundColor } : null,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              isDestructive ? styles.iconCircleDestructive : styles.iconCircleNeutral,
            ]}
          >
            <Ionicons
              name={iconName}
              size={26}
              color={isDestructive ? '#FF5252' : Colors.accent.blue}
            />
          </View>

          <Text style={styles.title}>{title}</Text>

          {displayDescription ? <Text style={styles.description}>{displayDescription}</Text> : null}

          {/* Highlighted item pill */}
          {highlightItemName ? (
            <View style={styles.itemPill}>
              <Text style={styles.itemPillText} numberOfLines={1}>
                {highlightItemName}
              </Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.cancelButton}
              onPress={() => handleDismiss(onCancel)}
            >
              <Text style={styles.cancelButtonText}>{displayCancelText}</Text>
            </TouchableOpacity>

            {/* Confirm button */}
            {requireHoldToConfirm ? (
              <HoldToDeleteButton
                onTriggerDelete={() => handleDismiss(onConfirm)}
                holdDurationMs={holdDurationMs}
              />
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.confirmButton,
                  isDestructive ? styles.confirmButtonDestructive : styles.confirmButtonNeutral,
                ]}
                onPress={() => handleDismiss(onConfirm)}
              >
                <Text style={styles.confirmButtonText}>{displayConfirmText}</Text>
              </TouchableOpacity>
            )}
          </View>
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
    paddingHorizontal: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.20)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#152038',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconCircleDestructive: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.28)',
  },
  iconCircleNeutral: {
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.28)',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  itemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginBottom: 20,
    maxWidth: '95%',
  },
  itemPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    minHeight: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDestructive: {
    backgroundColor: '#FF4B4B',
  },
  confirmButtonNeutral: {
    backgroundColor: Colors.accent.blue,
    shadowColor: Colors.accent.blue,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
