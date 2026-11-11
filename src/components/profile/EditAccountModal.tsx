import { FitbaseCustomDialog } from '@/components/common/FitbaseCustomDialog';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { FitbaseDialogConfig } from '@/models/DialogConfig';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';

interface EditAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onShowDialog?: (config: FitbaseDialogConfig) => void;
}

/**
 * EditAccountModal
 * Isolated modal dedicated to user account identity: Display Name and Username.
 */
export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  visible,
  onClose,
  onShowDialog,
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { androidBottomOffset, isKeyboardVisible } = useKeyboardOffset();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 20);
  const { profile, updateProfile } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [localDialog, setLocalDialog] = useState<FitbaseDialogConfig | null>(null);

  useEffect(() => {
    if (visible && profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
    }
  }, [visible, profile]);

  const handleSave = async () => {
    const trimmedUser = username.trim();
    const trimmedDisplay = displayName.trim();

    if (!trimmedUser) {
      setLocalDialog(
        FitbaseDialogConfig.warning(
          t('profile.editAccount.missingTitle'),
          t('profile.editAccount.missingUsernameMsg')
        )
      );
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        display_name: trimmedDisplay || null,
        username: trimmedUser,
      });
      onClose();
      onShowDialog?.(
        FitbaseDialogConfig.success(
          t('profile.editAccount.updatedTitle'),
          t('profile.editAccount.updatedMsg')
        )
      );
    } catch (err: any) {
      setLocalDialog(
        FitbaseDialogConfig.error(
          t('profile.editAccount.failedTitle'),
          err.message || t('profile.editAccount.failedMsg')
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[
          styles.backdrop,
          {
            paddingTop: insets.top + 16,
            paddingBottom:
              Platform.OS === 'android' && androidBottomOffset > 0 ? androidBottomOffset : 0,
          },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdropOverlay} onPress={onClose} />
        <View style={[styles.card, { paddingBottom: isKeyboardVisible ? 16 : bottomInset + 16 }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={18} color={Colors.accent.blue} />
              </View>
              <Text style={styles.title}>{t('profile.editAccount.modalTitle')}</Text>
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
            <Text style={styles.hint}>{t('profile.editAccount.hint')}</Text>

            <Text style={styles.inputLabel}>{t('profile.editAccount.displayNameLabel')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('profile.editAccount.displayNamePlaceholder')}
                placeholderTextColor={Colors.text.ghost}
              />
            </View>

            <Text style={styles.inputLabel}>{t('profile.editAccount.usernameLabel')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder={t('profile.editAccount.usernamePlaceholder')}
                placeholderTextColor={Colors.text.ghost}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelBtnText}>{t('profile.editAccount.cancelBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#0D1528" />
                ) : (
                  <Text style={styles.saveBtnText}>{t('profile.editAccount.saveBtn')}</Text>
                )}
              </TouchableOpacity>
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
    backgroundColor: 'rgba(5, 10, 20, 0.75)',
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    flex: 1,
  },
  card: {
    maxHeight: '100%',
    flexShrink: 1,
    backgroundColor: Colors.background.elevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  hint: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginBottom: 14,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.accent.blue,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1528',
  },
});
