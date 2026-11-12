import { FitbaseCustomDialog } from '@/components/common/FitbaseCustomDialog';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
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
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';

interface EditBodyMetricsModalProps {
  visible: boolean;
  onClose: () => void;
  onMetricsSaved?: () => void;
  onShowDialog?: (config: FitbaseDialogConfig) => void;
}

// Súly és magasság módosító modál
export const EditBodyMetricsModal: React.FC<EditBodyMetricsModalProps> = ({
  visible,
  onClose,
  onMetricsSaved,
  onShowDialog,
}) => {
  const { t, i18n } = useLanguage();
  const insets = useSafeAreaInsets();
  const { androidBottomOffset, isKeyboardVisible } = useKeyboardOffset();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 20);
  const { profile, updateProfile } = useProfile();

  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [localDialog, setLocalDialog] = useState<FitbaseDialogConfig | null>(null);

  useEffect(() => {
    if (visible && profile) {
      setWeight(profile.weight ? String(profile.weight) : '');
      setHeight(profile.height ? String(profile.height) : '');
    }
  }, [visible, profile]);

  const numWeight = parseFloat(weight.replace(',', '.'));
  const numHeight = parseFloat(height.replace(',', '.'));

  const liveBmi = bodyMetricsService.calculateBmi(
    !isNaN(numWeight) ? numWeight : null,
    !isNaN(numHeight) ? numHeight : null
  );

  const handleSave = async () => {
    if (weight.trim() !== '' && (isNaN(numWeight) || numWeight <= 20 || numWeight >= 300)) {
      setLocalDialog(
        FitbaseDialogConfig.warning(
          t('profile.bodyMetrics.invalidWeightTitle'),
          t('profile.bodyMetrics.invalidWeightMsg')
        )
      );
      return;
    }

    if (height.trim() !== '' && (isNaN(numHeight) || numHeight <= 50 || numHeight >= 260)) {
      setLocalDialog(
        FitbaseDialogConfig.warning(
          t('profile.bodyMetrics.invalidHeightTitle'),
          t('profile.bodyMetrics.invalidHeightMsg')
        )
      );
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        weight: weight.trim() !== '' && !isNaN(numWeight) ? numWeight : null,
        height: height.trim() !== '' && !isNaN(numHeight) ? numHeight : null,
      });
      onMetricsSaved?.();
      onClose();
      onShowDialog?.(
        FitbaseDialogConfig.success(
          t('profile.bodyMetrics.savedTitle'),
          t('profile.bodyMetrics.savedMsg')
        )
      );
    } catch (err: any) {
      setLocalDialog(
        FitbaseDialogConfig.error(
          t('profile.bodyMetrics.failedTitle'),
          err.message || t('profile.bodyMetrics.failedMsg')
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
                <Ionicons name="body-outline" size={18} color={Colors.accent.blue} />
              </View>
              <Text style={styles.title}>{t('profile.bodyMetrics.modalTitle')}</Text>
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
            <Text style={styles.hint}>{t('profile.bodyMetrics.hint')}</Text>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('profile.bodyMetrics.weightLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder={t('profile.bodyMetrics.weightPlaceholder')}
                  placeholderTextColor={Colors.text.ghost}
                  autoFocus
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('profile.bodyMetrics.heightLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder={t('profile.bodyMetrics.heightPlaceholder')}
                  placeholderTextColor={Colors.text.ghost}
                />
              </View>
            </View>

            {/* BMI kártya */}
            {liveBmi && (
              <View style={styles.bmiCard}>
                <View style={styles.bmiHeader}>
                  <View style={[styles.statDot, { backgroundColor: liveBmi.color }]} />
                  <Text style={styles.bmiLabel}>{t('profile.bodyMetrics.bmiHeader')}</Text>
                </View>
                <View style={styles.bmiValueRow}>
                  <Text style={styles.bmiScore}>{i18n.formatNumber(liveBmi.bmi)}</Text>
                  <View
                    style={[
                      styles.bmiBadge,
                      {
                        backgroundColor: `${liveBmi.color}1F`,
                        borderColor: `${liveBmi.color}4D`,
                      },
                    ]}
                  >
                    <Text style={[styles.bmiBadgeText, { color: liveBmi.color }]}>
                      {liveBmi.label}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelBtnText}>{t('profile.bodyMetrics.cancelBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#0D1528" />
                ) : (
                  <Text style={styles.saveBtnText}>{t('profile.bodyMetrics.saveBtn')}</Text>
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
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
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
  bmiCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  bmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bmiLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bmiScore: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  bmiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  bmiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
    backgroundColor: Colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1528',
  },
});
