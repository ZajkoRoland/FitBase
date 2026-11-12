import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import type { FilterDimension } from '@/services/LibraryService';

export interface FilterDimensionItem {
  readonly key: FilterDimension;
  readonly label: string;
}

export interface FilterDimensionBarProps {
  dimensions: readonly FilterDimensionItem[];
  activeDimension: FilterDimension;
  onSelectDimension: (dimension: FilterDimension) => void;
  isDimensionFiltered: (dimension: FilterDimension) => boolean;
}

// Szűrősáv: kategóriák (izomcsoport, eszköz, nehézség) közötti váltáshoz
export const FilterDimensionBar: React.FC<FilterDimensionBarProps> = ({
  dimensions,
  activeDimension,
  onSelectDimension,
  isDimensionFiltered,
}) => {
  return (
    <View style={styles.container}>
      {dimensions.map((dim) => {
        const isSelected = dim.key === activeDimension;
        const hasActiveFilter = isDimensionFiltered(dim.key);

        return (
          <TouchableOpacity
            key={dim.key}
            onPress={() => onSelectDimension(dim.key)}
            style={[styles.tab, isSelected && styles.tabSelected]}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                {dim.label}
              </Text>
              {hasActiveFilter && <View style={styles.activeDot} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabSelected: {
    borderBottomColor: '#FFFFFF',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8896A5',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  tabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.blue,
  },
});
