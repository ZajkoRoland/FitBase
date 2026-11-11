import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { coachService } from '@/services/CoachService';

interface QuickRepliesProps {
  replies?: string[];
  onSelectReply?: (reply: string) => void;
}

export function QuickReplies({ replies, onSelectReply }: QuickRepliesProps) {
  const displayReplies = replies && replies.length > 0
    ? replies
    : coachService.getInitialQuickReplies();

  if (displayReplies.length === 0) return null;

  return (
    <View style={styles.quickRepliesSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRepliesRow}
      >
        {displayReplies.map((reply, index) => (
          <TouchableOpacity
            key={`${reply}-${index}`}
            style={styles.quickReplyPill}
            onPress={() => onSelectReply?.(reply)}
            activeOpacity={0.7}
          >
            <Text style={styles.replyText} numberOfLines={1}>
              {reply}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  quickRepliesSection: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#0D1528',
  },
  quickRepliesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  quickReplyPill: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    backgroundColor: '#1E2D4A',
    borderColor: '#374F6B',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});
