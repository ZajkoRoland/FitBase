import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { ChatInput } from '@/components/coach/ChatInput';
import { CoachHeader } from '@/components/coach/CoachHeader';
import { CoachMessageBubble } from '@/components/coach/CoachMessageBubble';
import { QuickReplies } from '@/components/coach/QuickReplies';
import { UserMessageBubble } from '@/components/coach/UserMessageBubble';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/context/LanguageProvider';
import { usePlan } from '@/context/PlanProvider';
import { useProfile } from '@/context/ProfileProvider';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { coachService } from '@/services/CoachService';
import type { ChatMessage } from '@/types/coach';

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const { profile, refreshProfile } = useProfile();
  const { weekPlan, refreshPlan } = usePlan();
  const { language, isHungarian, t, i18n } = useLanguage();
  const { androidBottomOffset, isKeyboardVisible } = useKeyboardOffset();

  const userName = profile?.display_name || profile?.username || '';
  const isRest = coachService.isTodayRestDay(weekPlan);
  const todayWorkout = coachService.getTodayWorkoutTitle(weekPlan);

  const buildWelcomeMessage = () => {
    const formattedName = userName ? ` ${userName}` : '';
    if (isRest) {
      return t('coach.welcomeRest', { name: formattedName });
    }
    return t('coach.welcomeWorkout', { name: formattedName, workout: todayWorkout });
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'coach',
      text: buildWelcomeMessage(),
      timestamp: coachService.getCurrentTime(),
    },
  ]);

  const [quickReplies, setQuickReplies] = useState<string[]>(() =>
    coachService.getInitialQuickReplies(isHungarian ? 'hu' : 'en')
  );
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customStatus, setCustomStatus] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const params = useLocalSearchParams<{ initialPrompt?: string; autoSend?: string }>();
  const handledPromptRef = useRef<string | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Automatikus üzenetküldés a Terv képernyőről érkező paraméterek alapján (1, 2 vagy 4 hetes terv)
  useEffect(() => {
    if (params.initialPrompt && handledPromptRef.current !== params.initialPrompt) {
      handledPromptRef.current = params.initialPrompt;
      const promptText = params.initialPrompt;
      if (params.autoSend === 'true') {
        const timer = setTimeout(() => {
          handleSendMessage(promptText);
        }, 250);
        return () => clearTimeout(timer);
      } else {
        setInputText(promptText);
      }
    }
  }, [params.initialPrompt, params.autoSend]);

  // Üdvözlő üzenet és gombok frissítése profil-, terv- vagy nyelvváltáskor
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-1') {
        return [
          {
            id: 'welcome-1',
            sender: 'coach',
            text: buildWelcomeMessage(),
            timestamp: prev[0].timestamp,
          },
        ];
      }
      return prev;
    });
    setQuickReplies(coachService.getInitialQuickReplies(isHungarian ? 'hu' : 'en'));
    setCustomStatus(null);
  }, [userName, todayWorkout, isRest, language, isHungarian]);

  useEffect(() => {
    if (isKeyboardVisible) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isKeyboardVisible]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend ?? inputText).trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: content,
      timestamp: coachService.getCurrentTime(),
    };

    const currentMessages = messagesRef.current;
    const updatedMessages = [...currentMessages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      let response;
      try {
        response = await coachService.sendChatMessage(
          content,
          updatedMessages,
          isHungarian ? 'hu' : 'en'
        );
      } catch (firstErr) {
        console.warn('[CoachScreen] First attempt failed, retrying once...', firstErr);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        response = await coachService.sendChatMessage(
          content,
          updatedMessages,
          isHungarian ? 'hu' : 'en'
        );
      }

      const coachReply: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: response.reply_text,
        timestamp: coachService.getCurrentTime(),
      };

      setMessages((prev) => [...prev, coachReply]);
      if (response.quick_replies && response.quick_replies.length > 0) {
        setQuickReplies(response.quick_replies);
      }
      if (response.plan_modification) {
        try {
          await Promise.all([refreshPlan(), refreshProfile()]);
        } catch (planErr) {
          console.error('[CoachScreen] Failed to refresh plan & profile:', planErr);
        }
        if (response.plan_modification.action === 'set_rest_day') {
          setCustomStatus(
            t('coach.statusToday', { workout: t('plan.restDayTitle') })
          );
        } else if (response.plan_modification.workout_title) {
          setCustomStatus(
            t('coach.statusToday', {
              workout: i18n.translateWorkoutTitle(response.plan_modification.workout_title),
            })
          );
        } else {
          setCustomStatus(null);
        }
      }
    } catch (error) {
      console.error('[CoachScreen] Send message error:', error);
      const errorReply: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'coach',
        text: t('coach.errConnection'),
        timestamp: coachService.getCurrentTime(),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <View key={language} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={[
          styles.container,
          Platform.OS === 'android' && isKeyboardVisible
            ? { paddingBottom: androidBottomOffset }
            : undefined,
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <CoachHeader statusText={customStatus ?? coachService.getStatusText(weekPlan)} />

        <View style={styles.chatArea}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              item.sender === 'coach' ? (
                <CoachMessageBubble
                  text={item.text}
                  timestamp={item.timestamp}
                />
              ) : (
                <UserMessageBubble
                  text={item.text}
                  timestamp={item.timestamp}
                />
              )
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        </View>

        <View style={styles.bottomWrapper}>
          <QuickReplies
            replies={quickReplies}
            onSelectReply={(reply) => handleSendMessage(reply)}
          />
          <ChatInput
            value={inputText}
            onChangeText={setInputText}
            onSend={() => handleSendMessage()}
            loading={isLoading}
            isKeyboardOpen={isKeyboardVisible}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D1528',
  },
  container: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 16,
  },
  bottomWrapper: {
    backgroundColor: '#152038',
  },
});
