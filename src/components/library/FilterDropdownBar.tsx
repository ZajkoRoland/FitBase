import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { Colors } from '@/constants/Colors';
import {
  BODY_PART_OPTIONS,
  DIFFICULTY_OPTIONS,
  EQUIPMENT_OPTIONS,
  type ActiveFilterState,
  type FilterDimension,
  type MultiFilterState,
} from '@/services/LibraryService';

export interface FilterDropdownBarProps {
  filterState: MultiFilterState;
  onOpenPicker: (dimension: FilterDimension) => void;
  onClearDimension: (dimension: FilterDimension) => void;
}

interface ChipConfig {
  key: FilterDimension;
  title: string;
  activeLabel: string | null;
}

/**
 * FilterDropdownBar
 *
 * Implements the Spotify/Airbnb-style single-row dropdown filter chips:
 * - Direct, compact row under the search bar
 * - Displays active value inside the chip (e.g. "Equipment: Dumbbell")
 * - High-contrast white border when active, with ✕ quick-clear button
 */
export const FilterDropdownBar: React.FC<FilterDropdownBarProps> = ({
  filterState,
  onOpenPicker,
  onClearDimension,
}) => {
  const chips: ChipConfig[] = [
    {
      key: 'body_part',
      title: 'Body Part',
      activeLabel:
        filterState.bodyParts.length > 0
          ? `${filterState.bodyParts.length} selected`
          : null,
    },
    {
      key: 'equipment',
      title: 'Equipment',
      activeLabel:
        filterState.equipment.length > 0
          ? `${filterState.equipment.length} selected`
          : null,
    },
    {
      key: 'difficulty',
      title: 'Difficulty',
      activeLabel:
        filterState.difficulties.length > 0
          ? `${filterState.difficulties.length} selected`
          : null,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chips.map((chip) => {
          const isActive = chip.activeLabel !== null;

          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
              onPress={() => onOpenPicker(chip.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {isActive ? `${chip.title}: ${chip.activeLabel}` : chip.title}
              </Text>

              {isActive ? (
                <TouchableOpacity
                  style={styles.clearHitBox}
                  onPress={() => {
                    onClearDimension(chip.key);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                >
                  <Text style={styles.clearIconText}>✕</Text>
                </TouchableOpacity>
              ) : (
                <ChevronDownIcon size={13} color="#8896A5" strokeWidth={2.4} />
              )}
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
    gap: 8,
    paddingRight: 20,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  chipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8896A5',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  clearHitBox: {
    marginLeft: 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIconText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text.ghost,
  },
});
