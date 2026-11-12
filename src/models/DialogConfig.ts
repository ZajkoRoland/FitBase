import { Ionicons } from '@expo/vector-icons';
import { i18n } from '@/services/LocalizationService';

export type DialogActionStyle = 'primary' | 'destructive' | 'secondary';

export interface IDialogButton {
  text: string;
  style?: DialogActionStyle;
  onPress?: () => void;
}

export interface IFitbaseDialogConfig {
  title: string;
  message: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  primaryButtonText?: string;
  primaryButtonStyle?: DialogActionStyle;
  secondaryButtonText?: string;
  actionUrl?: string;
  actionUrlLabel?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
}

// Egyedi felugró ablakok konfigurációja
export class FitbaseDialogConfig {
  public readonly title: string;
  public readonly message: string;
  public readonly iconName: keyof typeof Ionicons.glyphMap;
  public readonly iconColor: string;
  public readonly iconBgColor: string;
  public readonly primaryButtonText: string;
  public readonly primaryButtonStyle: DialogActionStyle;
  public readonly secondaryButtonText?: string;
  public readonly actionUrl?: string;
  public readonly actionUrlLabel?: string;
  public readonly onPrimaryPress?: () => void;
  public readonly onSecondaryPress?: () => void;

  constructor(config: IFitbaseDialogConfig) {
    this.title = config.title;
    this.message = config.message;
    this.iconName = config.iconName ?? 'information-circle-outline';
    this.iconColor = config.iconColor ?? '#4AB8F8';
    this.iconBgColor = config.iconBgColor ?? 'rgba(74, 184, 248, 0.15)';
    this.primaryButtonText = config.primaryButtonText ?? i18n.t('common.ok');
    this.primaryButtonStyle = config.primaryButtonStyle ?? 'primary';
    this.secondaryButtonText = config.secondaryButtonText;
    this.actionUrl = config.actionUrl;
    this.actionUrlLabel = config.actionUrlLabel;
    this.onPrimaryPress = config.onPrimaryPress;
    this.onSecondaryPress = config.onSecondaryPress;
  }

  // Információs ablak létrehozása
  public static info(
    title: string,
    message: string,
    options?: Partial<IFitbaseDialogConfig>
  ): FitbaseDialogConfig {
    return new FitbaseDialogConfig({
      title,
      message,
      iconName: options?.iconName ?? 'information-circle-outline',
      iconColor: options?.iconColor ?? '#4AB8F8',
      iconBgColor: options?.iconBgColor ?? 'rgba(74, 184, 248, 0.15)',
      primaryButtonText: options?.primaryButtonText ?? i18n.t('common.gotIt'),
      primaryButtonStyle: 'primary',
      actionUrl: options?.actionUrl,
      actionUrlLabel: options?.actionUrlLabel,
      onPrimaryPress: options?.onPrimaryPress,
    });
  }

  // Sikeres művelet ablak
  public static success(
    title: string,
    message: string,
    options?: Partial<IFitbaseDialogConfig>
  ): FitbaseDialogConfig {
    return new FitbaseDialogConfig({
      title,
      message,
      iconName: options?.iconName ?? 'checkmark-circle-outline',
      iconColor: options?.iconColor ?? '#00E676',
      iconBgColor: options?.iconBgColor ?? 'rgba(0, 230, 118, 0.15)',
      primaryButtonText: options?.primaryButtonText ?? i18n.t('common.awesome'),
      primaryButtonStyle: 'primary',
      onPrimaryPress: options?.onPrimaryPress,
    });
  }

  // Figyelmeztető ablak
  public static warning(
    title: string,
    message: string,
    options?: Partial<IFitbaseDialogConfig>
  ): FitbaseDialogConfig {
    return new FitbaseDialogConfig({
      title,
      message,
      iconName: options?.iconName ?? 'warning-outline',
      iconColor: options?.iconColor ?? '#FFB300',
      iconBgColor: options?.iconBgColor ?? 'rgba(255, 179, 0, 0.15)',
      primaryButtonText: options?.primaryButtonText ?? i18n.t('common.gotIt'),
      primaryButtonStyle: 'primary',
      onPrimaryPress: options?.onPrimaryPress,
    });
  }

  // Hibaüzenet ablak
  public static error(
    title: string,
    message: string,
    options?: Partial<IFitbaseDialogConfig>
  ): FitbaseDialogConfig {
    return new FitbaseDialogConfig({
      title,
      message,
      iconName: options?.iconName ?? 'alert-circle-outline',
      iconColor: options?.iconColor ?? '#FF5252',
      iconBgColor: options?.iconBgColor ?? 'rgba(255, 82, 82, 0.15)',
      primaryButtonText: options?.primaryButtonText ?? i18n.t('common.ok'),
      primaryButtonStyle: 'destructive',
      onPrimaryPress: options?.onPrimaryPress,
    });
  }

  // Megerősítő kérdés ablak (pl. kijelentkezés, törlés)
  public static confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    options?: Partial<IFitbaseDialogConfig>
  ): FitbaseDialogConfig {
    return new FitbaseDialogConfig({
      title,
      message,
      iconName: options?.iconName ?? 'help-circle-outline',
      iconColor: options?.iconColor ?? '#4AB8F8',
      iconBgColor: options?.iconBgColor ?? 'rgba(74, 184, 248, 0.15)',
      primaryButtonText: options?.primaryButtonText ?? i18n.t('common.confirm'),
      primaryButtonStyle: options?.primaryButtonStyle ?? 'primary',
      secondaryButtonText: options?.secondaryButtonText ?? i18n.t('common.cancel'),
      onPrimaryPress: onConfirm,
      onSecondaryPress: options?.onSecondaryPress,
    });
  }
}
