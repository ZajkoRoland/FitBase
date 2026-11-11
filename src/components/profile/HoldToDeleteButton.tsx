import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface HoldToDeleteButtonProps {
  /** Callback fired ONLY after user holds continuously for the full duration */
  readonly onTriggerDelete: () => void | Promise<void>;
  /** Loading state during network deletion call */
  readonly loading?: boolean;
  /** Duration in milliseconds required to hold (default: 3000ms = 3 seconds) */
  readonly holdDurationMs?: number;
  /** Disabled state */
  readonly disabled?: boolean;
}

/**
 * HoldToDeleteButton
 *
 * Senior React Native pattern for high-stakes, irreversible destructive actions.
 * Prevents accidental account deletions by requiring a continuous hold (3 seconds).
 */
export const HoldToDeleteButton: React.FC<HoldToDeleteButtonProps> = ({
  onTriggerDelete,
  loading = false,
  holdDurationMs = 3000,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const [isHolding, setIsHolding] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;

    setIsHolding(true);

    // Subtle scale feedback on press
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: false,
    }).start();

    // Start 3-second linear progress fill
    progress.setValue(0);
    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: holdDurationMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animRef.current.start(({ finished }) => {
      if (finished) {
        setIsHolding(false);
        onTriggerDelete();
      }
    });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    setIsHolding(false);

    // Restore button scale
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: false,
    }).start();

    // Abort active animation immediately
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }

    // Quick snap-back reset to 0%
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={styles.container}
        accessibilityRole="button"
        accessibilityLabel={t('profile.deleteAccount.holdA11yLabel')}
        accessibilityHint={t('profile.deleteAccount.holdA11yHint')}
      >
        {/* Animated Fill Bar from Left to Right */}
        <Animated.View style={[styles.progressFill, { width: fillWidth }]} />

        {/* Foreground Content */}
        <View style={styles.contentRow}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={isHolding ? 'alert-circle' : 'trash-outline'}
                size={16}
                color="#FFFFFF"
                style={styles.btnIcon}
              />
              <Text style={styles.btnText}>
                {isHolding
                  ? t('profile.deleteAccount.holdBtnActive')
                  : t('profile.deleteAccount.holdBtnIdle')}
              </Text>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1.4,
    alignSelf: 'stretch',
  },
  container: {
    flexGrow: 1,
    minHeight: 56,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 82, 82, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.45)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FF5252',
    borderRadius: 12,
  },
  contentRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    zIndex: 1,
    paddingHorizontal: 12,
  },
  btnIcon: {
    flexShrink: 0,
  },
  btnText: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
