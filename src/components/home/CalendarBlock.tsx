import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { DateHelper } from '@/utils/DateHelper';
import { usePlan } from '@/context/PlanProvider';

export function CalendarBlock(): React.JSX.Element {
  const { language, i18n } = useLanguage();
  const { selectedHomeDayIndex, setSelectedHomeDayIndex, todayIndex } = usePlan();

  const weekDays = useMemo(() => {
    const today = new Date();
    const monday = DateHelper.getMonday(today);
    const labels = i18n.getCalendarColumnHeaders();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        day: labels[i],
        date: d.getDate().toString(),
        index: i,
      };
    });
  }, [language, i18n]);

  return (
    <View key={language} style={calendarStyle.container}>
      {weekDays.map((item) => {
        const isSelected = item.index === selectedHomeDayIndex;
        const isToday = item.index === todayIndex;
        return (
          <View key={item.index} style={calendarStyle.dayColumn}>
            <Text
              style={[
                calendarStyle.dayLabel,
                isSelected && calendarStyle.activeDayLabel,
                isToday && !isSelected && calendarStyle.todayDayLabel,
              ]}
            >
              {item.day}
            </Text>
            <TouchableOpacity
              style={[
                calendarStyle.dateCircle,
                isSelected && calendarStyle.activeDateCircle,
                isToday && !isSelected && calendarStyle.todayDateCircle,
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedHomeDayIndex(item.index)}
            >
              <Text
                style={[
                  calendarStyle.dateText,
                  isSelected && calendarStyle.activeDateText,
                  isToday && !isSelected && calendarStyle.todayDateText,
                ]}
              >
                {item.date}
              </Text>
              {isToday && (
                <View
                  style={[
                    calendarStyle.todayDot,
                    isSelected && calendarStyle.todayDotSelected,
                  ]}
                />
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const calendarStyle = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 12,
  },
  dayLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  activeDayLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDayLabel: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  dateCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#152038',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  activeDateCircle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  todayDateCircle: {
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  dateText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeDateText: {
    color: Colors.background.primary,
    fontWeight: 'bold',
  },
  todayDateText: {
    color: '#60A5FA',
    fontWeight: '700',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#60A5FA',
    position: 'absolute',
    bottom: 4,
  },
  todayDotSelected: {
    backgroundColor: '#0D1528',
  },
});
