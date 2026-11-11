import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

interface AuthBannerProps {
  message: string | null;
  type?: 'error' | 'success';
}
export function AuthBanner({ message, type = 'error' }: AuthBannerProps) {
  if (!message) {
    return null;
  }

  const isError = type === 'error';
  const iconName = isError ? 'alert-circle-outline' : 'checkmark-circle-outline';
  const color = isError ? Colors.status.error : Colors.status.success;

  const customStyles = {
    borderColor: isError ? Colors.status.errorBorder : Colors.status.successBorder,
    backgroundColor: isError ? Colors.status.errorBg : Colors.status.successBg,
  };

  return (
    <Animated.View
      key={message}
      entering={FadeInDown.duration(250)}
      exiting={FadeOut.duration(150)}
      style={[styles.container, customStyles]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <Ionicons name={iconName} size={20} color={color} />
      <Text style={[styles.text, { color }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 4,
  },
  text: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 18,
  },
});
