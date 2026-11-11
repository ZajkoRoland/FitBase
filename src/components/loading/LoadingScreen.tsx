import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingBrandHeader } from './LoadingBrandHeader';
import { LoadingIndicator } from './LoadingIndicator';

/**
 * Interface contract defining props for the full-screen LoadingScreen.
 */
export interface LoadingScreenProps {
  statusMessage?: string;
  hideIndicator?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onSignOut?: () => void;
}

/**
 * LoadingScreen
 *
 * Full-screen loading presentation displayed during initial session verification
 * and state transitions. Composes LoadingBrandHeader, LoadingIndicator,
 * and an optional error/recovery interface if backend connection fails.
 */
export function LoadingScreen({
  statusMessage,
  hideIndicator = false,
  errorMessage,
  onRetry,
  onSignOut,
}: LoadingScreenProps): React.JSX.Element {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <LoadingBrandHeader />

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} activeOpacity={0.8} onPress={onRetry}>
                <Text style={styles.retryButtonText}>{t('loading.retry')}</Text>
              </TouchableOpacity>
            )}
            {onSignOut && (
              <TouchableOpacity style={styles.signOutButton} activeOpacity={0.7} onPress={onSignOut}>
                <Text style={styles.signOutButtonText}>{t('loading.backToLogin')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          !hideIndicator && (
            <LoadingIndicator label={statusMessage} style={styles.indicator} />
          )
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  indicator: {
    marginTop: 48,
  },
  errorContainer: {
    marginTop: 36,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderColor: Colors.status.errorBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.status.error,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    width: '100%',
    height: 44,
    backgroundColor: Colors.accent.sky,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: Colors.background.primary,
  },
  signOutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  signOutButtonText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
