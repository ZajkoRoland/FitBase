import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { authRepository } from '@/repositories/AuthRepository';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialEmail?: string;
}

type ResetStep = 'email' | 'code';

/**
 * ForgotPasswordModal
 * Isolated, two-stage modal component dedicated to account recovery via 6-digit email verification.
 */
export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialEmail = '',
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { androidBottomOffset, isKeyboardVisible } = useKeyboardOffset();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 20);

  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const newPasswordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [visible, initialEmail, email]);

  const handleResetAndClose = () => {
    setStep('email');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setLoading(false);
    onClose();
  };

  const handleSendCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage(t('auth.errRequiredFields'));
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      await authRepository.requestPasswordReset(trimmedEmail);
      setStep('code');
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode || !newPassword || !confirmPassword) {
      setErrorMessage(t('auth.errRequiredFields'));
      return;
    }

    if (trimmedCode.length !== 6) {
      setErrorMessage(t('auth.errInvalidResetCode'));
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(t('auth.errWeakPassword'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('auth.errPasswordsMismatch'));
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      await authRepository.confirmPasswordReset(email.trim(), trimmedCode, newPassword);
      handleResetAndClose();
      onSuccess(t('auth.resetSuccess'));
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleResetAndClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.backdrop,
          {
            paddingTop: insets.top + 16,
            paddingBottom:
              Platform.OS === 'android' && androidBottomOffset > 0
                ? androidBottomOffset + 12
                : bottomInset,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleResetAndClose} />

        <View style={[styles.card, { paddingBottom: isKeyboardVisible ? 20 : bottomInset }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="key-outline" size={20} color={Colors.accent.sky} />
              </View>
              <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
            </View>
            <TouchableOpacity
              onPress={handleResetAndClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Subtitle / Instructions */}
            <Text style={styles.subtitle}>
              {step === 'email'
                ? t('auth.forgotPasswordSubtitle')
                : t('auth.codeSentSuccess')}
            </Text>

            {/* Error banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF5252" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Stage 1: Email input */}
            {step === 'email' && (
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>{t('auth.emailLabel')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={18} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={Colors.text.ghost}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                    onSubmitEditing={handleSendCode}
                  />
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleResetAndClose}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>{t('auth.backToEmailBtn')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleSendCode}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#0D1528" />
                    ) : (
                      <Text style={styles.primaryBtnText}>{t('auth.sendCodeBtn')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Stage 2: 6-digit Code + New Password */}
            {step === 'code' && (
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>{t('auth.codeLabel')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={Colors.accent.sky} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, styles.codeInput]}
                    value={code}
                    onChangeText={(val) => {
                      setCode(val.replace(/\D/g, '').slice(0, 6));
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={t('auth.codePlaceholder')}
                    placeholderTextColor={Colors.text.ghost}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => newPasswordInputRef.current?.focus()}
                  />
                </View>

                <Text style={styles.inputLabel}>{t('auth.newPasswordLabel')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    ref={newPasswordInputRef}
                    style={styles.textInput}
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={t('auth.passwordPlaceholder')}
                    placeholderTextColor={Colors.text.ghost}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>{t('auth.confirmNewPasswordLabel')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    ref={confirmPasswordInputRef}
                    style={styles.textInput}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    placeholderTextColor={Colors.text.ghost}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleConfirmReset}
                  />
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setStep('email')}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>{t('auth.backToEmailBtn')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleConfirmReset}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#0D1528" />
                    ) : (
                      <Text style={styles.primaryBtnText}>{t('auth.resetPasswordSubmitBtn')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '100%',
    flexShrink: 1,
    backgroundColor: Colors.background.elevated,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border.navy,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#FF8A80',
  },
  formSection: {
    width: '100%',
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#243452',
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.text.primary,
    height: '100%',
  },
  codeInput: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 6,
  },
  eyeBtn: {
    padding: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  primaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.accent.sky,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1528',
  },
});

