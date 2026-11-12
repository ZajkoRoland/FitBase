import { LoadingScreen } from '@/components/loading/LoadingScreen';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

// Belépési pont: átirányítás a bejelentkezésre, az onboardingra vagy a főoldalra
export default function Index(): React.JSX.Element {
  const { session, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, error: profileError, refreshProfile } = useProfile();
  const { t } = useLanguage();
  const router = useRouter();

  const loading = authLoading || (session ? profileLoading : false);

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/LoginScreen');
    } else if (profile && !profile.onboarding_completed) {
      router.replace('/(onboarding)');
    } else if (profile && profile.onboarding_completed) {
      router.replace('/(tabs)');
    }
  }, [loading, session, profile, router]);

  const hasConnectionError = !loading && !!session && !profile && !!profileError;

  return (
    <LoadingScreen
      statusMessage={hasConnectionError ? undefined : t('loading.initializing')}
      errorMessage={
        hasConnectionError
          ? t('loading.connectionError')
          : undefined
      }
      onRetry={hasConnectionError ? refreshProfile : undefined}
      onSignOut={hasConnectionError ? signOut : undefined}
    />
  );
}
