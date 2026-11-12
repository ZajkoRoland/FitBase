import { Colors } from '@/constants/Colors';
import { FitbaseDialogConfig } from '@/models/DialogConfig';
import { ProfileMenuItem } from '@/models/ProfileMenuItem';
import { bodyMetricsService } from '@/services/BodyMetricsService';
import { i18n } from '@/services/LocalizationService';
import type { Profile } from '@/types/profile';

export interface IProfileMenuSections {
  bodyMetrics: ProfileMenuItem[];
  security: ProfileMenuItem[];
  preferences: ProfileMenuItem[];
  support: ProfileMenuItem[];
  social: ProfileMenuItem[];
  account: ProfileMenuItem[];
}

export interface ProfileMenuActionCallbacks {
  profile: Profile | null;
  targetWeight?: number | null;
  isGoogleUser?: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  selectedLanguageName?: string;
  onLogout: () => void;
  onEditDemographics?: () => void;
  onEditBodyMetrics: () => void;
  onEditTargetWeight: () => void;
  onEditFitnessGoals: () => void;
  onEditAccount: () => void;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
  onToggleNotifications: (enabled: boolean) => void;
  onToggleSound: (enabled: boolean) => void;
  onOpenLanguageModal?: () => void;
  onShowDialog?: (config: FitbaseDialogConfig) => void;
}

// Profil menüpontok és beállítások kezelése
export class ProfileMenuService {
  constructor() { }

  public static getInstance(): ProfileMenuService {
    return profileMenuService;
  }

  // Menüszekciók összeállítása a profil képernyőhöz
  public getMenuSections(callbacks: ProfileMenuActionCallbacks): IProfileMenuSections {
    return {
      bodyMetrics: this.getBodyMetricsItems(callbacks),
      security: this.getSecurityItems(callbacks),
      preferences: this.getPreferencesItems(callbacks),
      support: this.getSupportItems(callbacks),
      social: this.getSocialItems(),
      account: this.getAccountItems(callbacks.onLogout),
    };
  }

  // Testméretek és edzéscélok menüpontjainak összeállítása
  private getBodyMetricsItems(callbacks: ProfileMenuActionCallbacks): ProfileMenuItem[] {
    const p = callbacks.profile;
    const genderStr = i18n.translateGender(p?.gender);
    const ageStr =
      p?.age != null ? i18n.t('profile.demographics.ageSuffix', { age: p.age }) : null;
    const demographicsSub =
      [genderStr, ageStr].filter(Boolean).join(' • ') || i18n.t('profile.menu.notSet');

    const weightStr = p?.weight ? `${i18n.formatNumber(p.weight)} kg` : i18n.t('profile.menu.notSet');
    const heightStr = p?.height ? `${i18n.formatNumber(p.height)} cm` : i18n.t('profile.menu.notSet');
    const goalStr = i18n.translateFitnessGoal(p?.fitness_goal);
    const levelStr = i18n.translateFitnessLevel(p?.fitness_level);

    // BMI érték kiszámítása a testsúly és magasság alapján
    const bmiData = bodyMetricsService.calculateBmi(p?.weight, p?.height);
    const bmiSub = bmiData
      ? ` • BMI ${i18n.formatNumber(bmiData.bmi)} (${bmiData.localizedCategory})`
      : '';

    // Célsúly felé haladás kiszámítása
    const targetProgress = bodyMetricsService.calculateProgress(
      p?.weight,
      callbacks.targetWeight
    );
    const targetSub = callbacks.targetWeight
      ? `${i18n.formatNumber(callbacks.targetWeight)} kg${targetProgress ? ` • ${targetProgress.label}` : ''}`
      : i18n.t('profile.menu.setTargetWeight');

    return [
      new ProfileMenuItem({
        id: 'metric_gender_age',
        title: i18n.t('profile.menu.genderAge'),
        subtitle: demographicsSub,
        iconName: 'person-outline',
        iconColor: Colors.accent.sky,
        iconBgColor: 'rgba(56, 189, 248, 0.15)',
        onPress: callbacks.onEditDemographics,
      }),
      new ProfileMenuItem({
        id: 'metric_weight_height',
        title: i18n.t('profile.menu.weightHeight'),
        subtitle: `${weightStr} • ${heightStr}${bmiSub}`,
        iconName: 'body-outline',
        iconColor: Colors.accent.blue,
        iconBgColor: 'rgba(74, 184, 248, 0.15)',
        onPress: callbacks.onEditBodyMetrics,
      }),
      new ProfileMenuItem({
        id: 'metric_target_weight',
        title: i18n.t('profile.menu.targetWeight'),
        subtitle: targetSub,
        iconName: 'flag-outline',
        iconColor: Colors.accent.amber,
        iconBgColor: 'rgba(255, 179, 0, 0.15)',
        onPress: callbacks.onEditTargetWeight,
      }),
      new ProfileMenuItem({
        id: 'metric_goal_level',
        title: i18n.t('profile.menu.fitnessGoalLevel'),
        subtitle: `${levelStr} • ${goalStr}`,
        iconName: 'trophy-outline',
        iconColor: Colors.accent.green,
        iconBgColor: 'rgba(0, 230, 118, 0.15)',
        onPress: callbacks.onEditFitnessGoals,
      }),
    ];
  }

