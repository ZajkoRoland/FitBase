import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { avatarService } from '@/services/AvatarService';

interface UserMessageBubbleProps {
  text: string;
  timestamp: string;
}

const SmallUserAvatar = () => {
  const { profile } = useProfile();
  const { t } = useLanguage();
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url || null);

  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUri(profile.avatar_url);
      return;
    }
    if (profile?.id) {
      avatarService.getAvatarUri(profile.id).then((uri) => {
        setAvatarUri(uri);
      });
    } else {
      setAvatarUri(null);
    }
  }, [profile?.id, profile?.avatar_url]);

  const name = profile?.display_name || profile?.username || t('coach.senderYou');
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={styles.avatarContainer}>
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatarImage}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <Text style={styles.avatarInitials}>{initials || 'U'}</Text>
      )}
    </View>
  );
};

export function UserMessageBubble({ text, timestamp }: UserMessageBubbleProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.senderName}>{t('coach.senderYou')}</Text>
        <SmallUserAvatar />
      </View>

      <View style={styles.bubble}>
        <Text style={styles.messageText}>{text}</Text>
      </View>

      <Text style={styles.timestamp}>{timestamp}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 6,
    gap: 8,
  },
  avatarContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
    borderWidth: 1.5,
    borderColor: Colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
  },
  avatarInitials: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accent.blue,
    letterSpacing: 0.5,
  },
  senderName: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent.blue,
    letterSpacing: 0.5,
  },
  bubble: {
    backgroundColor: '#1E2D4A',
    borderRadius: 20,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: '#374F6B',
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text.primary,
  },
  timestamp: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 4,
    marginRight: 4,
    textAlign: 'right',
  },
});
