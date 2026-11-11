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
import { Ionicons } from '@expo/vector-icons';
import { FitbaseCustomDialog } from '@/components/common/FitbaseCustomDialog';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useProfile } from '@/context/ProfileProvider';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { FitbaseDialogConfig } from '@/models/DialogConfig';

type GenderOption = 'female' | 'male' | 'other';

interface EditDemographicsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onShowDialog?: (config: FitbaseDialogConfig) => void;
}

const GENDER_OPTIONS: Array<{
  value: GenderOption;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: 'female', labelKey: 'onboarding.genderFemale', icon: 'female' },
  { value: 'male', labelKey: 'onboarding.genderMale', icon: 'male' },
  { value: 'other', labelKey: 'onboarding.genderOther', icon: 'radio-button-off' },
];

/**
 * EditDemographicsModal
 * Dedicated profile modal for viewing and updating the user's Gender and Age.
 */
export const EditDemographicsModal: React.FC<EditDemographicsModalProps> = ({
  visible,
  onClose,
  onSaved,
  onShowDialog,
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { androidBottomOffset, isKeyboardVisible } = useKeyboardOffset();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 20);
  const { profile, updateProfile } = useProfile();

  const [gender, setGender] = useState<GenderOption>('male');
  const [age, setAge] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [localDialog, setLocalDialog] = useState<FitbaseDialogConfig | null>(null);

  useEffect(() => {
    if (visible && profile) {
      const normalizedGender = (profile.gender ?? '').toLowerCase();
      if (normalizedGender === 'female' || normalizedGender === 'male' || normalizedGender === 'other') {
        setGender(normalizedGender);
      } else {
        setGender('male');
      }
      setAge(profile.age != null ? String(profile.age) : '');
    }
  }, [visible, profile]);

  const handleSave = async () => {
    const trimmedAge = age.trim();
    const parsedAge = trimmedAge !== '' ? parseInt(trimmedAge, 10) : null;

    if (
      trimmedAge !== '' &&
      (parsedAge === null || isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120)
    ) {
      setLocalDialog(
        FitbaseDialogConfig.warning(
          t('profile.demographics.invalidAgeTitle'),
          t('profile.demographics.invalidAgeMsg')
        )
      );
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        gender,
        age: parsedAge,
      });
      onSaved?.();
      onClose();
      onShowDialog?.(
        FitbaseDialogConfig.success(
          t('profile.demographics.savedTitle'),
          t('profile.demographics.savedMsg')
        )
      );
    } catch (err: any) {
      setLocalDialog(
        FitbaseDialogConfig.error(
          t('profile.demographics.failedTitle'),
          err?.message || t('profile.demographics.failedMsg')
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
                <Ionicons name="person-outline" size={18} color={Colors.accent.sky} />
              </View>
              <Text style={styles.title}>{t('profile.demographics.modalTitle')}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Text style={styles.hint}>{t('profile.demographics.hint')}</Text>

            <Text style={styles.sectionLabel}>{t('profile.demographics.genderLabel')}</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((option) => {
                const isSelected = gender === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.genderChip, isSelected && styles.genderChipSelected]}
                    onPress={() => setGender(option.value)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={option.icon}
                      size={16}
                      color={isSelected ? Colors.accent.sky : Colors.text.secondary}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.genderChipText,
                        isSelected && styles.genderChipTextSelected,
                      ]}
                    >
                      {t(option.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>{t('profile.demographics.ageLabel')}</Text>
            <TextInput
              style={styles.textInput}
              value={age}
              onChangeText={(txt) => setAge(txt.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
              placeholder={t('profile.demographics.agePlaceholder')}
              placeholderTextColor={Colors.text.ghost}
            />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelBtnText}>{t('profile.demographics.cancelBtn')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#0D1528" />
                ) : (
                  <Text style={styles.saveBtnText}>{t('profile.demographics.saveBtn')}</Text>
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  genderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#0D1528',
    borderWidth: 1,
    borderColor: Colors.border.navy,
  },
  genderChipSelected: {
    borderColor: Colors.accent.sky,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  genderChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  genderChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
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

