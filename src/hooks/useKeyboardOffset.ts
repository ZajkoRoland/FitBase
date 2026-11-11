import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface KeyboardOffsetState {
  /** Net keyboard height reported by React Native (above system navigation bar on Android). */
  keyboardHeight: number;
  /** Total bottom inset occupied by the open keyboard on Android edge-to-edge layouts. */
  androidBottomOffset: number;
  /** Whether the software keyboard is currently visible. */
  isKeyboardVisible: boolean;
}

/**
 * Tracks software keyboard visibility and exact height across iOS and Android (Edge-to-Edge).
 *
 * Under Expo SDK 57 (`edgeToEdgeEnabled=true`), Android sets `setDecorFitsSystemWindows(false)`,
 * so the root view no longer shrinks automatically via `adjustResize`. Meanwhile, React Native's
 * `keyboardDidShow` reports `imeInsets.bottom - barInsets.bottom` in `endCoordinates.height`.
 * Adding `insets.bottom + keyboardHeight` yields the exact pixel-accurate IME overlap from the
 * physical bottom edge of the screen.
 */
export function useKeyboardOffset(): KeyboardOffsetState {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useEffect(() => {
    if (!Keyboard.isVisible()) {
      setKeyboardHeight(0);
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event: KeyboardEvent) => {
      const nextHeight = Math.max(0, Math.round(event.endCoordinates?.height ?? 0));
      setKeyboardHeight(nextHeight);
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isKeyboardVisible = keyboardHeight > 0;
  const androidBottomOffset =
    Platform.OS === 'android' && isKeyboardVisible ? insets.bottom + keyboardHeight : 0;

  return {
    keyboardHeight,
    androidBottomOffset,
    isKeyboardVisible,
  };
}

