import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { coachService } from '@/services/CoachService';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

const AvatarIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={Colors.accent.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

interface CoachHeaderProps {
  statusText?: string;
}

export function CoachHeader({ statusText }: CoachHeaderProps = {}) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const displayStatus = statusText ?? coachService.getStatusText();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <View style={styles.avatarGlowOuter}>
        <View style={styles.avatarGlowInner}>
          <View style={styles.avatarContainer}>
            <AvatarIcon />
          </View>
        </View>
      </View>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>{t('coach.headerTitle')}</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{displayStatus}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#152038',
  },
  avatarGlowOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: 'rgba(74, 184, 248, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarGlowInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: 'rgba(74, 184, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgb(79, 195, 247)',
    backgroundColor: 'rgba(74, 184, 248, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.green,
    marginRight: 6,
  },
  statusText: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
});
