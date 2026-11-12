import { FitbaseCustomDialog } from '@/components/common/FitbaseCustomDialog';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { FitbaseDialogConfig } from '@/models/DialogConfig';
import { STORAGE_LANGUAGE_KEY } from '@/services/LocalizationService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export { STORAGE_LANGUAGE_KEY };

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

interface LanguageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLanguage?: (code: string) => void;
  onShowDialog?: (config: FitbaseDialogConfig) => void;
}

// Nyelvválasztó felugró ablak a felhasználói felület nyelvének átállításához
export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  visible,
  onClose,
  onSelectLanguage,
  onShowDialog,
}) => {
  const { language, setLanguage, t, i18n } = useLanguage();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 20);

  const [localDialog, setLocalDialog] = useState<FitbaseDialogConfig | null>(null);

  const handleChoose = async (lang: LanguageOption) => {
    const isFullySupported = lang.code === 'en' || lang.code === 'hu';
    if (!isFullySupported) {
      const localizedLangName =
        i18n.t(`profile.language.langName.${lang.code}`) ||
        i18n.t(`lang.${lang.code}`) ||
        lang.name;
      const infoConfig = FitbaseDialogConfig.info(
        t('profile.language.comingSoon') || t('profile.menu.comingSoon'),
        i18n.t('profile.language.comingSoonMsg', { name: localizedLangName, nativeName: lang.nativeName })
      );
      if (onShowDialog) {
        onShowDialog(infoConfig);
      } else {
        setLocalDialog(infoConfig);
      }
      return;
    }

    try {
      await setLanguage(lang.code);
      onSelectLanguage?.(lang.code);
      onClose();

      const localizedLangName =
        i18n.t(`profile.language.langName.${lang.code}`) ||
        i18n.t(`lang.${lang.code}`) ||
        lang.name;

      const successConfig = FitbaseDialogConfig.success(
        i18n.t('profile.language.selectedTitle'),
        i18n.t('profile.language.selectedFullMsg', { name: localizedLangName, nativeName: lang.nativeName })
      );

      if (onShowDialog) {
        onShowDialog(successConfig);
      } else {
        setLocalDialog(successConfig);
      }
    } catch {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.backdrop, { paddingTop: insets.top + 16 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdropOverlay} onPress={onClose} />
        <View style={[styles.card, { paddingBottom: bottomInset + 16 }]}>
          {/* Fejléc */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(74, 184, 248, 0.15)' }]}>
                <Ionicons name="language-outline" size={18} color={Colors.accent.blue} />
              </View>
              <Text style={styles.title}>{t('profile.language.modalTitle')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Text style={styles.hint}>{t('profile.language.hint')}</Text>

            {/* Nyelvek listája */}
            <View style={styles.list}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const active = language === lang.code;
                const isFullySupported = lang.code === 'en' || lang.code === 'hu';
                const localizedName =
                  t(`profile.language.langName.${lang.code}`) ||
                  t(`lang.${lang.code}`) ||
                  lang.name;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langItem, active && styles.langItemActive]}
                    onPress={() => handleChoose(lang)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.langLeftCol}>
                      <Text style={styles.flagText}>{lang.flag}</Text>
                      <View>
                        <Text style={[styles.langName, active && styles.langNameActive]}>
                          {localizedName}
                        </Text>
                        <Text style={styles.langSub}>{lang.nativeName}</Text>
                      </View>
                    </View>

                    <View style={styles.langRightCol}>
                      {!isFullySupported && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {t('profile.language.comingSoon') || t('profile.menu.comingSoon')}
                          </Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.radioCircle,
                          active && styles.radioCircleActive,
                        ]}
                      >
                        {active && <View style={styles.radioDot} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <FitbaseCustomDialog
        visible={Boolean(localDialog)}
        config={localDialog}
        onClose={() => setLocalDialog(null)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    maxHeight: '100%',
    flexShrink: 1,
    backgroundColor: '#152038',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border.navy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  hint: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  list: {
    gap: 10,
    marginBottom: 8,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D1528',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#1E2C4A',
  },
  langItemActive: {
    borderColor: Colors.accent.blue,
    backgroundColor: 'rgba(74, 184, 248, 0.08)',
  },
  langLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagText: {
    fontSize: 22,
  },
  langName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  langNameActive: {
    color: Colors.accent.blue,
  },
  langSub: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  langRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(0, 188, 212, 0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.28)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent.teal,
    letterSpacing: 0.3,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#334466',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.accent.blue,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent.blue,
  },
});
