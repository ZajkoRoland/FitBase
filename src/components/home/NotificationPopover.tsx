import React from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { NotificationItem } from '@/models/NotificationItem';
import { NotificationItemCard } from '@/components/home/NotificationItemCard';

interface NotificationPopoverProps {
  visible: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  onClose: () => void;
  onItemPress: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function NotificationPopover({
  visible,
  notifications,
  unreadCount,
  onClose,
  onItemPress,
  onDelete,
  onMarkAllAsRead,
  onClearAll,
}: NotificationPopoverProps): React.JSX.Element {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const popoverWidth = Math.min(330, SCREEN_WIDTH - 32);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={popoverStyles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                popoverStyles.popoverCard,
                {
                  top: insets.top + 70,
                  width: popoverWidth,
                },
              ]}
            >
              <View style={popoverStyles.pointerArrow} />

              {/* Fejléc */}
              <View style={popoverStyles.header}>
                <View style={popoverStyles.titleRow}>
                  <Text style={popoverStyles.title}>{t('notifications.title')}</Text>
                  {unreadCount > 0 && (
                    <View style={popoverStyles.unreadPill}>
                      <Text style={popoverStyles.unreadPillText}>
                        {t('notifications.newCount', { count: unreadCount })}
                      </Text>
                    </View>
                  )}
                </View>

                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={onMarkAllAsRead}
                    style={popoverStyles.markAllBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={popoverStyles.markAllText}>{t('notifications.markAllRead')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Értesítések listája */}
              <ScrollView
                style={popoverStyles.list}
                contentContainerStyle={popoverStyles.listContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {notifications.length === 0 ? (
                  <View style={popoverStyles.emptyState}>
                    <Text style={popoverStyles.emptyTitle}>{t('notifications.emptyTitle')}</Text>
                    <Text style={popoverStyles.emptySubtitle}>
                      {t('notifications.emptySubtitle')}
                    </Text>
                  </View>
                ) : (
                  notifications.map((item) => (
                    <NotificationItemCard
                      key={item.id}
                      item={item}
                      onPress={onItemPress}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </ScrollView>

              <View style={popoverStyles.footer}>
                {notifications.length > 0 && (
                  <TouchableOpacity
                    onPress={onClearAll}
                    style={popoverStyles.clearAllBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={popoverStyles.clearAllText}>{t('notifications.clearAll')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const popoverStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.45)',
  },
  popoverCard: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#0F182B',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1E2C4A',
    maxHeight: 460,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 9999,
  },
  pointerArrow: {
    position: 'absolute',
    top: -8,
    right: 28,
    width: 14,
    height: 14,
    backgroundColor: '#0F182B',
    borderLeftWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: '#1E2C4A',
    transform: [{ rotate: '45deg' }],
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#17233B',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  unreadPill: {
    backgroundColor: 'rgba(74, 184, 248, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.3)',
  },
  unreadPillText: {
    fontSize: 10.5,
    color: Colors.accent.blue,
    fontWeight: '700',
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  markAllText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.accent.blue,
  },
  list: {
    maxHeight: 380,
    paddingHorizontal: 14,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#17233B',
  },
  clearAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  footerMutedText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
});
