import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { NavigationBarMetrics } from '@/utils/NavigationBarMetrics';

type IconName = 'home' | 'coach' | 'plan' | 'library' | 'profile';

function renderSvgIcon(name: IconName, color: string, focused: boolean) {
  const size = 22;
  const strokeWidth = 2;

  switch (name) {
    case 'home':
      return (
        <Svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={focused ? Colors.accent.blue : color}
          strokeWidth={focused ? 2.3 : strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <Path d="M9 22V12h6v10" />
        </Svg>
      );

    case 'coach':
      if (focused) {
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
            <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </Svg>
        );
      }
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </Svg>
      );

    case 'plan':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={focused ? strokeWidth + 0.4 : strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <Line x1="16" y1="2" x2="16" y2="6" />
          <Line x1="8" y1="2" x2="8" y2="6" />
          <Line x1="3" y1="10" x2="21" y2="10" />
        </Svg>
      );

    case 'library':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={focused ? strokeWidth + 0.4 : strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </Svg>
      );

    case 'profile':
      if (focused) {
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
          </Svg>
        );
      }
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );

    default:
      return null;
  }
}

function renderTabIcon(name: IconName, focused: boolean) {
  const iconColor = focused ? Colors.accent.blue : Colors.ui.tabInactive;
  return (
    <View style={[styles.pillContainer, focused && styles.pillContainerActive]}>
      {renderSvgIcon(name, iconColor, focused)}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const metrics = useMemo(
    () => NavigationBarMetrics.calculateDimensions(insets.bottom),
    [insets.bottom]
  );

  return (
    <Tabs
      key={language}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            height: metrics.height,
            paddingBottom: metrics.paddingBottom,
            paddingTop: metrics.paddingTop,
          },
        ],
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.accent.blue,
        tabBarInactiveTintColor: Colors.ui.tabInactive,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
        tabBarButton: (props) => (
          <Pressable
            {...(props as any)}
            android_ripple={null}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => renderTabIcon('home', focused),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: t('tabs.coach'),
          tabBarIcon: ({ focused }) => renderTabIcon('coach', focused),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: t('tabs.plan'),
          tabBarIcon: ({ focused }) => renderTabIcon('plan', focused),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('tabs.library'),
          tabBarIcon: ({ focused }) => renderTabIcon('library', focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => renderTabIcon('profile', focused),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.ui.tabBar,
    borderTopColor: Colors.border.default,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
  },
  pillContainer: {
    width: 44,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pillContainerActive: {
    backgroundColor: 'rgba(74, 184, 248, 0.16)',
  },
});
