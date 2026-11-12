import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';

export interface LoadingIndicatorProps {
  label?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

// Betöltésjelző animáció és szöveg
export function LoadingIndicator({
  label,
  size = 'large',
  color = Colors.accent.sky,
  style,
}: LoadingIndicatorProps): React.JSX.Element {
  const { t } = useLanguage();
  const displayLabel = label ?? t('loading.default');

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {displayLabel ? <Text style={styles.label}>{displayLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.text.dim,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
