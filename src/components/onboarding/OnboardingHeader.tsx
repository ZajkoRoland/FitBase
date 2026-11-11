import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { PulseIcon } from '@/components/icons/PulseIcon';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  backLabel?: string;
}

/**
 * OnboardingHeader
 * Matches the FitBase onboarding reference layout:
 * - Centered circular pulse badge + FitBase wordmark (with optional left-anchored back button)
 * - Uppercase tracked step counter
 * - Full-width slim progress bar aligned with screen content margins
 */
export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  currentStep,
  totalSteps,
  onBack,
  backLabel = 'Back',
}) => {
  const progressAnim = useRef(new Animated.Value(currentStep / totalSteps)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / totalSteps,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {currentStep > 1 && onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <PulseIcon size={17} color="#38BDF8" strokeWidth={2} />
          </View>
          <Text style={styles.brandTitle}>FitBase</Text>
        </View>
      </View>

      <Text style={styles.stepText}>{`STEP ${currentStep} / ${totalSteps}`}</Text>

      <View style={styles.trackBackground}>
        <Animated.View style={[styles.trackFill, { width: progressWidth }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 14,
  },
  topRow: {
    width: '100%',
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111C30',
    borderWidth: 1,
    borderColor: '#1E2E4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F1A2E',
    borderWidth: 1.2,
    borderColor: '#1E3252',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  stepText: {
    fontFamily: 'Inter',
    fontSize: 10.5,
    fontWeight: '600',
    color: '#4E6280',
    letterSpacing: 2.2,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  trackBackground: {
    width: '100%',
    height: 2.5,
    backgroundColor: '#162238',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#56CCF2',
    borderRadius: 2,
  },
});
