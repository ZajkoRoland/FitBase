import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthToggle } from '@/components/auth/AuthToggle';
import { BrandLogo } from '@/components/auth/BrandLogo';
import { ForgotPasswordLink } from '@/components/auth/ForgotPasswordLink';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { SocialButton } from '@/components/auth/SocialButton';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const KEYBOARD_FIELD_CLEARANCE = 92;

type AuthFieldKey = 'name' | 'email' | 'password' | 'confirmPassword';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { androidBottomOffset, isKeyboardVisible } = useKeyboardOffset();

  const [activeMode, setActiveMode] = useState<'login' | 'signup'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isForgotPasswordVisible, setIsForgotPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const scrollViewHeightRef = useRef<number>(0);
  const currentScrollYRef = useRef<number>(0);
  const formYRef = useRef<number>(0);
  const fieldLayoutsRef = useRef<Partial<Record<AuthFieldKey, { y: number; height: number }>>>({});
  const focusedFieldRef = useRef<AuthFieldKey | null>(null);

  const ensureFieldVisible = useCallback(
    (field: AuthFieldKey) => {
      const fieldLayout = fieldLayoutsRef.current[field];
      const viewportHeight = scrollViewHeightRef.current;
      if (!fieldLayout || viewportHeight <= 0) {
        return;
      }

      const fieldTop = formYRef.current + fieldLayout.y;
      const fieldBottom = fieldTop + fieldLayout.height;
      const desiredBottom = fieldBottom + KEYBOARD_FIELD_CLEARANCE;
      const currentScrollY = currentScrollYRef.current;

      if (desiredBottom - currentScrollY > viewportHeight) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, desiredBottom - viewportHeight),
          animated: true,
        });
      } else if (fieldTop < currentScrollY + insets.top + 16) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, fieldTop - insets.top - 24),
          animated: true,
        });
      }
    },
    [insets.top]
  );

  const registerFieldLayout =
    (field: AuthFieldKey) =>
    (event: LayoutChangeEvent): void => {
      const { y, height } = event.nativeEvent.layout;
      fieldLayoutsRef.current[field] = { y, height };
    };

  const handleFieldFocus = (field: AuthFieldKey) => () => {
    focusedFieldRef.current = field;
    if (isKeyboardVisible) {
      requestAnimationFrame(() => ensureFieldVisible(field));
    }
  };

  const handleFieldBlur = (field: AuthFieldKey) => () => {
    if (focusedFieldRef.current === field) {
      focusedFieldRef.current = null;
    }
  };

  const handleScrollViewLayout = (event: LayoutChangeEvent) => {
    const prevHeight = scrollViewHeightRef.current;
    const nextHeight = event.nativeEvent.layout.height;
    scrollViewHeightRef.current = nextHeight;

    // When the keyboard opens and shrinks the ScrollView viewport, keep the focused field in view
    if (focusedFieldRef.current && prevHeight > 0 && nextHeight < prevHeight - 40) {
      const activeField = focusedFieldRef.current;
      requestAnimationFrame(() => ensureFieldVisible(activeField));
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const withClearError = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleModeChange = (mode: 'login' | 'signup') => {
    setActiveMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMessage(t('auth.errRequiredFields'));
      return;
    }

    if (activeMode === 'signup') {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setErrorMessage(t('auth.errEnterUsername'));
        return;
      }
      if (trimmedName.length < 2 || trimmedName.length > 30) {
        setErrorMessage(t('auth.errUsernameLength'));
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage(t('auth.errPasswordsMismatch'));
        return;
      }
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      if (activeMode === 'signup') {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundLayer} pointerEvents="none">
        <View style={{ height: '33%', backgroundColor: Colors.background.elevated }} />
        <View style={{ flex: 1, backgroundColor: Colors.background.primary }}>
          <Svg
            height="100"
            width={width}
            viewBox="0 0 1440 100"
            style={{ position: 'absolute', top: -99 }}
            preserveAspectRatio="none">
            <Path
              fill={Colors.background.primary}
              fillOpacity="1"
              d="M0,50 C360,20 1080,80 1440,50 L1440,100 L0,100 Z"
            />
          </Svg>
        </View>
      </View>

      <KeyboardAvoidingView
        style={[
          styles.keyboardContainer,
          Platform.OS === 'android' && androidBottomOffset > 0
            ? { paddingBottom: androidBottomOffset }
            : null,
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          onLayout={handleScrollViewLayout}
          onScroll={(event) => {
            currentScrollYRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 50,
              paddingBottom: isKeyboardVisible ? 32 : insets.bottom + 32,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <BrandLogo />
            <Text style={styles.appName}>FitBase</Text>
            <Text style={styles.motivationText}>
              {t('auth.tagline')}
            </Text>
          </View>

          <AuthToggle activeMode={activeMode} onModeChange={handleModeChange} />

          <View
            style={styles.form}
            onLayout={(event) => {
              formYRef.current = event.nativeEvent.layout.y;
            }}>
            {activeMode === 'signup' && (
              <AuthInput
                label={t('auth.usernameLabel')}
                placeholder={t('auth.usernamePlaceholder')}
                value={name}
                onChangeText={withClearError(setName)}
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailInputRef.current?.focus()}
                onContainerLayout={registerFieldLayout('name')}
                onFocus={handleFieldFocus('name')}
                onBlur={handleFieldBlur('name')}
              />
            )}

            <AuthInput
              ref={emailInputRef}
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={withClearError(setEmail)}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              onContainerLayout={registerFieldLayout('email')}
              onFocus={handleFieldFocus('email')}
              onBlur={handleFieldBlur('email')}
            />

            <AuthInput
              ref={passwordInputRef}
              label={t('auth.passwordLabel')}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={withClearError(setPassword)}
              secureTextEntry
              returnKeyType={activeMode === 'signup' ? 'next' : 'done'}
              blurOnSubmit={activeMode !== 'signup'}
              onSubmitEditing={() => {
                if (activeMode === 'signup') {
                  confirmPasswordInputRef.current?.focus();
                } else {
                  handleAuth();
                }
              }}
              onContainerLayout={registerFieldLayout('password')}
              onFocus={handleFieldFocus('password')}
              onBlur={handleFieldBlur('password')}
            />

            {activeMode === 'login' && (
              <ForgotPasswordLink
                onPress={() => setIsForgotPasswordVisible(true)}
                disabled={isSubmitting || isGoogleSubmitting}
              />
            )}

            {activeMode === 'signup' && (
              <AuthInput
                ref={confirmPasswordInputRef}
                label={t('auth.confirmPasswordLabel')}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={withClearError(setConfirmPassword)}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleAuth}
                onContainerLayout={registerFieldLayout('confirmPassword')}
                onFocus={handleFieldFocus('confirmPassword')}
                onBlur={handleFieldBlur('confirmPassword')}
              />
            )}

            <AuthBanner message={errorMessage} type="error" />
            <AuthBanner message={successMessage} type="success" />

            <AuthButton
              title={activeMode === 'login' ? t('auth.signInBtn') : t('auth.signUpBtn')}
              onPress={handleAuth}
              loading={isSubmitting}
              style={styles.signInButton}
            />
          </View>

          <View
            style={[
              styles.dividerContainer,
              activeMode === 'signup' && styles.dividerContainerSignup,
            ]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.orDivider')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <SocialButton
            title={t('auth.continueWithGoogle')}
            loading={isGoogleSubmitting}
            disabled={isSubmitting || isGoogleSubmitting}
            onPress={handleGoogleSignIn}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal
        visible={isForgotPasswordVisible}
        onClose={() => setIsForgotPasswordVisible(false)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          setErrorMessage(null);
        }}
        initialEmail={email}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: -1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  appName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 22,
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  motivationText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    color: '#6E8EA5',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  signInButton: {
    marginTop: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  dividerContainerSignup: {
    marginTop: 16,
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border.divider,
  },
  dividerText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.text.secondary,
    paddingHorizontal: 16,
  },
});
