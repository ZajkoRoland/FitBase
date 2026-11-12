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
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EditFitnessGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onShowDialog?: (config: FitbaseDialogConfig) => void;
}

const FITNESS_GOALS = [
  'Muscle Gain',
  'Fat Loss',
  'Strength',
  'Endurance',
  'General Fitness',
];

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// Edzési célok módosítása modál ablak
export const EditFitnessGoalsModal: React.FC<EditFitnessGoalsModalProps> = ({
  visible,
  onClose,
  onSaved,
  onShowDialog,
}) => {
  const { t, i18n } = useLanguage();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 20);
  const { profile, updateProfile } = useProfile();

  const [goal, setGoal] = useState<string>('Muscle Gain');
  const [level, setLevel] = useState<string>('Intermediate');
  const [saving, setSaving] = useState<boolean>(false);
  const [localDialog, setLocalDialog] = useState<FitbaseDialogConfig | null>(null);

  useEffect(() => {
    if (visible && profile) {
      setGoal(profile.fitness_goal || 'Muscle Gain');
      setLevel(profile.fitness_level || 'Intermediate');
    }
  }, [visible, profile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        fitness_goal: goal,
        fitness_level: level,
      });
      onSaved?.();
      onClose();
      onShowDialog?.(
        FitbaseDialogConfig.success(
          t('profile.fitnessGoals.updatedTitle'),
          t('profile.fitnessGoals.updatedMsg')
        )
      );
    } catch (err: any) {
      setLocalDialog(
        FitbaseDialogConfig.error(
          t('profile.fitnessGoals.failedTitle'),
          err.message || t('profile.fitnessGoals.failedMsg')
        )
      );
    } finally {
      setSaving(false);
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
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
                <Ionicons name="trophy-outline" size={18} color={Colors.accent.green} />
              </View>
              <Text style={styles.title}>{t('profile.fitnessGoals.modalTitle')}</Text>
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
            <Text style={styles.hint}>{t('profile.fitnessGoals.hint')}</Text>

            {/* Fő célkitűzés választó */}
            <Text style={styles.sectionLabel}>{t('profile.fitnessGoals.primaryGoalLabel')}</Text>
            <View style={styles.chipsRow}>
              {FITNESS_GOALS.map((g) => {
                const active = goal === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, active && styles.activeChip]}
                    onPress={() => setGoal(g)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, active && styles.activeChipText]}>
                      {i18n.translateFitnessGoal(g)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tapasztalati szint választó */}
            <Text style={styles.sectionLabel}>{t('profile.fitnessGoals.experienceLevelLabel')}</Text>
            <View style={styles.chipsRow}>
              {FITNESS_LEVELS.map((lvl) => {
                const active = level === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.chip, active && styles.activeChip]}
                    onPress={() => setLevel(lvl)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, active && styles.activeChipText]}>
                      {i18n.translateFitnessLevel(lvl)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelBtnText}>{t('profile.fitnessGoals.cancelBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#0D1528" />
                ) : (
                  <Text style={styles.saveBtnText}>{t('profile.fitnessGoals.saveBtn')}</Text>
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#0D1528',
    borderWidth: 1,
    borderColor: Colors.border.navy,
  },
  activeChip: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: Colors.accent.green,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  activeChipText: {
    color: Colors.accent.green,
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
    backgroundColor: Colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1528',
  },
});
