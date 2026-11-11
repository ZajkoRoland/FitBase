import { FitbaseCustomDialog } from '@/components/common/FitbaseCustomDialog';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { FitbaseDialogConfig } from '@/models/DialogConfig';
import { bodyMetricsService } from '@/services/BodyMetricsService';
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

interface EditTargetWeightModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onShowDialog?: (config: FitbaseDialogConfig) => void;
}

/**
 * EditTargetWeightModal
 * Dedicated modal for setting and adjusting the user's target weight goal,
 * persisted directly to the account's database record (`user_stats.target_weight`).
 */
export const EditTargetWeightModal: React.FC<EditTargetWeightModalProps> = ({
  visible,
  onClose,
  onSaved,
  onShowDialog,
}) => {
  const { t, i18n } = useLanguage();
  const insets = useSafeAreaInsets();
  const { androidBottomOffset, isKeyboardVisible } = useKeyboardOffset();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 20);
  const { profile, updateProfile } = useProfile();

  const [targetWeight, setTargetWeight] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [localDialog, setLocalDialog] = useState<FitbaseDialogConfig | null>(null);

  useEffect(() => {
    if (visible) {
      if (profile?.target_weight !== undefined && profile?.target_weight !== null) {
        setTargetWeight(String(profile.target_weight));
      } else {
        bodyMetricsService.getTargetWeight(profile?.id).then((tw) => {
          setTargetWeight(tw ? String(tw) : '');
        });
      }
    }
  }, [visible, profile?.target_weight, profile?.id]);

  const currentWeight = profile?.weight ?? null;
  const numTarget = parseFloat(targetWeight.replace(',', '.'));

  const liveProgress =
    currentWeight && !isNaN(numTarget)
      ? bodyMetricsService.calculateProgress(currentWeight, numTarget)
      : null;

  const handleSave = async () => {
    if (targetWeight.trim() !== '' && (isNaN(numTarget) || numTarget <= 20 || numTarget >= 300)) {
      setLocalDialog(
        FitbaseDialogConfig.warning(
          t('profile.targetWeight.invalidTitle'),
          t('profile.targetWeight.invalidMsg')
        )
      );
      return;
    }

    const parsedValue = targetWeight.trim() !== '' && !isNaN(numTarget) ? numTarget : null;

    try {
      setSaving(true);
      await updateProfile({ target_weight: parsedValue });
      await bodyMetricsService.saveTargetWeight(parsedValue, profile?.id);
      onSaved?.();
      onClose();
      onShowDialog?.(
        FitbaseDialogConfig.success(
          t('profile.targetWeight.savedTitle'),
          t('profile.targetWeight.savedMsg')
        )
      );
    } catch (err: any) {
      setLocalDialog(
        FitbaseDialogConfig.error(
          t('profile.targetWeight.failedTitle'),
          err.message || t('profile.targetWeight.failedMsg')
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
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 179, 0, 0.15)' }]}>
                <Ionicons name="flag-outline" size={18} color={Colors.accent.amber} />
              </View>
              <Text style={styles.title}>{t('profile.targetWeight.modalTitle')}</Text>
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
            <Text style={styles.hint}>{t('profile.targetWeight.hint')}</Text>

            <View style={styles.metricsCompareRow}>
              <View style={styles.compareCol}>
                <Text style={styles.compareLabel}>{t('profile.targetWeight.currentWeightLabel')}</Text>
                <Text style={styles.compareValue}>
                  {currentWeight ? `${i18n.formatNumber(currentWeight)} kg` : t('profile.targetWeight.notSet')}
                </Text>
              </View>

              <Ionicons name="arrow-forward" size={18} color={Colors.text.secondary} />

              <View style={[styles.compareCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.compareLabel}>{t('profile.targetWeight.targetGoalLabel')}</Text>
                <Text style={[styles.compareValue, { color: Colors.accent.amber }]}>
                  {!isNaN(numTarget) && numTarget > 0 ? `${i18n.formatNumber(numTarget)} kg` : '--'}
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.targetWeight.inputLabel')}</Text>
              <TextInput
                style={styles.textInput}
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="numeric"
                placeholder={t('profile.targetWeight.inputPlaceholder')}
                placeholderTextColor={Colors.text.ghost}
                autoFocus
              />
            </View>

            {liveProgress && (
              <View style={styles.progressCard}>
                <Ionicons
                  name="sparkles"
                  size={14}
                  color={Colors.accent.amber}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.progressText}>{liveProgress.label}</Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelBtnText}>{t('profile.targetWeight.cancelBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#0D1528" />
                ) : (
                  <Text style={styles.saveBtnText}>{t('profile.targetWeight.saveBtn')}</Text>
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
  metricsCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  compareCol: {
    gap: 3,
  },
  compareLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1,
  },
  compareValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0D1528',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.navy,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.3)',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent.amber,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.accent.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1528',
  },
});
