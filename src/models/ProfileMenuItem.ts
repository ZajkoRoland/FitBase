import * as Linking from 'expo-linking';

export type MenuIconFamily = 'ionicons' | 'material' | 'feather';

export interface IProfileMenuItemData {
  id: string;
  title: string;
  subtitle?: string;
  iconName: string;
  iconFamily?: MenuIconFamily;
  iconColor?: string;
  iconBgColor?: string;
  onPress?: () => void;
  externalUrl?: string;
  showChevron?: boolean;
  isDestructive?: boolean;
  valueBadge?: string;
  isSwitch?: boolean;
  switchValue?: boolean;
  onToggleSwitch?: (value: boolean) => void;
}

/**
 * ProfileMenuItem
 * Encapsulates the configuration and execution behavior for each profile menu item.
 */
export class ProfileMenuItem {
  public readonly id: string;
  public readonly title: string;
  public readonly subtitle?: string;
  public readonly iconName: string;
  public readonly iconFamily: MenuIconFamily;
  public readonly iconColor?: string;
  public readonly iconBgColor?: string;
  public readonly onPress?: () => void;
  public readonly externalUrl?: string;
  public readonly showChevron: boolean;
  public readonly isDestructive: boolean;
  public readonly valueBadge?: string;
  public readonly isSwitch: boolean;
  public readonly switchValue: boolean;
  public readonly onToggleSwitch?: (value: boolean) => void;

  constructor(data: IProfileMenuItemData) {
    this.id = data.id;
    this.title = data.title;
    this.subtitle = data.subtitle;
    this.iconName = data.iconName;
    this.iconFamily = data.iconFamily ?? 'ionicons';
    this.iconColor = data.iconColor;
    this.iconBgColor = data.iconBgColor;
    this.onPress = data.onPress;
    this.externalUrl = data.externalUrl;
    this.showChevron = data.isSwitch ? false : (data.showChevron ?? true);
    this.isDestructive = Boolean(data.isDestructive);
    this.valueBadge = data.valueBadge;
    this.isSwitch = Boolean(data.isSwitch);
    this.switchValue = Boolean(data.switchValue);
    this.onToggleSwitch = data.onToggleSwitch;
  }

  /**
   * Executes the item's action: either opens an external link or executes the registered handler.
   */
  public async execute(): Promise<void> {
    if (this.isSwitch && this.onToggleSwitch) {
      this.onToggleSwitch(!this.switchValue);
      return;
    }

    if (this.externalUrl) {
      try {
        const supported = await Linking.canOpenURL(this.externalUrl);
        if (supported) {
          await Linking.openURL(this.externalUrl);
          return;
        }
        await Linking.openURL(this.externalUrl);
        return;
      } catch {
        try {
          await Linking.openURL(this.externalUrl);
          return;
        } catch (e) {
          console.warn('Failed to open URL:', this.externalUrl, e);
        }
      }
    }

    if (this.onPress) {
      this.onPress();
    }
  }
}