  // Fiók és biztonság menüpontok
  private getSecurityItems(callbacks: ProfileMenuActionCallbacks): ProfileMenuItem[] {
    const items: ProfileMenuItem[] = [
      new ProfileMenuItem({
        id: 'sec_edit_account',
        title: i18n.t('profile.menu.displayNameUsername'),
        iconName: 'person-circle-outline',
        iconColor: Colors.accent.blue,
        onPress: callbacks.onEditAccount,
      }),
    ];

    if (!callbacks.isGoogleUser) {
      items.push(
        new ProfileMenuItem({
          id: 'sec_change_password',
          title: i18n.t('profile.menu.changePassword'),
          iconName: 'key-outline',
          iconColor: Colors.accent.amber,
          iconBgColor: 'rgba(255, 179, 0, 0.15)',
          onPress: callbacks.onChangePassword,
        })
      );
    }

    items.push(
      new ProfileMenuItem({
        id: 'sec_delete_account',
        title: i18n.t('profile.menu.deleteAccount'),
        iconName: 'trash-outline',
        isDestructive: true,
        showChevron: true,
        onPress: callbacks.onDeleteAccount,
      })
    );

    return items;
  }

  private getPreferencesItems(callbacks: ProfileMenuActionCallbacks): ProfileMenuItem[] {
    const isNotifOn = callbacks.notificationsEnabled;

    return [
      new ProfileMenuItem({
        id: 'pref_language',
        title: i18n.t('profile.menu.language'),
        subtitle: callbacks.selectedLanguageName || 'English (English)',
        iconName: 'language-outline',
        iconColor: Colors.accent.blue,
        iconBgColor: 'rgba(74, 184, 248, 0.15)',
        onPress: callbacks.onOpenLanguageModal,
      }),
      new ProfileMenuItem({
        id: 'pref_reminders',
        title: i18n.t('profile.menu.reminders'),
        iconName: isNotifOn ? 'notifications-outline' : 'notifications-off-outline',
        iconColor: isNotifOn ? Colors.accent.amber : Colors.text.ghost,
        iconBgColor: isNotifOn ? 'rgba(255, 179, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        isSwitch: true,
        switchValue: isNotifOn,
        onToggleSwitch: callbacks.onToggleNotifications,
      }),
      new ProfileMenuItem({
        id: 'pref_sound',
        title: i18n.t('profile.menu.sound'),
        iconName: callbacks.soundEnabled ? 'volume-high-outline' : 'volume-mute-outline',
        iconColor: callbacks.soundEnabled ? Colors.accent.green : Colors.text.ghost,
        iconBgColor: callbacks.soundEnabled ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        isSwitch: true,
        switchValue: callbacks.soundEnabled,
        onToggleSwitch: callbacks.onToggleSound,
      }),
      new ProfileMenuItem({
        id: 'pref_integrations',
        title: i18n.t('profile.menu.integrations'),
        valueBadge: i18n.t('profile.menu.comingSoon'),
        iconName: 'watch-outline',
        iconColor: Colors.accent.teal,
        iconBgColor: 'rgba(0, 180, 216, 0.15)',
        onPress: () => {
          callbacks.onShowDialog?.(
            FitbaseDialogConfig.info(
              i18n.t('profile.menu.integrations'),
              i18n.t('profile.menu.integrationsMsg'),
              {
                iconName: 'watch-outline',
                iconColor: Colors.accent.teal,
                iconBgColor: 'rgba(0, 180, 216, 0.15)',
                primaryButtonText: i18n.t('common.gotIt'),
              }
            )
          );
        },
      }),
    ];
  }

