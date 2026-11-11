import { FitbaseCustomDialog } from '@/components/common/FitbaseCustomDialog';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { FitbaseDialogConfig } from '@/models/DialogConfig';
import { authRepository } from '@/repositories/AuthRepository';
import { HoldToDeleteButton } from './HoldToDeleteButton';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onShowDialog?: (config: FitbaseDialogConfig) => void;
}

/**
 * DeleteAccountModal
 * Isolated modal providing a safe, compliant confirmation workflow for account deletion.
 */
export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onShowDialog,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [localDialog, setLocalDialog] = useState<FitbaseDialogConfig | null>(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await authRepository.deleteAccount();
      onClose();
    } catch (err: any) {
      const errorMsg =
        err?.message || t('profile.deleteAccount.failedMsg');
      if (onShowDialog) {
        onClose();
        onShowDialog(FitbaseDialogConfig.error(t('profile.deleteAccount.failedTitle'), errorMsg));
      } else {
        setLocalDialog(FitbaseDialogConfig.error(t('profile.deleteAccount.failedTitle'), errorMsg));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="warning-outline" size={32} color={Colors.status.error} />
          </View>

          <Text style={styles.title}>{t('profile.deleteAccount.modalTitle')}</Text>
          <Text style={styles.warningText}>
            {t('profile.deleteAccount.warningText')}
          </Text>

          <Text style={styles.description}>
            {t('profile.deleteAccount.description')}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>{t('profile.deleteAccount.keepAccountBtn')}</Text>
            </TouchableOpacity>

            <HoldToDeleteButton
              onTriggerDelete={handleDelete}
              loading={loading}
              holdDurationMs={3000}
            />
          </View>
        </View>
      </View>

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
    backgroundColor: 'rgba(5, 10, 20, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.background.elevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 129, 0.25)',
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.status.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    alignItems: 'stretch',
  },
  cancelBtn: {
    flex: 1,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
});
