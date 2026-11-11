import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Linking,
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
import { FitbaseDialogConfig } from '@/models/DialogConfig';

export interface FitbaseCustomDialogProps {
  readonly config: FitbaseDialogConfig | null;
  readonly visible: boolean;
  readonly onClose: () => void;
}

/**
 * FitbaseCustomDialog
 *
 * Isolated, reusable presentation modal replacing default OS Alert.alert.
 * Adheres strictly to FitBase dark cyberpunk/neon palette (#0D1528, #152038, #4AB8F8).
 */
export const FitbaseCustomDialog: React.FC<FitbaseCustomDialogProps> = ({
  config,
  visible,
  onClose,
}) => {
  const { t } = useLanguage();
  const animValue = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);

  useEffect(() => {
    if (visible && config) {
      isDismissing.current = false;
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, config, animValue]);

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

  if (!config) {
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

  const isDestructive = config.primaryButtonStyle === 'destructive';
  const hasSecondary = Boolean(config.secondaryButtonText);

  const handleActionUrl = () => {
    if (config.actionUrl) {
      Linking.openURL(config.actionUrl).catch(() => {});
    }
  };

  return (
    <Modal
      transparent
      visible={visible || isDismissing.current}
      animationType="none"
      onRequestClose={() => handleDismiss(config.onSecondaryPress)}
    >
      <View style={styles.overlay}>
        {/* Animated backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => handleDismiss(config.onSecondaryPress)}
          />
        </Animated.View>

        {/* Dialog card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Header Icon Circle */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: config.iconBgColor },
            ]}
          >
            <Ionicons
              name={config.iconName}
              size={28}
              color={config.iconColor}
            />
          </View>

          <Text style={styles.title}>{config.title}</Text>

          <Text style={styles.message}>{config.message}</Text>

          {/* Optional Action URL Pill (e.g. Email link) */}
          {config.actionUrl && (
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.urlPill}
              onPress={handleActionUrl}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={Colors.accent.blue}
                style={styles.urlIcon}
              />
              <Text style={styles.urlText}>
                {config.actionUrlLabel || t('common.openContactLink')}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttonRow}>
            {hasSecondary && (
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.secondaryButton}
                onPress={() => handleDismiss(config.onSecondaryPress)}
              >
                <Text style={styles.secondaryButtonText}>
                  {config.secondaryButtonText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.primaryButton,
                isDestructive ? styles.primaryButtonDestructive : styles.primaryButtonDefault,
                !hasSecondary && styles.fullWidthButton,
              ]}
              onPress={() => handleDismiss(config.onPrimaryPress)}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  isDestructive ? styles.primaryButtonTextDestructive : styles.primaryButtonTextDefault,
                ]}
              >
                {config.primaryButtonText}
              </Text>
            </TouchableOpacity>
          </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  urlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 184, 248, 0.1)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.25)',
  },
  urlIcon: {
    marginRight: 6,
  },
  urlText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent.blue,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButton: {
    flex: 1,
  },
  primaryButtonDefault: {
    backgroundColor: Colors.accent.blue,
  },
  primaryButtonDestructive: {
    backgroundColor: '#FF5252',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButtonTextDefault: {
    color: '#0D1528',
  },
  primaryButtonTextDestructive: {
    color: '#FFFFFF',
  },
});