  private getSupportItems(callbacks: ProfileMenuActionCallbacks): ProfileMenuItem[] {
    return [
      new ProfileMenuItem({
        id: 'sup_rate',
        title: i18n.t('profile.menu.rateFitbase'),
        iconName: 'star-outline',
        iconColor: Colors.accent.amber,
        onPress: () => {
          callbacks.onShowDialog?.(
            FitbaseDialogConfig.info(
              i18n.t('profile.menu.rateFitbase'),
              i18n.t('profile.menu.rateMsg'),
              {
                iconName: 'star-outline',
                iconColor: Colors.accent.amber,
                iconBgColor: 'rgba(255, 179, 0, 0.15)',
                primaryButtonText: i18n.t('common.awesome'),
              }
            )
          );
        },
      }),
      new ProfileMenuItem({
        id: 'sup_feedback',
        title: i18n.t('profile.menu.sendFeedback'),
        iconName: 'chatbubble-ellipses-outline',
        iconColor: Colors.accent.blue,
        onPress: () => {
          callbacks.onShowDialog?.(
            new FitbaseDialogConfig({
              title: i18n.t('profile.menu.sendFeedback'),
              message: i18n.t('profile.menu.feedbackMsg'),
              iconName: 'chatbubble-ellipses-outline',
              iconColor: Colors.accent.blue,
              iconBgColor: 'rgba(74, 184, 248, 0.15)',
              primaryButtonText: i18n.t('common.close'),
              actionUrl: 'mailto:fitbase.support@gmail.com?subject=FitBase%20Feedback',
              actionUrlLabel: 'fitbase.support@gmail.com',
            })
          );
        },
      }),
      new ProfileMenuItem({
        id: 'sup_contact',
        title: i18n.t('profile.menu.customerSupport'),
        iconName: 'help-circle-outline',
        iconColor: Colors.accent.green,
        onPress: () => {
          callbacks.onShowDialog?.(
            new FitbaseDialogConfig({
              title: i18n.t('profile.menu.customerSupport'),
              message: i18n.t('profile.menu.supportMsg'),
              iconName: 'headset-outline',
              iconColor: Colors.accent.green,
              iconBgColor: 'rgba(0, 230, 118, 0.15)',
              primaryButtonText: i18n.t('common.close'),
              actionUrl: 'mailto:fitbase.support@gmail.com?subject=FitBase%20Support',
              actionUrlLabel: 'fitbase.support@gmail.com',
            })
          );
        },
      }),
      new ProfileMenuItem({
        id: 'sup_legal',
        title: i18n.t('profile.menu.legal'),
        iconName: 'document-text-outline',
        iconColor: Colors.accent.sky,
        onPress: () => {
          callbacks.onShowDialog?.(
            FitbaseDialogConfig.info(
              i18n.t('profile.menu.legal'),
              i18n.t('profile.menu.legalMsg'),
              {
                iconName: 'document-text-outline',
                iconColor: Colors.accent.sky,
                iconBgColor: 'rgba(56, 189, 248, 0.15)',
                primaryButtonText: i18n.t('common.understood'),
              }
            )
          );
        },
      }),
    ];
  }

  private getSocialItems(): ProfileMenuItem[] {
    return [
      new ProfileMenuItem({
        id: 'soc_instagram',
        title: 'Instagram',
        iconName: 'logo-instagram',
        iconColor: '#E1306C',
        iconBgColor: 'rgba(225, 48, 108, 0.12)',
        externalUrl: 'https://www.instagram.com/fitbasehu/',
      }),
      new ProfileMenuItem({
        id: 'soc_facebook',
        title: 'Facebook',
        iconName: 'logo-facebook',
        iconColor: '#1877F2',
        iconBgColor: 'rgba(24, 119, 242, 0.12)',
        externalUrl: 'https://www.facebook.com/profile.php?id=61596445141944',
      }),
      new ProfileMenuItem({
        id: 'soc_x',
        title: 'X',
        iconName: 'logo-twitter',
        iconColor: '#FFFFFF',
        iconBgColor: 'rgba(255, 255, 255, 0.10)',
        externalUrl: 'https://x.com/Fitbase_app',
      }),
    ];
  }

  private getAccountItems(onLogout: () => void): ProfileMenuItem[] {
    return [
      new ProfileMenuItem({
        id: 'acc_logout',
        title: i18n.t('profile.menu.logOut'),
        iconName: 'log-out-outline',
        isDestructive: true,
        showChevron: true,
        onPress: onLogout,
      }),
    ];
  }
}

export const profileMenuService = new ProfileMenuService();
