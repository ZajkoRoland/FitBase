import React from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  loading?: boolean;
  placeholder?: string;
  isKeyboardOpen?: boolean;
}

const SendIcon = ({ active }: { active: boolean }) => (
  <Svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? Colors.accent.blue : '#4A5568'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Line x1="22" y1="2" x2="11" y2="13" />
    <Polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Svg>
);

export function ChatInput({
  value,
  onChangeText,
  onSend,
  loading = false,
  placeholder,
  isKeyboardOpen = false,
}: ChatInputProps) {
  const { t } = useLanguage();
  const displayPlaceholder = placeholder ?? t('coach.inputPlaceholder');
  const canSend = value.trim().length > 0 && !loading;

  return (
    <View style={[styles.inputSection, isKeyboardOpen && styles.inputSectionKeyboardOpen]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={displayPlaceholder}
          placeholderTextColor="#4A5568"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={() => {
            if (canSend) onSend();
          }}
          returnKeyType="send"
          editable={!loading}
        />
      </View>
      <TouchableOpacity
        style={[styles.sendButton, canSend && styles.sendButtonActive]}
        activeOpacity={0.7}
        onPress={onSend}
        disabled={!canSend}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.accent.blue} />
        ) : (
          <SendIcon active={canSend} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#152038',
  },
  inputSectionKeyboardOpen: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  inputContainer: {
    flex: 1,
    height: 48,
    backgroundColor: '#1E2D4A',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#374F6B',
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E2D4A',
    borderWidth: 2,
    borderColor: '#374F6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    borderColor: Colors.accent.blue,
  },
});
