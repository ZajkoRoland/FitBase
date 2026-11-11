import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import type { FilterOptionItem } from '@/services/LibraryService';

export interface CategoryFilterProps {
  options: readonly FilterOptionItem[];
  selectedValue: string;
  onSelectOption: (value: string) => void;
}

/**
 * CategoryFilter
 *
 * Horizontal scrolling pill row for selecting filter values within
 * the currently active dimension (Chest, Dumbbell, Beginner).
 * Uses high-contrast minimalist white outlines for selected pills.
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  options,
  selectedValue,
  onSelectOption,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((item) => {
          const isSelected = item.value === selectedValue;
          return (
            <TouchableOpacity
              key={item.value}
              onPress={() => onSelectOption(item.value)}
              style={[
                styles.pill,
                isSelected ? styles.pillSelected : styles.pillUnselected,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextSelected : styles.pillTextUnselected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
  },
  scrollContent: {
    gap: 10,
    paddingRight: 20,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
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
