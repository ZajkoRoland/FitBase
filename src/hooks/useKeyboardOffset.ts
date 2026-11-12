import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface KeyboardOffsetState {
  keyboardHeight: number;
  androidBottomOffset: number;
  isKeyboardVisible: boolean;
}

// Hook a billentyűzet magasságának és láthatóságának követésére
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

