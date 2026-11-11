import { Colors } from '@/constants/Colors';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface AuthButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

export function AuthButton({ title, loading = false, style, disabled, ...props }: AuthButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
      activeOpacity={0.8}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={Colors.background.primary} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.accent.sky,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: Colors.accent.sky,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    boxShadow: '0 0 7px rgba(79, 195, 247, 0.50)',
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
    boxShadow: 'none',
  },
  text: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: Colors.background.primary,
  },
});
