import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type AuthMode = 'login' | 'signup';

interface AuthToggleProps {
  activeMode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

export function AuthToggle({ activeMode, onModeChange }: AuthToggleProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pill, activeMode === 'login' && styles.activePill]}
        onPress={() => onModeChange('login')}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.text,
            activeMode === 'login' ? styles.activeText : styles.inactiveText,
          ]}
        >
          {t('auth.loginTab')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.pill, activeMode === 'signup' && styles.activePill]}
        onPress={() => onModeChange('signup')}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.text,
            activeMode === 'signup' ? styles.activeText : styles.inactiveText,
          ]}
        >
          {t('auth.signupTab')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: Colors.background.primary,
    borderRadius: 24,
    padding: 4,
    borderWidth: 2,
    borderColor: '#374F6B',
    marginVertical: 24,
  },
  pill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  activePill: {
    backgroundColor: Colors.accent.sky, // #4FC3F7
    shadowColor: Colors.accent.sky,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
    boxShadow: '0 0 10px rgba(79, 195, 247, 0.55)',
  },
  text: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  activeText: {
    color: Colors.background.primary,
  },
  inactiveText: {
    color: '#6E8EA5',
  },
});
