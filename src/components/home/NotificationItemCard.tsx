import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { NotificationItem } from '@/models/NotificationItem';

interface NotificationItemCardProps {
  item: NotificationItem;
  onPress: (id: string) => void;
  onDelete?: (id: string) => void;
}

function renderMutedIcon(category: string) {
  const size = 18;
  const strokeColor = '#94A3B8';

  switch (category) {
    case 'workout':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12" />
        </Svg>
      );
    case 'recovery':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </Svg>
      );
    case 'streak':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </Svg>
      );
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
        </Svg>
      );
  }
}

export function NotificationItemCard({
  item,
  onPress,
  onDelete,
}: NotificationItemCardProps): React.JSX.Element {
  const { t } = useLanguage();
  const localizedTimestamp = item.getLocalizedTimestamp();
  const categoryLabel = item.getCategoryLabel();

  const handlePress = () => {
    if (!item.isRead) {
      onPress(item.id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        cardStyles.container,
        !item.isRead && cardStyles.unreadContainer,
      ]}
      activeOpacity={0.8}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${localizedTimestamp}`}
    >
      {/* Category badge */}
      <View style={cardStyles.iconCircle}>
        {renderMutedIcon(item.category)}
      </View>

      <View style={cardStyles.contentColumn}>
        {/* Metadata row */}
        <View style={cardStyles.headerRow}>
          <View style={cardStyles.titleWrapper}>
            <Text style={cardStyles.appNameText}>
              FitBase <Text style={cardStyles.categorySeparator}>·</Text> {categoryLabel}
            </Text>
            <Text style={cardStyles.timestampText}>{localizedTimestamp}</Text>
          </View>

            {onDelete && (
            <TouchableOpacity
              style={cardStyles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={(e) => {
                e.stopPropagation?.();
                onDelete(item.id);
              }}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={t('notifications.deleteLabel')}
            >
              <Text style={cardStyles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

          <Text style={cardStyles.titleText}>{item.title}</Text>

          <Text style={cardStyles.messageText}>
          {item.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#152038',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1F2E4D',
    marginBottom: 10,
  },
  unreadContainer: {
    borderColor: 'rgba(74, 184, 248, 0.4)',
    backgroundColor: '#162440',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#26344D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#334466',
  },
  contentColumn: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  appNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  categorySeparator: {
    color: '#64748B',
    fontWeight: '400',
  },
  timestampText: {
    fontSize: 11,
    color: '#64748B',
  },
  deleteBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 3,
  },
  messageText: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#94A3B8',
  },
});
