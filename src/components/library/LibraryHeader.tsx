import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FilterIcon } from '@/components/icons/FilterIcon';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';

export interface LibraryHeaderProps {
  title?: string;
  isFilterActive?: boolean;
  hasActiveFilters?: boolean;
  onFilterPress?: () => void;
}

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  title,
  isFilterActive = false,
  hasActiveFilters = false,
  onFilterPress,
}) => {
  const { t } = useLanguage();
  const displayTitle = title ?? t('library.headerTitle');

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.title} numberOfLines={1}>
        {displayTitle}
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.filterCircle,
          isFilterActive ? styles.filterCircleActive : styles.filterCircleInactive,
          pressed && styles.buttonPressed,
        ]}
        onPress={onFilterPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={t('library.toggleFilterA11y')}
      >
        <FilterIcon
          size={18}
          color={isFilterActive ? Colors.text.primary : Colors.text.secondary}
          strokeWidth={2.2}
        />

        {hasActiveFilters && <View style={styles.activeDot} />}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    minHeight: 44,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  filterCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 38,
    minHeight: 38,
    position: 'relative',
  },
  filterCircleInactive: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  filterCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: '#FFFFFF',
  },
  activeDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    aspectRatio: 1,
    alignSelf: 'flex-start',
    flexShrink: 0,
    flexGrow: 0,
    overflow: 'hidden',
  },
});
