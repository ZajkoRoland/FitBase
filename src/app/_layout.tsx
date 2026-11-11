import { Colors } from "@/constants/Colors";
import { AuthProvider, useAuth } from "@/context/AuthProvider";
import { LanguageProvider, useLanguage } from "@/context/LanguageProvider";
import { PlanProvider } from "@/context/PlanProvider";
import { ProfileProvider, useProfile } from "@/context/ProfileProvider";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { NotificationService } from "@/services/NotificationService";

// Prevent native splash screen from auto-hiding until initial check is done
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { language } = useLanguage();
  const router = useRouter();
  const segments = useSegments();

  const loading = authLoading || (session ? profileLoading : false);

  useEffect(() => {
    NotificationService.getInstance();
  }, []);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;

    const currentGroup = segments[0];
    if (!currentGroup) {
      return;
    }

    const inAuthGroup = currentGroup === '(auth)';
    const inOnboardingGroup = currentGroup === '(onboarding)';

    if (session) {
      if (profile && !profile.onboarding_completed) {
        if (!inOnboardingGroup) {
          router.replace('/(onboarding)');
        }
      } else if (profile && profile.onboarding_completed) {
        if (currentGroup !== '(tabs)') {
          router.replace('/(tabs)');
        }
      }
    } else {
      if (!inAuthGroup) {
        router.replace('/(auth)/LoginScreen');
      }
    }
  }, [session, profile, loading, segments, router]);

  return (
    <Stack
      key={language}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.primary },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(onboarding)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ProfileProvider>
          <PlanProvider>
            <RootNavigation />
          </PlanProvider>
        </ProfileProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
