import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { i18n } from '@/services/LocalizationService';
import { WorkoutDay } from '@/services/PlanService';
import { DateHelper } from '@/utils/DateHelper';
import { WorkoutSessionItem } from '@/types/profile';

export interface MonthGridCell {
  readonly dayNumber: number;
  readonly date: Date;
  readonly isCurrentMonth: boolean;
  readonly isPrevMonth: boolean;
  readonly isNextMonth: boolean;
  readonly dayOfWeekIndex: number;
  readonly isToday: boolean;
}

export interface MonthCalendarGridProps {
  readonly weekPlan: WorkoutDay[];
  readonly selectedDay: number | null;
  readonly onSelectDay: (cell: MonthGridCell) => void;
  readonly date?: Date;
  readonly historicalSessions?: Record<string, WorkoutSessionItem>;
}

export class MonthCalendarHelper {
  private readonly year: number;
  private readonly month: number; // 0-based

  constructor(date: Date = new Date()) {
    this.year = date.getFullYear();
    this.month = date.getMonth();
  }

  public get monthName(): string {
    return i18n.getMonthName(this.month, true);
  }

  public get monthIndex(): number {
    return this.month;
  }

  public get currentYear(): number {
    return this.year;
  }

  public get daysInMonth(): number {
    return new Date(this.year, this.month + 1, 0).getDate();
  }

  public get daysInPrevMonth(): number {
    return new Date(this.year, this.month, 0).getDate();
  }

  public get leadingPaddingDays(): number {
    const firstDay = new Date(this.year, this.month, 1).getDay();
    return (firstDay + 6) % 7;
  }

  public isToday(cellDate: Date): boolean {
    const now = new Date();
    return DateHelper.isSameDay(cellDate, now);
  }

  public getDayOfWeekIndex(dayNumber: number): number {
    const day = new Date(this.year, this.month, dayNumber).getDay();
    return (day + 6) % 7;
  }

  public generateGridCells(): MonthGridCell[] {
    const cells: MonthGridCell[] = [];
    const leading = this.leadingPaddingDays;
    const prevDaysCount = this.daysInPrevMonth;
    const currentDaysCount = this.daysInMonth;

    if (leading > 0) {
      const startPrev = prevDaysCount - leading + 1;
      for (let d = startPrev; d <= prevDaysCount; d++) {
        const cellDate = new Date(this.year, this.month - 1, d);
        const dayOfWeekIndex = (cellDate.getDay() + 6) % 7;
        cells.push({
          dayNumber: d,
          date: cellDate,
          isCurrentMonth: false,
          isPrevMonth: true,
          isNextMonth: false,
          dayOfWeekIndex,
          isToday: this.isToday(cellDate),
        });
      }
    }

    for (let d = 1; d <= currentDaysCount; d++) {
      const cellDate = new Date(this.year, this.month, d);
      const dayOfWeekIndex = (cellDate.getDay() + 6) % 7;
      cells.push({
        dayNumber: d,
        date: cellDate,
        isCurrentMonth: true,
        isPrevMonth: false,
        isNextMonth: false,
        dayOfWeekIndex,
        isToday: this.isToday(cellDate),
      });
    }

    const totalSoFar = cells.length;
    const totalRows = Math.ceil(totalSoFar / 7);
    const targetTotal = totalRows * 7;
    const nextCount = targetTotal - totalSoFar;

    for (let d = 1; d <= nextCount; d++) {
      const cellDate = new Date(this.year, this.month + 1, d);
      const dayOfWeekIndex = (cellDate.getDay() + 6) % 7;
      cells.push({
        dayNumber: d,
        date: cellDate,
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true,
        dayOfWeekIndex,
        isToday: this.isToday(cellDate),
      });
    }

    return cells;
  }
}

export function MonthCalendarGrid({
  weekPlan,
  selectedDay,
  onSelectDay,
  date = new Date(),
  historicalSessions,
}: MonthCalendarGridProps): React.JSX.Element {
  const { i18n: loc } = useLanguage();
  const weekdayNames = loc.getCalendarColumnHeaders();

  const today = useMemo(() => new Date(), []);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const gridCells = useMemo(() => {
    const helper = new MonthCalendarHelper(date);
    return helper.generateGridCells();
  }, [date.getFullYear(), date.getMonth()]);

  return (
    <View style={styles.container}>
      {/* Weekday column headers (M..S or H..V) */}
      <View style={styles.weekdayRow}>
        {weekdayNames.map((name, index) => (
          <Text key={index} style={styles.weekdayText}>
            {name}
          </Text>
        ))}
      </View>

      {/* Days matrix */}
      <View style={styles.matrix}>
        {gridCells.map((cell) => {
          const cellDate = cell.date;
          const cellDateKey = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
          const isPast = cellDateKey < todayKey;

          let isWorkout = false;
          let isRest = false;

          if (isPast) {
            const hasPastSession = !!(historicalSessions && historicalSessions[cellDateKey]);
            isWorkout = hasPastSession;
            isRest = !hasPastSession;
          } else {
            const routineDay = weekPlan[cell.dayOfWeekIndex];
            isWorkout = routineDay ? routineDay.type === 'workout' : false;
            isRest = routineDay ? routineDay.type === 'rest' : false;
          }

          const isToday = cell.isToday;
          const isSelected = cell.isCurrentMonth && selectedDay === cell.dayNumber;

          return (
            <TouchableOpacity
              key={`cell-${cell.date.toISOString()}`}
              style={styles.cell}
              onPress={() => onSelectDay(cell)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dayBox,
                  isToday && styles.todayBox,
                  isSelected && styles.selectedBox,
                  isToday && isSelected && styles.todaySelectedBox,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumberText,
                    !cell.isCurrentMonth && styles.otherMonthText,
                    isToday && styles.todayText,
                    isSelected && styles.selectedText,
                    isToday && isSelected && styles.todaySelectedText,
                  ]}
                >
                  {cell.dayNumber}
                </Text>

                {/* Status indicator: Blue for workout, Amber for rest */}
                <View
                  style={[
                    styles.dotContainer,
                    !cell.isCurrentMonth && styles.otherMonthDotContainer,
                  ]}
                >
                  {isWorkout && <View style={styles.workoutDot} />}
                  {isRest && <View style={styles.restDot} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121C32',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  matrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayBox: {
    width: 36,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  todayBox: {
    borderColor: 'rgba(74, 184, 248, 0.40)',
    backgroundColor: 'rgba(74, 184, 248, 0.05)',
  },
  selectedBox: {
    borderColor: Colors.accent.blue,
    backgroundColor: '#172E4E',
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 5,
  },
  todaySelectedBox: {
    borderColor: Colors.accent.blue,
    backgroundColor: '#1E4370',
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.75,
    shadowRadius: 10,
    elevation: 6,
  },
  dayNumberText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  otherMonthText: {
    color: 'rgba(255, 255, 255, 0.22)',
    fontWeight: '400',
  },
  todayText: {
    color: Colors.accent.blue,
    fontWeight: '700',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  todaySelectedText: {
    color: Colors.accent.blue,
    fontWeight: '800',
  },
  dotContainer: {
    height: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherMonthDotContainer: {
    opacity: 0.22,
  },
  workoutDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent.blue,
  },
  restDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent.amber,
  },
});
