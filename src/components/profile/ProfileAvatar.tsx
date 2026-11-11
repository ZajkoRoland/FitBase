import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { avatarService } from '@/services/AvatarService';
import { AvatarPickerModal } from './AvatarPickerModal';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ProfileAvatar(): React.JSX.Element {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useProfile();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const name = profile?.display_name || profile?.username || t('greeting.defaultUser');
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'FB';

  useEffect(() => {
    if (!profile?.id) {
      setAvatarUri(null);
      return;
    }
    if (profile.avatar_url) {
      setAvatarUri(profile.avatar_url);
      return;
    }
    avatarService.getAvatarUri(profile.id).then((uri) => {
      setAvatarUri(uri);
    });
  }, [profile?.id, profile?.avatar_url]);

  const handlePickPhoto = async () => {
    const uri = await avatarService.pickImageFromGallery(profile?.id);
    if (uri) {
      setAvatarUri(uri);
      updateProfile({ avatar_url: uri }).catch(() => {});
    }
  };

  const handleRemovePhoto = async () => {
    await avatarService.removeAvatar(profile?.id);
    setAvatarUri(null);
    updateProfile({ avatar_url: null }).catch(() => {});
  };

  const handleAvatarPress = () => {
    setModalVisible(true);
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 20 }]}>
      <TouchableOpacity
        onPress={handleAvatarPress}
        activeOpacity={0.85}
        style={styles.avatarButton}
        accessibilityRole="button"
        accessibilityLabel={t('profile.avatar.changePhotoA11y')}
      >
        <View style={styles.ringOuter}>
          <View style={styles.ring}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.initials}>{initials}</Text>
            )}
          </View>

          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={13} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>

      <Text style={styles.name}>{name}</Text>

      <AvatarPickerModal
        visible={modalVisible}
        hasAvatar={Boolean(avatarUri)}
        onChoosePhoto={handlePickPhoto}
        onRemovePhoto={handleRemovePhoto}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#152038',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatarButton: {
    marginBottom: 10,
  },
  ringOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: Colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: 2,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#152038',
  },
  name: {
    fontSize: 21,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 0,
  },
});
