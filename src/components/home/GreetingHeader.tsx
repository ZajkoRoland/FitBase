import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { DateHelper } from '@/utils/DateHelper';
import { NotificationBadge } from '@/components/home/NotificationBadge';
import { NotificationPopover } from '@/components/home/NotificationPopover';
import { NotificationService } from '@/services/NotificationService';
import { NotificationItem } from '@/models/NotificationItem';

export function GreetingHeader(): React.JSX.Element {
  const { profile } = useProfile();
  const { language, t, i18n } = useLanguage();
  const firstName = profile?.display_name || profile?.username || t('greeting.defaultUser');
  const dateLabel = useMemo(() => i18n.formatGreetingDate(new Date()), [language, i18n]);
  const greeting = useMemo(() => DateHelper.getTimeBasedGreeting(), [language]);
  const notificationService = useMemo(() => NotificationService.getInstance(), []);

  const [popoverVisible, setPopoverVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    notificationService.getNotifications()
  );
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    notificationService.getUnreadCount()
  );

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setNotifications(notificationService.getNotifications());
      setUnreadCount(notificationService.getUnreadCount());
    });
    return unsubscribe;
  }, [notificationService]);

  const handleTogglePopover = () => {
    setPopoverVisible((prev) => !prev);
  };

  const handleClosePopover = () => {
    setPopoverVisible(false);
  };

  const handleItemPress = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
  };

  return (
    <>
      <View key={language} style={headerStyle.row}>
        <View>
          <Text style={headerStyle.dateLabel}>{dateLabel}</Text>
          <Text style={headerStyle.greeting}>{greeting}, {firstName} 👋</Text>
        </View>

        <TouchableOpacity
          style={headerStyle.bellBtn}
          activeOpacity={0.8}
          onPress={handleTogglePopover}
          accessibilityRole="button"
          accessibilityLabel={t('notifications.unreadA11y', { count: unreadCount })}
        >
          <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 8.5C18 5.46 15.31 3 12 3C8.69 3 6 5.46 6 8.5C6 14.5 3.5 16.5 3.5 16.5H20.5C20.5 16.5 18 14.5 18 8.5Z"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M13.7 18.5C13.5 19.8 12.8 20.8 12 20.8C11.2 20.8 10.5 19.8 10.3 18.5"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </Svg>

          <NotificationBadge count={unreadCount} />
        </TouchableOpacity>
      </View>

      <NotificationPopover
        visible={popoverVisible}
        notifications={notifications}
        unreadCount={unreadCount}
        onClose={handleClosePopover}
        onItemPress={handleItemPress}
        onDelete={handleDelete}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
      />
    </>
  );
}

const headerStyle = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 4,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#152038',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
