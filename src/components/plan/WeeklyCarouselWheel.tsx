import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLanguage } from '@/context/LanguageProvider';
import { WorkoutDay, PlanService } from '@/services/PlanService';
import { DateHelper } from '@/utils/DateHelper';
import { WeeklyDayCard } from './WeeklyDayCard';
import { WorkoutSessionItem } from '@/types/profile';
import { Colors } from '@/constants/Colors';

export const CARD_WIDTH = 86;
export const CARD_GAP = 6;
export const ITEM_TOTAL_WIDTH = CARD_WIDTH + CARD_GAP; // 92px

const WEEKS_PAST = 6;
const WEEKS_FUTURE = 6;
const TOTAL_WEEKS = WEEKS_PAST + 1 + WEEKS_FUTURE;
const ANCHOR_WEEK_INDEX = WEEKS_PAST;

export interface WheelItem {
  key: string;
  flatIndex: number;
  dayIndex: number;
  workout: WorkoutDay;
  dayName: string;
  dayNum: number;
  date: Date;
  isToday: boolean;
}

export interface WeeklyCarouselWheelProps {
  readonly weekPlan: WorkoutDay[];
  readonly currentDate?: Date;
  readonly activeDayIndex: number;
  readonly onSelectDay: (index: number) => void;
  readonly onDateChange?: (date: Date) => void;
  readonly onWeekChange?: (weekMonday: Date) => void;
  readonly historicalSessions?: Record<string, WorkoutSessionItem>;
}

interface WheelCardItemProps {
  item: WheelItem;
  index: number;
  scrollX: Animated.Value;
  isSelected: boolean;
  onPress: (index: number) => void;
}

const WheelCardItem: React.FC<WheelCardItemProps> = ({
  item,
  index,
  scrollX,
  isSelected,
  onPress,
}) => {
  const animatedStyle = useMemo(() => {
    const inputRange = [
      (index - 2) * ITEM_TOTAL_WIDTH,
      (index - 1) * ITEM_TOTAL_WIDTH,
      index * ITEM_TOTAL_WIDTH,
      (index + 1) * ITEM_TOTAL_WIDTH,
      (index + 2) * ITEM_TOTAL_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.95, 0.98, 1.05, 0.98, 0.95],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.65, 0.85, 1.0, 0.85, 0.65],
      extrapolate: 'clamp',
    });

    const rotateY = scrollX.interpolate({
      inputRange,
      outputRange: ['8deg', '4deg', '0deg', '-4deg', '-8deg'],
      extrapolate: 'clamp',
    });

    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [-2, 0, 0, 0, 2],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [2.5, 1, 0, 1, 2.5],
      extrapolate: 'clamp',
    });

    return {
      opacity,
      transform: [
        { perspective: 800 },
        { scale },
        { rotateY },
        { translateX },
        { translateY },
      ],
    };
  }, [scrollX, index]);

  const handlePress = useCallback(() => {
    onPress(index);
  }, [onPress, index]);

  return (
    <Animated.View style={[styles.itemWrapper, animatedStyle]}>
      <WeeklyDayCard
        item={item.workout}
        dayNum={item.dayNum}
        dayLetter={item.dayName}
        isToday={item.isToday}
        isSelected={isSelected}
        onPress={handlePress}
        style={styles.cardWidth}
      />
    </Animated.View>
  );
};

