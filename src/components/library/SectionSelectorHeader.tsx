import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';

export interface SectionSelectorHeaderProps {
  title?: string;
  selectedCategory?: string;
  isFiltered?: boolean;
  onClearFilters?: () => void;
  count?: number;
}

export const SectionSelectorHeader: React.FC<SectionSelectorHeaderProps> = ({
  title,
  selectedCategory,
  isFiltered: explicitFiltered,
  count,
}) => {
  const { t, i18n } = useLanguage();
  const displayTitle = title ?? t('library.sectionDefault');
  const isFiltered =
    explicitFiltered ?? Boolean(selectedCategory && selectedCategory !== 'All');

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <Text style={[styles.title, isFiltered && styles.titleFiltered]} numberOfLines={1}>
          {displayTitle}
        </Text>
      </View>

      <View style={styles.rightArea}>
        {typeof count === 'number' && (
          <Text style={styles.countText}>{i18n.formatExerciseCount(count)}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 0.8,
  },
  titleFiltered: {
    color: Colors.text.primary,
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.ghost,
  },
});
