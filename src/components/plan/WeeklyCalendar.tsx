import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { WorkoutDay } from '@/services/PlanService';
import { WorkoutSessionItem } from '@/types/profile';
import { DateHelper } from '@/utils/DateHelper';
import { PlanViewMode, PlanViewSwitcher } from './PlanViewSwitcher';
import { WeeklyCarouselWheel } from './WeeklyCarouselWheel';

interface WeeklyCalendarProps {
  weekPlan: WorkoutDay[];
  activeDayIndex: number;
  setActiveDayIndex: (index: number) => void;
  topInset: number;
  viewMode?: PlanViewMode;
  onViewModeChange?: (mode: PlanViewMode) => void;
  onAddPress?: () => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  totalWeeks?: number;
  currentWeekIndex?: number;
  onCycleIndexChange?: (index: number) => void;
  historicalSessions?: Record<string, WorkoutSessionItem>;
}

const WEEK_LETTERS = ['A', 'B', 'C', 'D'];

export function WeeklyCalendar({
  weekPlan,
  activeDayIndex,
  setActiveDayIndex,
  topInset,
  viewMode = 'week',
  onViewModeChange = () => {},
  onAddPress = () => {},
  currentDate,
  onDateChange,
  totalWeeks = 1,
  currentWeekIndex = 0,
  onCycleIndexChange,
  historicalSessions,
}: WeeklyCalendarProps) {
  const { t } = useLanguage();
  const [localDate, setLocalDate] = useState<Date>(new Date());
  const activeDate = currentDate ?? localDate;

  const [headerMonday, setHeaderMonday] = useState<Date>(() => DateHelper.getMonday(activeDate));

  React.useEffect(() => {
    const monday = DateHelper.getMonday(activeDate);
    setHeaderMonday((prev) => (prev.getTime() === monday.getTime() ? prev : monday));
  }, [activeDate]);

  const updateDate = React.useCallback(
    (newDate: Date) => {
      if (onDateChange) {
        onDateChange(newDate);
      } else {
        setLocalDate(newDate);
      }
    },
    [onDateChange]
  );

  const currentMonday = headerMonday;
  const weekRangeText = DateHelper.formatWeekRange(currentMonday);
  const weekMetaBase = DateHelper.formatWeekMeta(currentMonday);

  const weekNumber = DateHelper.getWeekNumber(currentMonday);
  const cycleIndex = totalWeeks > 1 ? (((weekNumber - 1) % totalWeeks) + totalWeeks) % totalWeeks : 0;
  const cycleLetter = WEEK_LETTERS[cycleIndex] || 'A';

  const prevCycleIndexRef = React.useRef<number>(cycleIndex);
  React.useEffect(() => {
    if (totalWeeks > 1 && onCycleIndexChange && prevCycleIndexRef.current !== cycleIndex) {
      prevCycleIndexRef.current = cycleIndex;
      onCycleIndexChange(cycleIndex);
    }
  }, [cycleIndex, totalWeeks, onCycleIndexChange]);

  const monthRangeText = DateHelper.formatMonthYear(activeDate);
  const monthMetaText = DateHelper.formatMonthMeta(activeDate);

  const handleWeekChange = React.useCallback((weekMonday: Date) => {
    setHeaderMonday((prev) => (prev.getTime() === weekMonday.getTime() ? prev : weekMonday));
  }, []);

  const handlePrev = () => {
    if (viewMode === 'month') {
      const prevMonth = new Date(activeDate.getFullYear(), activeDate.getMonth() - 1, 1);
      updateDate(prevMonth);
    } else {
      const prevMonday = new Date(headerMonday);
      prevMonday.setDate(headerMonday.getDate() - 7);
      prevMonday.setHours(0, 0, 0, 0);
      setHeaderMonday(prevMonday);
      setActiveDayIndex(0);
      updateDate(prevMonday);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      const nextMonth = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 1);
      updateDate(nextMonth);
    } else {
      const nextMonday = new Date(headerMonday);
      nextMonday.setDate(headerMonday.getDate() + 7);
      nextMonday.setHours(0, 0, 0, 0);
      setHeaderMonday(nextMonday);
      setActiveDayIndex(0);
      updateDate(nextMonday);
    }
  };

  const handleTodayPress = () => {
    const today = new Date();
    const todayMonday = DateHelper.getMonday(today);
    setHeaderMonday(todayMonday);
    const day = today.getDay();
    const todayIdx = day === 0 ? 6 : day - 1;
    setActiveDayIndex(todayIdx);
    updateDate(today);
  };

  return (
    <View style={[styles.topSection, { paddingTop: topInset + 16 }]}>
      {/* 1. Top Bar: Screen Title & (+) Action FAB */}
      <View style={styles.headerRow}>
        <Text style={styles.mainTitle}>
          {viewMode === 'month' ? t('plan.monthlyTitle') : t('plan.weeklyTitle')}
        </Text>

        {/* Brand Blue Round Action FAB */}
        <TouchableOpacity style={styles.fabButton} onPress={onAddPress} activeOpacity={0.8}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0D1528" strokeWidth={3}>
            <Path d="M12 5v14M5 12h14" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* 2. Navigation Row: < DateRange > | Today | [ Week / Month ] */}
      <View style={styles.navRow}>
        <View style={styles.navLeft}>
          {/* Prev Button */}
          <TouchableOpacity style={styles.navArrowButton} onPress={handlePrev} activeOpacity={0.7}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={Colors.text.primary} strokeWidth={2.4}>
              <Path d="M15 18l-6-6 6-6" />
            </Svg>
          </TouchableOpacity>

          {/* Date Range / Month Box */}
          <View style={styles.dateRangeBox}>
            <Text style={styles.dateRangeText} numberOfLines={1}>
              {viewMode === 'month' ? monthRangeText : weekRangeText}
            </Text>
            <View style={styles.dateMetaRow}>
              <Text style={styles.dateMetaText} numberOfLines={1}>
                {viewMode === 'month' ? monthMetaText : weekMetaBase}
              </Text>
              {viewMode !== 'month' && totalWeeks > 1 && (
                <View style={styles.cycleBadge}>
                  <Text style={styles.cycleBadgeText}>
                    {t('date.weekCycle', { letter: cycleLetter })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Next Button */}
          <TouchableOpacity style={styles.navArrowButton} onPress={handleNext} activeOpacity={0.7}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={Colors.text.primary} strokeWidth={2.4}>
              <Path d="M9 18l6-6-6-6" />
            </Svg>
          </TouchableOpacity>

          {/* Today Button */}
          <TouchableOpacity style={styles.todayButton} onPress={handleTodayPress} activeOpacity={0.7}>
            <Text style={styles.todayButtonText}>{t('date.today')}</Text>
          </TouchableOpacity>
        </View>

        {/* View Switcher: Week / Month */}
        <PlanViewSwitcher mode={viewMode} onChange={onViewModeChange} />
      </View>

      {/* 3. Circular 3D Cylindrical Wheel Carousel */}
      {viewMode === 'week' && (
        <WeeklyCarouselWheel
          weekPlan={weekPlan}
          currentDate={activeDate}
          activeDayIndex={activeDayIndex}
          onSelectDay={setActiveDayIndex}
          onDateChange={updateDate}
          onWeekChange={handleWeekChange}
          historicalSessions={historicalSessions}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: {
    backgroundColor: '#0D1528',
    paddingBottom: 4,
    marginBottom: 8,
  },
  headerRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
    paddingRight: 12,
  },
  fabButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  navRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  navArrowButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#152038',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateRangeBox: {
    paddingHorizontal: 2,
    flexShrink: 1,
  },
  dateRangeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  dateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  dateMetaText: {
    color: Colors.text.secondary,
    fontSize: 9.5,
    fontWeight: '500',
  },
  cycleBadge: {
    backgroundColor: 'rgba(74, 184, 248, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.40)',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 5,
  },
  cycleBadgeText: {
    color: Colors.accent.blue,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  todayButton: {
    paddingHorizontal: 7,
    paddingVertical: 4.5,
    borderRadius: 8,
    backgroundColor: '#152038',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  todayButtonText: {
    color: Colors.text.primary,
    fontSize: 10.5,
    fontWeight: '700',
  },
});
