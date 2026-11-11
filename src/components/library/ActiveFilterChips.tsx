import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/context/LanguageProvider';
import {
  libraryService,
  type MultiFilterState,
} from '@/services/LibraryService';

export interface ActiveFilterChipsProps {
  filterState: MultiFilterState;
  onRemoveItem: (dimension: 'bodyParts' | 'equipment' | 'difficulties', value: string) => void;
  onClearAll: () => void;
}

interface ActiveTag {
  id: string;
  dimension: 'bodyParts' | 'equipment' | 'difficulties';
  value: string;
  label: string;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filterState,
  onRemoveItem,
  onClearAll,
}) => {
  const { t } = useLanguage();
  const activeTags: ActiveTag[] = [];

  const bodyPartOptions = libraryService.getLocalizedBodyPartOptions();
  const equipmentOptions = libraryService.getLocalizedEquipmentOptions();
  const difficultyOptions = libraryService.getLocalizedDifficultyOptions();

  filterState.bodyParts.forEach((val) => {
    const label = bodyPartOptions.find((o) => o.value === val)?.label ?? val;
    activeTags.push({
      id: `bp_${val}`,
      dimension: 'bodyParts',
      value: val,
      label,
    });
  });

  filterState.equipment.forEach((val) => {
    const label = equipmentOptions.find((o) => o.value === val)?.label ?? val;
    activeTags.push({
      id: `eq_${val}`,
      dimension: 'equipment',
      value: val,
      label,
    });
  });

  filterState.difficulties.forEach((val) => {
    const label = difficultyOptions.find((o) => o.value === val)?.label ?? val;
    activeTags.push({
      id: `diff_${val}`,
      dimension: 'difficulties',
      value: val,
      label,
    });
  });

  if (activeTags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Scrollable Chips Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollArea}
      >
        {activeTags.map((tag) => (
          <TouchableOpacity
            key={tag.id}
            style={styles.chip}
            onPress={() => onRemoveItem(tag.dimension, tag.value)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Text style={styles.chipText}>{tag.label}</Text>
            <View style={styles.removeIconCircle}>
              <Text style={styles.removeIconText}>✕</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Right Edge: Soft Fade Gradient + Fixed Clear All Button */}
      <View style={styles.rightOverlayContainer} pointerEvents="box-none">
        <LinearGradient
          colors={['rgba(21, 32, 56, 0)', '#152038']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fadeGradient}
          pointerEvents="none"
        />
        <View style={styles.clearButtonBackdrop}>
          <TouchableOpacity
            style={styles.fixedClearButton}
            onPress={onClearAll}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
          >
            <Text style={styles.clearAllText}>{t('library.clearAll')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 4,
    justifyContent: 'center',
  },
  scrollArea: {
    width: '100%',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 88,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIconText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rightOverlayContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fadeGradient: {
    width: 32,
    height: '100%',
  },
  clearButtonBackdrop: {
    backgroundColor: '#152038',
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 4,
    paddingRight: 2,
  },
  fixedClearButton: {
    paddingVertical: 5,
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
