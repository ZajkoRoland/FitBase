import { Colors } from '@/constants/Colors';
import { ProfileMenuItem } from '@/models/ProfileMenuItem';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

interface ProfileMenuRowProps {
  item: ProfileMenuItem;
  isLast?: boolean;
}

/**
 * ProfileMenuRow
 * Renders an isolated, interactive row item inside a profile menu section card.
 * Supports standard click items, chevron arrows, badge indicators, and toggle switches.
 */
export const ProfileMenuRow: React.FC<ProfileMenuRowProps> = ({ item, isLast = false }) => {
  const iconColor = item.isDestructive
    ? Colors.status.error
    : item.iconColor || Colors.accent.blue;

  const iconBgColor = item.isDestructive
    ? Colors.status.errorBg
    : item.iconBgColor || 'rgba(74, 184, 248, 0.12)';

  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={() => item.execute()}
      activeOpacity={item.isSwitch ? 1 : 0.7}
      accessibilityRole={item.isSwitch ? 'switch' : 'button'}
      accessibilityLabel={item.title}
      accessibilityState={item.isSwitch ? { checked: item.switchValue } : undefined}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={item.iconName as any} size={18} color={iconColor} />
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.title, item.isDestructive && styles.destructiveTitle]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {Boolean(item.subtitle) && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
      </View>

      {Boolean(item.valueBadge) && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.valueBadge}</Text>
        </View>
      )}

      {item.isSwitch && (
        <Switch
          value={item.switchValue}
          onValueChange={(val) => item.onToggleSwitch && item.onToggleSwitch(val)}
          trackColor={{ false: '#1A2336', true: Colors.accent.blue }}
          thumbColor={item.switchValue ? '#FFFFFF' : '#8896A5'}
        />
      )}

      {item.showChevron && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={item.isDestructive ? Colors.status.error : Colors.text.ghost}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.default,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
  destructiveTitle: {
    color: Colors.status.error,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(0, 188, 212, 0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.28)',
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent.teal,
    letterSpacing: 0.3,
  },
});
