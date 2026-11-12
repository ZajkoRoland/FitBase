import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';

export interface AvatarPickerModalProps {
  readonly visible: boolean;
  readonly hasAvatar: boolean;
  readonly onChoosePhoto: () => void;
  readonly onRemovePhoto: () => void;
  readonly onClose: () => void;
}

// Profilkép választó és törlő modál
export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  hasAvatar,
  onChoosePhoto,
  onRemovePhoto,
  onClose,
}) => {
  const { t } = useLanguage();
  const animValue = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);

  useEffect(() => {
    if (visible) {
      isDismissing.current = false;
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, animValue]);

  const handleDismiss = (callback?: () => void) => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    Animated.timing(animValue, {
      toValue: 0,
      duration: 150,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      isDismissing.current = false;
      onClose();
      if (callback) {
        callback();
      }
    });
  };

  if (!visible && !isDismissing.current) {
    return null;
  }

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const cardScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.93, 1],
    extrapolate: 'clamp',
  });

  const cardOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      transparent
      visible={visible || isDismissing.current}
      animationType="none"
      onRequestClose={() => handleDismiss()}
    >
      <View style={styles.overlay}>
        {/* Animált háttér */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => handleDismiss()} />
        </Animated.View>

        {/* Dialógus kártya */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="camera-outline" size={28} color={Colors.accent.blue} />
          </View>

          <Text style={styles.title}>{t('profile.avatar.modalTitle')}</Text>
          <Text style={styles.subtitle}>{t('profile.avatar.modalSubtitle')}</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.actionRow}
            onPress={() => handleDismiss(onChoosePhoto)}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(74, 184, 248, 0.15)' }]}>
              <Ionicons name="images-outline" size={20} color={Colors.accent.blue} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>{t('profile.avatar.chooseLibrary')}</Text>
              <Text style={styles.actionDesc}>{t('profile.avatar.chooseLibraryDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.ghost} />
          </TouchableOpacity>

          {/* Fotó eltávolítása */}
          {hasAvatar && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.actionRow, styles.actionRowDestructive]}
              onPress={() => handleDismiss(onRemovePhoto)}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255, 82, 82, 0.15)' }]}>
                <Ionicons name="trash-outline" size={20} color="#FF5252" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, { color: '#FF5252' }]}>
                  {t('profile.avatar.removePhoto')}
                </Text>
                <Text style={styles.actionDesc}>{t('profile.avatar.removePhotoDesc')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.ghost} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.cancelBtn}
            onPress={() => handleDismiss()}
          >
            <Text style={styles.cancelBtnText}>{t('profile.avatar.cancel')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 10, 20, 0.85)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.background.elevated,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.16)',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.navy,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  actionRowDestructive: {
    borderColor: 'rgba(255, 82, 82, 0.25)',
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  actionDesc: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  cancelBtn: {
    width: '100%',
    height: 46,
    borderRadius: 13,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
});
