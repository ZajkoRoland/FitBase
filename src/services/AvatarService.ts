import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { i18n } from '@/services/LocalizationService';

const STORAGE_AVATAR_PREFIX = '@fitbase_profile_avatar_uri';

// Profilkép kiválasztása a telefon galériájából és elmentése a tárhelyre
export class AvatarService {
  private static instance: AvatarService;
  private activeUserId: string | null = null;

  private constructor() { }

  public static getInstance(): AvatarService {
    if (!AvatarService.instance) {
      AvatarService.instance = new AvatarService();
    }
    return AvatarService.instance;
  }

  public setActiveUserId(userId: string | null): void {
    this.activeUserId = userId;
  }

  private getKey(userId?: string | null): string | null {
    const uid = userId ?? this.activeUserId;
    if (!uid) return null;
    return `${STORAGE_AVATAR_PREFIX}_${uid}`;
  }

  // Profilkép URI lekérése a helyi tárolóból
  public async getAvatarUri(userId?: string | null): Promise<string | null> {
    try {
      const key = this.getKey(userId);
      if (!key) return null;
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }

  // Kép kiválasztása a galériából négyzetes vágással
  public async pickImageFromGallery(userId?: string | null): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        i18n.t('profile.avatar.permTitle'),
        i18n.t('profile.avatar.permMsg')
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || !result.assets.length) {
      return null;
    }

    const uri = result.assets[0].uri;
    await this.saveAvatarUri(uri, userId);
    return uri;
  }

  // Profilkép URI mentése
  public async saveAvatarUri(uri: string, userId?: string | null): Promise<void> {
    try {
      const key = this.getKey(userId);
      if (!key) return;
      await AsyncStorage.setItem(key, uri);
    } catch (err) {
      console.warn('[AvatarService] Failed to persist avatar URI:', err);
    }
  }

  // Egyedi profilkép törlése
  public async removeAvatar(userId?: string | null): Promise<void> {
    try {
      const key = this.getKey(userId);
      if (!key) return;
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn('[AvatarService] Failed to clear avatar:', err);
    }
  }
}

export const avatarService = AvatarService.getInstance();
