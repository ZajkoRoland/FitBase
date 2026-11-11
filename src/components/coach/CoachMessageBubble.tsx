import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import Svg, { Circle, Path } from 'react-native-svg';

interface CoachMessageBubbleProps {
  text: string;
  timestamp: string;
}

const SmallCoachAvatar = () => (
  <View style={styles.avatarContainer}>
    <Svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={Colors.accent.blue}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  </View>
);

export function CoachMessageBubble({ text, timestamp }: CoachMessageBubbleProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <SmallCoachAvatar />
        <Text style={styles.senderName}>{t('coach.senderAi')}</Text>
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
    alignSelf: 'flex-start',
    maxWidth: '85%',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 184, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgb(79, 195, 247)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderName: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent.blue,
    letterSpacing: 0.5,
  },
  bubble: {
    backgroundColor: '#152038',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1F2F4D',
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
    marginLeft: 4,
  },
});
