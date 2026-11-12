import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Görgős választó komponens magassági és térközei
const ITEM_HEIGHT = 56;
const VISIBLE_COUNT = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const SIDE_PADDING = ITEM_HEIGHT * 2;

interface OnboardingWheelPickerProps {
  min: number;
  max: number;
  value: number;
  onValueChange: (val: number) => void;
  step?: number;
  unitLabel?: string;
  activeTextColor?: string;
  formatValue?: (val: number) => string;
}

interface WheelItemProps {
  index: number;
  label: string;
  scrollY: Animated.Value;
  activeTextColor: string;
  onPress: (index: number) => void;
}

const WheelItem = memo<WheelItemProps>(
  ({ index, label, scrollY, activeTextColor, onPress }) => {
    const center = index * ITEM_HEIGHT;

    const scale = scrollY.interpolate({
      inputRange: [
        center - ITEM_HEIGHT * 3,
        center - ITEM_HEIGHT * 2,
        center - ITEM_HEIGHT,
        center,
        center + ITEM_HEIGHT,
        center + ITEM_HEIGHT * 2,
        center + ITEM_HEIGHT * 3,
      ],
      outputRange: [0.46, 0.5, 0.66, 1, 0.66, 0.5, 0.46],
      extrapolate: 'clamp',
    });

    const opacity = scrollY.interpolate({
      inputRange: [
        center - ITEM_HEIGHT * 2.6,
        center - ITEM_HEIGHT * 2,
        center - ITEM_HEIGHT,
        center - ITEM_HEIGHT * 0.35,
        center,
        center + ITEM_HEIGHT * 0.35,
        center + ITEM_HEIGHT,
        center + ITEM_HEIGHT * 2,
        center + ITEM_HEIGHT * 2.6,
      ],
      outputRange: [0, 0.14, 0.38, 0.88, 1, 0.88, 0.38, 0.14, 0],
      extrapolate: 'clamp',
    });

    const translateY = scrollY.interpolate({
      inputRange: [
        center - ITEM_HEIGHT * 3,
        center - ITEM_HEIGHT * 2,
        center - ITEM_HEIGHT,
        center,
        center + ITEM_HEIGHT,
        center + ITEM_HEIGHT * 2,
        center + ITEM_HEIGHT * 3,
      ],
      outputRange: [10, 5, 0, 0, 0, -5, -10],
      extrapolate: 'clamp',
    });

    return (
      <Pressable
        unstable_pressDelay={75}
        onPress={() => onPress(index)}
        style={styles.itemContainer}
        accessibilityRole="adjustable"
      >
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.itemText,
            {
              color: activeTextColor,
              opacity,
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          {label}
        </Animated.Text>
      </Pressable>
    );
  }
);

WheelItem.displayName = 'WheelItem';

function findClosestIndex(items: number[], target: number): number {
  if (items.length === 0) return 0;
  const exact = items.indexOf(target);
  if (exact !== -1) return exact;

  let bestIdx = 0;
  let bestDiff = Math.abs(items[0] - target);
  for (let i = 1; i < items.length; i++) {
    const diff = Math.abs(items[i] - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// Görgethető értékválasztó kerék
export const OnboardingWheelPicker: React.FC<OnboardingWheelPickerProps> = ({
  min,
  max,
  value,
  onValueChange,
  step = 1,
  unitLabel,
  activeTextColor = '#FFFFFF',
  formatValue,
}) => {
  const flatListRef = useRef<FlatList<number>>(null);
  const hasLaidOutRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isProgrammaticRef = useRef(false);

  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragCooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rangeKey = `${min}:${max}:${step}`;
  const prevRangeKeyRef = useRef(rangeKey);

  const data = useMemo(() => {
    const items: number[] = [];
    for (let i = min; i <= max; i += step) {
      items.push(i);
    }
    return items;
  }, [min, max, step]);

  const snapOffsets = useMemo(
    () => data.map((_, idx) => idx * ITEM_HEIGHT),
    [data]
  );

  const initialIndex = useMemo(() => findClosestIndex(data, value), [data, value]);
  const initialIndexRef = useRef<number>(initialIndex);
  const lastCommittedValueRef = useRef<number>(data[initialIndex] ?? value);
  const liveOffsetRef = useRef<number>(initialIndex * ITEM_HEIGHT);

  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  const scrollY = useRef(new Animated.Value(initialIndex * ITEM_HEIGHT)).current;

  // Görgetési pozíció követése ref-ben az újrarenderelés elkerülésére
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value: offsetY }) => {
      liveOffsetRef.current = offsetY;
    });
    return () => {
      scrollY.removeListener(listenerId);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (dragCooldownTimerRef.current) clearTimeout(dragCooldownTimerRef.current);
      if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);
    };
  }, [scrollY]);

  // Kezdeti görgetési pozíció beállítása az első betöltéskor
  useEffect(() => {
    const targetOffset = initialIndexRef.current * ITEM_HEIGHT;
    liveOffsetRef.current = targetOffset;
    scrollY.setValue(targetOffset);
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
    }, 30);
    return () => clearTimeout(timer);
  }, [scrollY]);

  // Pozíció igazítása, ha a külső érték megváltozik
  useEffect(() => {
    if (!hasLaidOutRef.current || data.length === 0) return;

    const rangeChanged = prevRangeKeyRef.current !== rangeKey;
    prevRangeKeyRef.current = rangeKey;

    const externalValueChanged =
      !isDraggingRef.current &&
      !isProgrammaticRef.current &&
      value !== lastCommittedValueRef.current;

    if (!rangeChanged && !externalValueChanged) {
      return;
    }

    const targetIdx = findClosestIndex(data, value);
    const targetVal = data[targetIdx];
    const targetOffset = targetIdx * ITEM_HEIGHT;

    lastCommittedValueRef.current = targetVal;
    liveOffsetRef.current = targetOffset;
    scrollY.setValue(targetOffset);
    flatListRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
  }, [data, rangeKey, value, scrollY]);

  const handleLayout = useCallback(() => {
    if (hasLaidOutRef.current || data.length === 0) return;
    hasLaidOutRef.current = true;

    const targetIdx = findClosestIndex(data, value);
    const targetOffset = targetIdx * ITEM_HEIGHT;
    lastCommittedValueRef.current = data[targetIdx] ?? value;
    liveOffsetRef.current = targetOffset;
    scrollY.setValue(targetOffset);

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
    });
  }, [data, value, scrollY]);

  const commitAtOffset = useCallback(
    (offsetY: number) => {
      if (data.length === 0) return;
      const rawIndex = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(rawIndex, data.length - 1));
      const selectedValue = data[clampedIndex];
      if (selectedValue !== undefined && selectedValue !== lastCommittedValueRef.current) {
        lastCommittedValueRef.current = selectedValue;
        onValueChangeRef.current(selectedValue);
      }
    },
    [data]
  );

  const releaseDragFlagAfterCooldown = useCallback(() => {
    if (dragCooldownTimerRef.current) {
      clearTimeout(dragCooldownTimerRef.current);
    }
    dragCooldownTimerRef.current = setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    if (dragCooldownTimerRef.current) clearTimeout(dragCooldownTimerRef.current);
    if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);
    isProgrammaticRef.current = false;
    isDraggingRef.current = true;
  }, []);

  const handleMomentumScrollBegin = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammaticRef.current) return;
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

      const fallbackOffset = e.nativeEvent.contentOffset.y;
      // Kiválasztott elem érvényesítése a görgetés megállása után
      settleTimerRef.current = setTimeout(() => {
        commitAtOffset(liveOffsetRef.current ?? fallbackOffset);
        releaseDragFlagAfterCooldown();
      }, 90);
    },
    [commitAtOffset, releaseDragFlagAfterCooldown]
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
        programmaticTimerRef.current = null;
      }

      const wasProgrammatic = isProgrammaticRef.current;
      isProgrammaticRef.current = false;
      releaseDragFlagAfterCooldown();

      if (!wasProgrammatic) {
        commitAtOffset(e.nativeEvent.contentOffset.y);
      }
    },
    [commitAtOffset, releaseDragFlagAfterCooldown]
  );

  const handlePressItem = useCallback(
    (index: number) => {
      if (isDraggingRef.current || data.length === 0) return;

      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      const selectedValue = data[clampedIndex];
      const targetOffset = clampedIndex * ITEM_HEIGHT;

      if (Math.abs(liveOffsetRef.current - targetOffset) < 1) {
        return;
      }

      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);

      isProgrammaticRef.current = true;
      if (selectedValue !== undefined && selectedValue !== lastCommittedValueRef.current) {
        lastCommittedValueRef.current = selectedValue;
        onValueChangeRef.current(selectedValue);
      }

      flatListRef.current?.scrollToOffset({ offset: targetOffset, animated: true });

      programmaticTimerRef.current = setTimeout(() => {
        isProgrammaticRef.current = false;
      }, 420);
    },
    [data]
  );

  const keyExtractor = useCallback((item: number) => String(item), []);

  const getItemLayout = useCallback(
    (_: ArrayLike<number> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => (
      <WheelItem
        index={index}
        label={formatValue ? formatValue(item) : String(item)}
        scrollY={scrollY}
        activeTextColor={activeTextColor}
        onPress={handlePressItem}
      />
    ),
    [activeTextColor, formatValue, handlePressItem, scrollY]
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.wheelViewport} onLayout={handleLayout}>
        {/* Felső kijelölő vonal */}
        <View pointerEvents="none" style={[styles.divider, styles.topDivider]} />

        <Animated.FlatList
          ref={flatListRef}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialIndexRef.current}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          snapToOffsets={snapOffsets}
          decelerationRate="fast"
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={7}
          onScrollBeginDrag={handleScrollBeginDrag}
          onMomentumScrollBegin={handleMomentumScrollBegin}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          style={styles.list}
        />

        {/* Alsó kijelölő vonal */}
        <View pointerEvents="none" style={[styles.divider, styles.bottomDivider]} />
      </View>

      {unitLabel ? <Text style={styles.unitSubtext}>{unitLabel}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  wheelViewport: {
    height: CONTAINER_HEIGHT,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  list: {
    height: CONTAINER_HEIGHT,
    width: '100%',
  },
  listContent: {
    paddingTop: SIDE_PADDING,
    paddingBottom: SIDE_PADDING,
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontFamily: 'Inter',
    fontSize: 42,
    lineHeight: 50,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  divider: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    height: 1,
    backgroundColor: '#1C2D4A',
    zIndex: 2,
  },
  topDivider: {
    top: ITEM_HEIGHT * 2,
  },
  bottomDivider: {
    top: ITEM_HEIGHT * 3,
  },
  unitSubtext: {
    marginTop: 14,
    fontFamily: 'Inter',
    fontSize: 12.5,
    fontWeight: '500',
    color: '#526582',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
