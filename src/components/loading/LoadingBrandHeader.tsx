import { BrandLogo } from '@/components/auth/BrandLogo';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

export interface LoadingBrandHeaderProps {
  appName?: string;
  tagline?: string;
  style?: ViewStyle;
}

// Betöltő képernyő FitBase logó és szlogen fejléc
export function LoadingBrandHeader({
  appName = 'FitBase',
  tagline,
  style,
}: LoadingBrandHeaderProps): React.JSX.Element {
  const { t } = useLanguage();
  const displayTagline = tagline ?? t('loading.tagline');

  return (
    <View style={[styles.container, style]}>
      <BrandLogo />
      <Text style={styles.title}>{appName}</Text>
      <Text style={styles.tagline}>{displayTagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 24,
    color: Colors.text.primary,
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
