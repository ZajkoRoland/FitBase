import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GreetingHeader } from '@/components/home/GreetingHeader';
import { CalendarBlock } from '@/components/home/CalendarBlock';
import { StatsBlock } from '@/components/home/StatsBlock';
import { TimerBlock } from '@/components/home/TimerBlock';
import { WeeklyGoalBlock } from '@/components/home/WeeklyGoalBlock';

export default function HomeScreen(): React.JSX.Element {
  const { language } = useLanguage();

  return (
    <SafeAreaView key={language} style={screen.root} edges={['top']}>
      <ScrollView contentContainerStyle={screen.scroll} showsVerticalScrollIndicator={false}>
        <GreetingHeader />
        <CalendarBlock />
        <StatsBlock />
        <TimerBlock />
        <WeeklyGoalBlock />
      </ScrollView>
    </SafeAreaView>
  );
}

const screen = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scroll: {
    padding: 20,
    gap: 24,
    paddingBottom: 110,
  },
});
