import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export interface ProfileFeatureCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
  badge?: string;
  badgeColor?: string;
}

// Statisztika grafikon ikon
export function FitbaseAnalyticsIcon(): React.JSX.Element {
  return (
    <View style={styles.analyticsIconBg}>
      <Svg width={34} height={34} viewBox="0 0 36 36" fill="none">
        <Defs>
          <LinearGradient id="fbBarGrad1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.accent.blue} stopOpacity="1" />
            <Stop offset="1" stopColor="rgba(74, 184, 248, 0.25)" stopOpacity="0.25" />
          </LinearGradient>
          <LinearGradient id="fbBarGrad2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.accent.teal} stopOpacity="1" />
            <Stop offset="1" stopColor="rgba(0, 188, 212, 0.25)" stopOpacity="0.25" />
          </LinearGradient>
          <LinearGradient id="fbBarGrad3" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.accent.green} stopOpacity="1" />
            <Stop offset="1" stopColor="rgba(0, 230, 118, 0.25)" stopOpacity="0.25" />
          </LinearGradient>
          <LinearGradient id="fbBarGrad4" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.accent.lime} stopOpacity="1" />
            <Stop offset="1" stopColor="rgba(198, 255, 0, 0.25)" stopOpacity="0.25" />
          </LinearGradient>
        </Defs>

        {/* Diagram oszlopok */}
        <Rect x="5" y="19" width="4.5" height="11" rx="2.25" fill="url(#fbBarGrad1)" />
        <Rect x="12" y="13" width="4.5" height="17" rx="2.25" fill="url(#fbBarGrad2)" />
        <Rect x="19" y="8" width="4.5" height="22" rx="2.25" fill="url(#fbBarGrad3)" />
        <Rect x="26" y="14" width="4.5" height="16" rx="2.25" fill="url(#fbBarGrad4)" />

        {/* Emelkedő grafikon vonal */}
        <Path
          d="M3 24L7.5 24.5L14.2 16L19 20L28 9"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Csúcspont jelző */}
        <Circle cx="28" cy="9" r="3.2" fill={Colors.accent.lime} />
        <Circle cx="28" cy="9" r="1.5" fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

// Visszafelé kompatibilitási alias
export const StatisticsActivityRingsIcon = FitbaseAnalyticsIcon;

// Kitüntetések trófea ikon
export function AchievementsTrophyIcon(): React.JSX.Element {
  return (
    <View style={[styles.iconCircleBg, { backgroundColor: 'rgba(255, 179, 0, 0.14)' }]}>
      <Ionicons name="trophy" size={26} color={Colors.accent.amber} />
    </View>
  );
}

// Kiemelt funkciókártya (statisztika, kitüntetések)
export const ProfileFeatureCard: React.FC<ProfileFeatureCardProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  badge,
  badgeColor = Colors.accent.blue,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
    >
      <View style={styles.iconWrapper}>{icon}</View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {Boolean(badge) && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: `${badgeColor}1F`,
                  borderColor: `${badgeColor}4D`,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.chevronWrapper}>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border.navy,
    marginBottom: 12,
  },
  iconWrapper: {
    marginRight: 14,
  },
  iconCircleBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  analyticsIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.3)',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '400',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chevronWrapper: {
    marginLeft: 8,
    padding: 2,
  },
});

