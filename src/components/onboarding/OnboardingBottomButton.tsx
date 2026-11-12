import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface OnboardingBottomButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'final';
}

// Alsó tovább gomb az onboarding folyamatban
export const OnboardingBottomButton: React.FC<OnboardingBottomButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}) => {
  const isFinal = variant === 'final';
  const cleanedTitle = title.replace(/\s*→\s*$/, '').trim();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isFinal ? styles.finalButton : styles.primaryButton,
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color="#08101E" />
      ) : (
        <View style={styles.contentRow}>
          <Text style={[styles.buttonText, isFinal && styles.finalButtonText]}>
            {cleanedTitle}
          </Text>
          {isFinal ? (
            <Ionicons name="arrow-forward" size={18} color="#06140D" />
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
  },
  finalButton: {
    backgroundColor: Colors.accent.green,
  },
  disabledButton: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '800',
    color: '#08101E',
    letterSpacing: -0.1,
  },
  finalButtonText: {
    color: '#06140D',
  },
});
