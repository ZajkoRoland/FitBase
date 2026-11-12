import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActiveFilterChips } from '@/components/library/ActiveFilterChips';
import { ExerciseCard } from '@/components/library/ExerciseCard';
import { ExerciseDetailModal } from '@/components/library/ExerciseDetailModal';
import { ExerciseFilterModal } from '@/components/library/ExerciseFilterModal';
import { LibraryHeader } from '@/components/library/LibraryHeader';
import { SearchBar } from '@/components/library/SearchBar';
import { SectionSelectorHeader } from '@/components/library/SectionSelectorHeader';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import {
  INITIAL_MULTI_FILTER_STATE,
  libraryService,
  type MultiFilterState,
} from '@/services/LibraryService';
import { useRouter } from 'expo-router';
import { usePlan } from '@/context/PlanProvider';
import { Exercise } from '@/services/PlanService';
import type { ExerciseDetail, ExerciseSummary } from '@/types/exercise';

const PAGE_SIZE = 20;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { targetDayIndexForAdd, addExerciseToDay, weekPlan } = usePlan();
  const { language, isHungarian, t, i18n } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<MultiFilterState>(INITIAL_MULTI_FILTER_STATE);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseSummary | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchExercises = useCallback(
    async (offset: number, replace: boolean) => {
      try {
        const bodyPartParam =
          filterState.bodyParts.length > 0 ? filterState.bodyParts.join(',') : undefined;
        const equipmentParam =
          filterState.equipment.length > 0 ? filterState.equipment.join(',') : undefined;
        const difficultyParam =
          filterState.difficulties.length > 0 ? filterState.difficulties.join(',') : undefined;

        const data = await libraryService.getExercises({
          q: searchQuery,
          body_part: bodyPartParam,
          equipment: equipmentParam,
          difficulty: difficultyParam,
          limit: PAGE_SIZE,
          offset,
        });

        setTotal(data.total);
        if (replace) {
          setExercises(data.items);
        } else {
          setExercises((prev) => [...prev, ...data.items]);
        }
      } catch (err) {
        console.error('Error fetching exercises:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, filterState, language]
  );

  useEffect(() => {
    setLoading(true);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchExercises(0, true);
    }, 250);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, filterState, fetchExercises]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExercises(0, true);
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || exercises.length >= total) {
      return;
    }
    setLoadingMore(true);
    fetchExercises(exercises.length, false);
  };

  const handleAddToWorkout = async (detail: ExerciseDetail) => {
    const mappedExercise: Exercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      number: '01',
      title: detail.name,
      details: '3 × 10-12 · 60s rest',
      badgeText: detail.body_part
        ? detail.body_part.replace(/_/g, ' ').toUpperCase()
        : 'GENERAL',
      color: Colors.accent.blue,
      slug: detail.slug,
      met: detail.met,
      description: detail.description ?? undefined,
      instructions: detail.instructions,
      startImageUrl: detail.images?.start,
      peakImageUrl: detail.images?.peak,
    };

    await addExerciseToDay(targetDayIndexForAdd, mappedExercise);
    setSelectedExercise(null);
    router.navigate('/(tabs)/plan');
  };

  const handleToggleFilterModal = () => {
    setShowFilterModal((prev) => !prev);
  };

  const handleRemoveFilterItem = (
    dimension: 'bodyParts' | 'equipment' | 'difficulties',
    value: string
  ) => {
    setFilterState((prev) => ({
      ...prev,
      [dimension]: prev[dimension].filter((x) => x !== value),
    }));
  };

  const handleResetFilters = () => {
    setFilterState(INITIAL_MULTI_FILTER_STATE);
    setSearchQuery('');
  };

  const hasActiveFilters = libraryService.hasAnyFilterActive(filterState, searchQuery);

  const getSectionTitle = () => {
    if (hasActiveFilters) {
      return t('library.sectionFiltered');
    }
    return t('library.sectionDefault');
  };

  const renderExerciseItem = useCallback(
    ({ item }: { item: ExerciseSummary }) => (
      <ExerciseCard exercise={item} onPress={setSelectedExercise} />
    ),
    []
  );

  const dayForms = i18n.getDayForms(weekPlan[targetDayIndexForAdd]?.day || targetDayIndexForAdd);
  const targetDayLabel = isHungarian ? dayForms.adjectival : dayForms.full;

  return (
    <View key={language} style={styles.root}>
      {/* Fejléc és keresőmező */}
      <View style={[styles.topSection, { paddingTop: insets.top + 8 }]}>
        <LibraryHeader
          title={t('library.headerTitle')}
          isFilterActive={showFilterModal}
          hasActiveFilters={hasActiveFilters}
          onFilterPress={handleToggleFilterModal}
        />

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder={t('library.searchPlaceholder')}
          />
        </View>

        <ActiveFilterChips
          filterState={filterState}
          onRemoveItem={handleRemoveFilterItem}
          onClearAll={handleResetFilters}
        />
      </View>

      {/* Rács tartalom */}
      <View style={styles.listContainer}>
        <SectionSelectorHeader
          title={getSectionTitle()}
          isFiltered={hasActiveFilters}
          onClearFilters={handleResetFilters}
          count={total}
        />

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={Colors.accent.blue} size="large" />
          </View>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.slug}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            renderItem={renderExerciseItem}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.accent.blue}
                colors={[Colors.accent.blue]}
              />
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator color={Colors.accent.blue} size="small" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyTitle}>{t('library.emptyTitle')}</Text>
                  <Text style={styles.emptySubtitle}>
                    {t('library.emptySubtitle')}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Gyakorlat részletei modál */}
      <ExerciseDetailModal
        visible={Boolean(selectedExercise)}
        exerciseSummary={selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onAddToWorkout={handleAddToWorkout}
        targetDayName={targetDayLabel}
      />

      {/* Szűrő alsó panel modál */}
      <ExerciseFilterModal
        visible={showFilterModal}
        filters={filterState}
        onChangeFilters={setFilterState}
        onClose={() => setShowFilterModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  topSection: {
    backgroundColor: '#152038',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  searchContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    gap: 12,
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 110,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  footerLoader: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