export function WeeklyCarouselWheel({
  weekPlan,
  currentDate,
  activeDayIndex,
  onSelectDay,
  onDateChange,
  onWeekChange,
  historicalSessions,
}: WeeklyCarouselWheelProps): React.JSX.Element {
  const { language, isHungarian } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const flatListRef = useRef<FlatList<WheelItem>>(null);
  const sidePadding = Math.max(0, (windowWidth - CARD_WIDTH) / 2);

  const today = useMemo(() => new Date(), []);
  const anchorMonday = useMemo(() => DateHelper.getMonday(new Date()), []);

  const todayDayOfWeek = today.getDay();
  const todayDayIndex = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
  const todayFlatIndex = ANCHOR_WEEK_INDEX * 7 + todayDayIndex;

  const wheelItems = useMemo<WheelItem[]>(() => {
    if (!weekPlan || weekPlan.length === 0) return [];
    const localizedShortDays = DateHelper.getLocalizedShortDays();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const items: WheelItem[] = [];
    for (let w = 0; w < TOTAL_WEEKS; w++) {
      const weekOffset = w - ANCHOR_WEEK_INDEX;
      for (let d = 0; d < 7; d++) {
        const flatIndex = w * 7 + d;
        const offsetDays = weekOffset * 7 + d;
        const itemDate = new Date(anchorMonday);
        itemDate.setDate(anchorMonday.getDate() + offsetDays);

        const itemDateKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
        const isPast = itemDateKey < todayKey;

        let workout = weekPlan[d] || weekPlan[0];
        if (isPast) {
          const hist = historicalSessions?.[itemDateKey];
          if (hist) {
            workout = {
              day: PlanService.DAY_NAMES[d] || 'Mon',
              type: 'workout',
              workoutTitle: hist.workout_title || (isHungarian ? 'Edzés' : 'Workout'),
              subtitle: isHungarian ? 'Elvégezve' : 'Completed',
              exercises: Array.from(
                { length: hist.exercises_completed || hist.exercise_details?.length || 1 },
                () => ({
                  id: 'hist',
                  number: '01',
                  title: '',
                  details: '',
                  badgeText: isHungarian ? 'ELVÉGEZVE' : 'COMPLETED',
                  color: Colors.accent.green,
                })
              ),
            };
          } else {
            workout = {
              day: PlanService.DAY_NAMES[d] || 'Mon',
              type: 'rest',
              workoutTitle: isHungarian ? 'Pihenőnap' : 'Rest Day',
              subtitle: isHungarian ? 'Pihenőnap' : 'Rest Day',
              exercises: [],
            };
          }
        }

        const dayName = localizedShortDays[d];
        const dayNum = itemDate.getDate();
        const isToday = DateHelper.isSameDay(itemDate, today);

        items.push({
          key: `wheel-${itemDate.getFullYear()}-${itemDate.getMonth() + 1}-${itemDate.getDate()}`,
          flatIndex,
          dayIndex: d,
          workout,
          dayName,
          dayNum,
          date: itemDate,
          isToday,
        });
      }
    }
    return items;
  }, [weekPlan, anchorMonday, today, language, isHungarian, historicalSessions]);

  const initialIndex = useMemo(() => {
    if (currentDate) {
      const idx = wheelItems.findIndex((item) => DateHelper.isSameDay(item.date, currentDate));
      if (idx !== -1) return idx;
    }
    return todayFlatIndex;
  }, [wheelItems, currentDate, todayFlatIndex]);

  const initialIndexRef = useRef<number>(initialIndex);
  initialIndexRef.current = initialIndex;

  const scrollX = useRef(new Animated.Value(initialIndex * ITEM_TOTAL_WIDTH)).current;
  const isInteractingRef = useRef<boolean>(false);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentFlatIndexRef = useRef<number>(initialIndex);
  const lastReportedWeekMondayRef = useRef<number>(anchorMonday.getTime());
  const lastWeekThrottleTimeRef = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialIndex * ITEM_TOTAL_WIDTH,
        animated: false,
      });
    }, 40);

    return () => {
      clearTimeout(timer);
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
    };
  }, []);

  const scrollToCard = useCallback((index: number, animated = true) => {
    isProgrammaticScrollRef.current = true;
    currentFlatIndexRef.current = index;
    if (programmaticTimerRef.current) {
      clearTimeout(programmaticTimerRef.current);
    }
    flatListRef.current?.scrollToOffset({
      offset: index * ITEM_TOTAL_WIDTH,
      animated,
    });
    programmaticTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 450);
  }, []);

  const lastSyncedDateRef = useRef<number | null>(null);

  useEffect(() => {
    if (isInteractingRef.current) return;
    if (!currentDate) return;

    const currentDateTime = currentDate.getTime();
    if (lastSyncedDateRef.current === currentDateTime) return;
    lastSyncedDateRef.current = currentDateTime;

    const targetIndex = wheelItems.findIndex((item) =>
      DateHelper.isSameDay(item.date, currentDate)
    );

    if (targetIndex !== -1 && targetIndex !== currentFlatIndexRef.current) {
      const targetItem = wheelItems[targetIndex];
      if (targetItem) {
        const itemMonday = DateHelper.getMonday(targetItem.date);
        lastReportedWeekMondayRef.current = itemMonday.getTime();
        onWeekChange?.(itemMonday);
      }
      scrollToCard(targetIndex, true);
    }
  }, [currentDate, wheelItems, onWeekChange, scrollToCard]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isProgrammaticScrollRef.current) return;

    const offsetX = e.nativeEvent.contentOffset.x;
    const nearestFlat = Math.round(offsetX / ITEM_TOTAL_WIDTH);
    const clampedFlat = Math.max(0, Math.min(wheelItems.length - 1, nearestFlat));

    currentFlatIndexRef.current = clampedFlat;

    const targetItem = wheelItems[clampedFlat];
    if (targetItem) {
      const itemMonday = DateHelper.getMonday(targetItem.date);
      const itemMondayTime = itemMonday.getTime();
      if (itemMondayTime !== lastReportedWeekMondayRef.current) {
        const now = Date.now();
        if (now - lastWeekThrottleTimeRef.current > 120) {
          lastWeekThrottleTimeRef.current = now;
          lastReportedWeekMondayRef.current = itemMondayTime;
          onWeekChange?.(itemMonday);
        }
      }
    }
  };

  const snapToNearest = (offsetX: number) => {
    const nearestFlat = Math.round(offsetX / ITEM_TOTAL_WIDTH);
    const clampedFlat = Math.max(0, Math.min(wheelItems.length - 1, nearestFlat));
    const targetOffset = clampedFlat * ITEM_TOTAL_WIDTH;
    const targetItem = wheelItems[clampedFlat];

    currentFlatIndexRef.current = clampedFlat;

    if (Math.abs(offsetX - targetOffset) > 1) {
      isProgrammaticScrollRef.current = true;
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
      programmaticTimerRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 350);

      flatListRef.current?.scrollToOffset({
        offset: targetOffset,
        animated: true,
      });
    }

    if (targetItem) {
      const itemMonday = DateHelper.getMonday(targetItem.date);
      lastReportedWeekMondayRef.current = itemMonday.getTime();
      onWeekChange?.(itemMonday);
      onSelectDay(targetItem.dayIndex);
      onDateChange?.(targetItem.date);
    }
  };

  const handleScrollBeginDrag = () => {
    if (programmaticTimerRef.current) {
      clearTimeout(programmaticTimerRef.current);
    }
    isProgrammaticScrollRef.current = false;
    isInteractingRef.current = true;
  };

  const handleMomentumScrollBegin = () => {
    if (isProgrammaticScrollRef.current) return;
    isInteractingRef.current = true;
  };

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isProgrammaticScrollRef.current) return;
    const velocity = e.nativeEvent.velocity?.x ?? 0;
    if (Math.abs(velocity) < 0.1) {
      isInteractingRef.current = false;
      snapToNearest(e.nativeEvent.contentOffset.x);
    }
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
      return;
    }
    isInteractingRef.current = false;
    snapToNearest(e.nativeEvent.contentOffset.x);
  };

  const handleCardPress = useCallback(
    (flatIndex: number) => {
      const item = wheelItems[flatIndex];
      if (!item) return;

      isInteractingRef.current = false;
      const itemMonday = DateHelper.getMonday(item.date);
      lastReportedWeekMondayRef.current = itemMonday.getTime();
      onWeekChange?.(itemMonday);
      scrollToCard(flatIndex, true);
      onSelectDay(item.dayIndex);
      onDateChange?.(item.date);
    },
    [wheelItems, onWeekChange, scrollToCard, onSelectDay, onDateChange]
  );

  const activeDate = currentDate || today;

  const renderItem = useCallback(
    ({ item, index }: { item: WheelItem; index: number }) => {
      const isSelected = DateHelper.isSameDay(item.date, activeDate);
      return (
        <WheelCardItem
          item={item}
          index={index}
          scrollX={scrollX}
          isSelected={isSelected}
          onPress={handleCardPress}
        />
      );
    },
    [activeDate, scrollX, handleCardPress]
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={wheelItems}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        initialScrollIndex={initialIndexRef.current}
        initialNumToRender={7}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingLeft: sidePadding,
            paddingRight: sidePadding,
          },
        ]}
        decelerationRate="normal"
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: true,
            listener: handleScroll,
          }
        )}
        getItemLayout={(_, index) => ({
          length: ITEM_TOTAL_WIDTH,
          offset: ITEM_TOTAL_WIDTH * index,
          index,
        })}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10,
    overflow: 'visible',
  },
  listContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWidth: {
    width: CARD_WIDTH,
  },
});
