import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';

interface ForgotPasswordLinkProps {
  onPress: () => void;
  disabled?: boolean;
}

// Elfelejtett jelszó hivatkozás gomb
export const ForgotPasswordLink: React.FC<ForgotPasswordLinkProps> = ({
  onPress,
  disabled = false,
}) => {
  const { t } = useLanguage();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={t('auth.forgotPassword')}
    >
      <Text style={styles.text}>{t('auth.forgotPassword')}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 14,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  text: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: Colors.accent.sky,
  },
});

