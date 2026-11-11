import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OnboardingUnitToggleProps<T extends string> {
  options: [T, T];
  selected: T;
  onSelect: (option: T) => void;
  accentColor?: string;
}

/**
 * OnboardingUnitToggle
 * Segmented capsule switcher (e.g. cm/ft, kg/lbs) matching the FitBase reference design.
 */
export function OnboardingUnitToggle<T extends string>({
  options,
  selected,
  onSelect,
  accentColor = '#4FC3F7',
}: OnboardingUnitToggleProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionPill,
              isActive && { backgroundColor: accentColor },
            ]}
            onPress={() => onSelect(option)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.optionText,
                isActive ? styles.optionTextActive : styles.optionTextInactive,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#0E1628',
    borderRadius: 22,
    padding: 4,
    borderWidth: 1.2,
    borderColor: '#1C2C47',
  },
  optionPill: {
    height: 32,
    paddingHorizontal: 18,
    borderRadius: 18,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: 13,
  },
  optionTextActive: {
    color: '#08101E',
    fontWeight: '800',
  },
  optionTextInactive: {
    color: '#647792',
    fontWeight: '600',
  },
});
