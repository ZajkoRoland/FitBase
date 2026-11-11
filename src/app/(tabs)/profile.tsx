import { FitbaseCustomDialog } from '@/components/common/FitbaseCustomDialog';
import { AchievementsModal } from '@/components/profile/achievements/AchievementsModal';
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal';
import { DeleteAccountModal } from '@/components/profile/DeleteAccountModal';
import { EditAccountModal } from '@/components/profile/EditAccountModal';
import { EditBodyMetricsModal } from '@/components/profile/EditBodyMetricsModal';
import { EditDemographicsModal } from '@/components/profile/EditDemographicsModal';
import { EditFitnessGoalsModal } from '@/components/profile/EditFitnessGoalsModal';
import { EditTargetWeightModal } from '@/components/profile/EditTargetWeightModal';
import {
  LanguageSelectionModal,
  SUPPORTED_LANGUAGES,
} from '@/components/profile/LanguageSelectionModal';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import {
  AchievementsTrophyIcon,
  FitbaseAnalyticsIcon,
  ProfileFeatureCard,
} from '@/components/profile/ProfileFeatureCard';
import { ProfileFooter } from '@/components/profile/ProfileFooter';
import { ProfileMenuSection } from '@/components/profile/ProfileMenuSection';
import { StatisticsModal } from '@/components/profile/statistics/StatisticsModal';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { FitbaseDialogConfig } from '@/models/DialogConfig';
import { bodyMetricsService } from '@/services/BodyMetricsService';
import { googleAuthService } from '@/services/GoogleAuthService';
import { NotificationService } from '@/services/NotificationService';
import { profileMenuService } from '@/services/ProfileMenuService';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function ProfileScreen(): React.JSX.Element {
  const { user, signOut } = useAuth();
  const { profile, settings, updateSettings } = useProfile();
  const { language, setLanguage, t } = useLanguage();

  const [demographicsModalVisible, setDemographicsModalVisible] = useState(false);
  const [bodyMetricsModalVisible, setBodyMetricsModalVisible] = useState(false);
  const [targetWeightModalVisible, setTargetWeightModalVisible] = useState(false);
  const [fitnessGoalsModalVisible, setFitnessGoalsModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [achievementsModalVisible, setAchievementsModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [activeDialog, setActiveDialog] = useState<FitbaseDialogConfig | null>(null);

  useEffect(() => {
    if (settings) {
      setNotificationsEnabledState(settings.notifications_enabled);
      setSoundEnabledState(settings.sound_enabled);
    } else {
      setNotificationsEnabledState(true);
      setSoundEnabledState(true);
    }
  }, [settings]);

  useEffect(() => {
    if (profile?.target_weight !== undefined && profile?.target_weight !== null) {
      setTargetWeight(profile.target_weight);
    } else if (profile?.id) {
      bodyMetricsService.getTargetWeight(profile.id).then((tw) => {
        setTargetWeight(tw);
      });
    } else {
      setTargetWeight(null);
    }
  }, [profile?.target_weight, profile?.id]);

  useEffect(() => {
    if (user?.auth_provider === 'google') {
      setIsGoogleAuth(true);
    } else {
      setIsGoogleAuth(false);
      googleAuthService.hasPreviousSignIn().then((hasGoogle) => {
        if (hasGoogle) setIsGoogleAuth(true);
      });
    }
  }, [user]);

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabledState(val);
    await NotificationService.getInstance().setNotificationsEnabled(val);
    updateSettings({ notifications_enabled: val }).catch(() => {});
  };

  const handleToggleSound = async (val: boolean) => {
    setSoundEnabledState(val);
    updateSettings({ sound_enabled: val }).catch(() => {});
  };

  const handleLogout = () => {
    setActiveDialog(
      FitbaseDialogConfig.confirm(
        t('profile.logoutConfirmTitle'),
        t('profile.logoutConfirmMsg'),
        async () => {
          try {
            await signOut();
          } catch (error: any) {
            setActiveDialog(
              FitbaseDialogConfig.info(t('common.error'), error.message || t('profile.logoutFailed'), {
                iconName: 'alert-circle-outline',
                iconColor: '#FF5252',
                iconBgColor: 'rgba(255, 82, 82, 0.15)',
              })
            );
          }
        },
        {
          iconName: 'log-out-outline',
          iconColor: '#FF5252',
          iconBgColor: 'rgba(255, 82, 82, 0.15)',
          primaryButtonText: t('profile.menu.logOut'),
          primaryButtonStyle: 'destructive',
          secondaryButtonText: t('common.cancel'),
        }
      )
    );
  };

  const currentLanguageName = useMemo(() => {
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    if (!found) return 'English (English)';
    const localizedName = t(`lang.${found.code}`);
    return `${localizedName} (${found.nativeName})`;
  }, [language, t]);

  const menuSections = useMemo(() => {
    return profileMenuService.getMenuSections({
      profile,
      targetWeight,
      isGoogleUser: isGoogleAuth,
      notificationsEnabled,
      soundEnabled,
      selectedLanguageName: currentLanguageName,
      onLogout: handleLogout,
      onEditDemographics: () => setDemographicsModalVisible(true),
      onEditBodyMetrics: () => setBodyMetricsModalVisible(true),
      onEditTargetWeight: () => setTargetWeightModalVisible(true),
      onEditFitnessGoals: () => setFitnessGoalsModalVisible(true),
      onEditAccount: () => setAccountModalVisible(true),
      onChangePassword: () => setPasswordModalVisible(true),
      onDeleteAccount: () => setDeleteAccountModalVisible(true),
      onToggleNotifications: handleToggleNotifications,
      onToggleSound: handleToggleSound,
      onOpenLanguageModal: () => setLanguageModalVisible(true),
      onShowDialog: setActiveDialog,
    });
  }, [
    profile,
    targetWeight,
    isGoogleAuth,
    notificationsEnabled,
    soundEnabled,
    currentLanguageName,
    language,
  ]);

  return (
    <View key={language} style={scr.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scr.scrollContent}
      >
        <ProfileAvatar />

        <View style={scr.featureCardsContainer}>
          <ProfileFeatureCard
            title={t('profile.statsTitle')}
            subtitle={t('profile.statsSubtitle')}
            icon={<FitbaseAnalyticsIcon />}
            onPress={() => setStatsModalVisible(true)}
          />
          <ProfileFeatureCard
            title={t('profile.achievementsTitle')}
            subtitle={t('profile.achievementsSubtitle')}
            icon={<AchievementsTrophyIcon />}
            onPress={() => setAchievementsModalVisible(true)}
          />
        </View>

        <ProfileMenuSection
          title={t('profile.sec.bodyMetrics')}
          items={menuSections.bodyMetrics}
        />

        <ProfileMenuSection
          title={t('profile.sec.preferences')}
          items={menuSections.preferences}
        />

        <ProfileMenuSection
          title={t('profile.sec.support')}
          items={menuSections.support}
        />

        <ProfileMenuSection
          title={t('profile.sec.followUs')}
          items={menuSections.social}
        />

        <ProfileMenuSection
          title={t('profile.sec.accountSecurity')}
          items={menuSections.security}
        />

        <ProfileMenuSection
          items={menuSections.account}
        />

        <ProfileFooter />
      </ScrollView>

      <EditDemographicsModal
        visible={demographicsModalVisible}
        onClose={() => setDemographicsModalVisible(false)}
        onShowDialog={setActiveDialog}
      />

      <EditBodyMetricsModal
        visible={bodyMetricsModalVisible}
        onClose={() => setBodyMetricsModalVisible(false)}
        onShowDialog={setActiveDialog}
      />

      <EditTargetWeightModal
        visible={targetWeightModalVisible}
        onClose={() => setTargetWeightModalVisible(false)}
        onSaved={() => {
          if (profile?.target_weight !== undefined) {
            setTargetWeight(profile.target_weight ?? null);
          }
        }}
        onShowDialog={setActiveDialog}
      />

      <EditFitnessGoalsModal
        visible={fitnessGoalsModalVisible}
        onClose={() => setFitnessGoalsModalVisible(false)}
        onShowDialog={setActiveDialog}
      />

      <EditAccountModal
        visible={accountModalVisible}
        onClose={() => setAccountModalVisible(false)}
        onShowDialog={setActiveDialog}
      />

      <ChangePasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        onShowDialog={setActiveDialog}
      />

      <DeleteAccountModal
        visible={deleteAccountModalVisible}
        onClose={() => setDeleteAccountModalVisible(false)}
        onShowDialog={setActiveDialog}
      />

      <StatisticsModal
        visible={statsModalVisible}
        onClose={() => setStatsModalVisible(false)}
      />

      <AchievementsModal
        visible={achievementsModalVisible}
        onClose={() => setAchievementsModalVisible(false)}
      />

      <LanguageSelectionModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        onSelectLanguage={(code) => {
          setLanguage(code);
        }}
        onShowDialog={setActiveDialog}
      />

      <FitbaseCustomDialog
        visible={Boolean(activeDialog)}
        config={activeDialog}
        onClose={() => setActiveDialog(null)}
      />
    </View>
  );
}

const scr = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.primary },
  scrollContent: {
    paddingBottom: 40,
  },
  featureCardsContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 4,
  },
});
