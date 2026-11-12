import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';

interface NotificationBadgeProps {
  count: number;
}

// Olvasatlan értesítéseket jelző jelvény
export function NotificationBadge({ count }: NotificationBadgeProps): React.JSX.Element | null {
  if (count <= 0) {
    return null;
  }

  const displayCount = count > 9 ? '9+' : String(count);

  return (
    <View style={badgeStyles.badgeContainer} pointerEvents="none">
      <Text style={badgeStyles.badgeText}>{displayCount}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#0D1527', // Contrast ring against background
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  badgeText: {
    color: '#0D1527',
    fontSize: 9.5,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 11,
  },
});
