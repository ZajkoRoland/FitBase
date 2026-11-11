import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';

export type PlanViewMode = 'week' | 'month';

export interface PlanViewSwitcherProps {
  readonly mode: PlanViewMode;
  readonly onChange: (mode: PlanViewMode) => void;
}

export const PlanViewSwitcher: React.FC<PlanViewSwitcherProps> = ({ mode, onChange }) => {
  const { t } = useLanguage();
  const isWeek = mode === 'week';
  const isMonth = mode === 'month';

  return (
    <View style={styles.container}>
      {/* 1. Week Option */}
      <TouchableOpacity
        style={[styles.segment, isWeek && styles.segmentActive]}
        onPress={() => onChange('week')}
        activeOpacity={0.7}
      >
        <Svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke={isWeek ? Colors.text.primary : Colors.text.secondary}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Rect x="3" y="3" width="7" height="7" rx="1.5" />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" />
        </Svg>
        <Text style={[styles.text, isWeek && styles.textActive]}>{t('plan.viewWeek')}</Text>
      </TouchableOpacity>

      {/* 2. Month Option */}
      <TouchableOpacity
        style={[styles.segment, isMonth && styles.segmentActive]}
        onPress={() => onChange('month')}
        activeOpacity={0.7}
      >
        <Svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke={isMonth ? Colors.text.primary : Colors.text.secondary}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Rect x="3" y="4" width="18" height="18" rx="2" />
          <Path d="M16 2v4M8 2v4M3 10h18" />
        </Svg>
        <Text style={[styles.text, isMonth && styles.textActive]}>{t('plan.viewMonth')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#121C32',
    borderRadius: 10,
    padding: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexShrink: 0,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#1E2D4A',
  },
  text: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textActive: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
});
