import { BrandLogo } from '@/components/auth/BrandLogo';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

/**
 * Interface contract defining properties for the LoadingBrandHeader component.
 * Follows the Interface Segregation Principle (ISP).
 */
export interface LoadingBrandHeaderProps {
  appName?: string;
  tagline?: string;
  style?: ViewStyle;
}

/**
 * LoadingBrandHeader
 *
 * Encapsulates the visual brand identity displayed on initial app launch.
 * Adheres to Single Responsibility Principle (SRP) by managing solely
 * the presentation of the logo, title, and brand tagline.
 */
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
