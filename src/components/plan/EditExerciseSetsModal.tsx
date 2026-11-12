import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import { Exercise, ExerciseSet, PlanService } from '@/services/PlanService';

export interface EditExerciseSetsModalProps {
  readonly visible: boolean;
  readonly exercise: Exercise | null;
  readonly onClose: () => void;
  readonly onSave: (updatedSets: ExerciseSet[], restSeconds: number) => void;
}

const REST_TIME_OPTIONS = [30, 45, 60, 90, 120, 180];
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_NAV_PADDING = Platform.OS === 'android' ? 68 : 24;

export const EditExerciseSetsModal: React.FC<EditExerciseSetsModalProps> = ({
  visible,
  exercise,
  onClose,
  onSave,
}) => {
  const { i18n } = useLanguage();
  const { androidBottomOffset, isKeyboardVisible } = useKeyboardOffset();

  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [restSeconds, setRestSeconds] = useState<number>(60);
  const [uniformReps, setUniformReps] = useState<number>(10);
  const [uniformWeight, setUniformWeight] = useState<number>(0);
  const [show1RMInfo, setShow1RMInfo] = useState<boolean>(false);

  useEffect(() => {
    if (visible && exercise) {
      const initialSets = PlanService.ensureExerciseSets(exercise);
      setSets(initialSets);
      setRestSeconds(exercise.restSeconds || 60);

      const firstSet = initialSets[0] || { reps: 10, weightKg: 0 };
      setUniformReps(firstSet.reps || 10);
      setUniformWeight(firstSet.weightKg || exercise.weightKg || 0);
    }
  }, [visible, exercise]);

  const totalVolume = useMemo(() => PlanService.calculateTotalVolume(sets), [sets]);
  const best1RM = useMemo(() => {
    return sets.reduce(
      (max, s) => Math.max(max, PlanService.calculateEstimated1RM(s.weightKg, s.reps)),
      0
    );
  }, [sets]);

  const handleAddSet = () => {
    if (sets.length >= 12) return;
    const last = sets[sets.length - 1] || { reps: 10, weightKg: 0 };
    setSets((prev) => [
      ...prev,
      {
        setNumber: prev.length + 1,
        reps: last.reps || 10,
        weightKg: last.weightKg || 0,
        completed: false,
      },
    ]);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length <= 1) return;
    setSets((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }))
    );
  };

  const handleUpdateSetReps = (index: number, delta: number) => {
    setSets((prev) =>
      prev.map((s, idx) => {
        if (idx !== index) return s;
        const newReps = Math.max(1, Math.min(100, s.reps + delta));
        return { ...s, reps: newReps };
      })
    );
  };

  const handleUpdateSetWeight = (index: number, delta: number) => {
    setSets((prev) =>
      prev.map((s, idx) => {
        if (idx !== index) return s;
        const newWeight = Math.max(0, Math.min(500, Math.round((s.weightKg + delta) * 10) / 10));
        return { ...s, weightKg: newWeight };
      })
    );
  };

  const handleDirectRepsInput = (index: number, text: string) => {
    const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setSets((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, reps: isNaN(val) ? 0 : Math.min(100, val) } : s))
    );
  };

  const handleDirectWeightInput = (index: number, text: string) => {
    const clean = text.replace(',', '.').replace(/[^0-9.]/g, '');
    const val = parseFloat(clean);
    setSets((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, weightKg: isNaN(val) ? 0 : Math.min(500, val) } : s))
    );
  };

  const handleApplyUniformToAll = () => {
    setSets((prev) =>
      prev.map((s) => ({
        ...s,
        reps: Math.max(1, uniformReps),
        weightKg: Math.max(0, uniformWeight),
      }))
    );
  };

  const handleSave = () => {
    const sanitized = sets.map((s, idx) => ({
      ...s,
      setNumber: idx + 1,
      reps: Math.max(1, s.reps || 1),
      weightKg: Math.max(0, s.weightKg || 0),
    }));
    onSave(sanitized, restSeconds);
    onClose();
  };

  if (!visible || !exercise) return null;

  const localizedTitle = i18n.translateExerciseTitle(exercise.title, exercise.slug);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={[
          styles.backdrop,
          {
            paddingBottom:
              Platform.OS === 'android' && androidBottomOffset > 0 ? androidBottomOffset : 0,
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          {/* Fejléc */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerInfo}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {localizedTitle}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {i18n.t('plan.editSetsModal.heading')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Értékek másolása az összes sorozatra */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="flash" size={14} color={Colors.accent.blue} />
                <Text style={styles.sectionLabel}>{i18n.t('plan.editSetsModal.applyUniformLabel')}</Text>
              </View>

              <View style={styles.uniformInputsRow}>
                {/* Egységes ismétlésszám */}
                <View style={styles.uniformInputBlock}>
                  <Text style={styles.miniLabel}>{i18n.t('plan.editSetsModal.repsLabel')}</Text>
                  <View style={styles.stepperBox}>
                    <TouchableOpacity
                      onPress={() => setUniformReps((r) => Math.max(1, r - 1))}
                      style={styles.stepBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.stepperInput}
                      keyboardType="number-pad"
                      value={String(uniformReps)}
                      selectTextOnFocus
                      onChangeText={(t) => {
                        const v = parseInt(t.replace(/[^0-9]/g, ''), 10);
                        setUniformReps(isNaN(v) ? 0 : v);
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setUniformReps((r) => Math.min(100, r + 1))}
                      style={styles.stepBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Egységes súly */}
                <View style={styles.uniformInputBlock}>
                  <Text style={styles.miniLabel}>{i18n.t('plan.editSetsModal.weightLabel')}</Text>
                  <View style={styles.stepperBox}>
                    <TouchableOpacity
                      onPress={() => setUniformWeight((w) => Math.max(0, Math.round((w - 2.5) * 10) / 10))}
                      style={styles.stepBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.stepperInput}
                      keyboardType="decimal-pad"
                      value={String(uniformWeight)}
                      selectTextOnFocus
                      onChangeText={(t) => {
                        const clean = t.replace(',', '.').replace(/[^0-9.]/g, '');
                        const v = parseFloat(clean);
                        setUniformWeight(isNaN(v) ? 0 : Math.min(500, v));
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setUniformWeight((w) => Math.min(500, Math.round((w + 2.5) * 10) / 10))}
                      style={styles.stepBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyUniformToAll}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" />
                <Text style={styles.applyBtnText}>{i18n.t('plan.editSetsModal.applyAllBtn')}</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Sorozatok listája */}
            <View style={styles.sectionCard}>
              <View style={styles.setsHeaderRow}>
                <View style={styles.setsHeaderLeft}>
                  <Ionicons name="barbell-outline" size={15} color={Colors.accent.blue} />
                  <Text style={styles.sectionLabel}>
                    {i18n.t('plan.editSetsModal.setsHeader', { count: sets.length })}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleAddSet}
                  style={styles.addSetHeaderBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={17} color={Colors.accent.blue} />
                  <Text style={styles.addSetHeaderText}>
                    {i18n.t('plan.editSetsModal.addSetBtn')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.setsTable}>
                {sets.map((set, idx) => (
                  <View key={idx} style={styles.setRow}>
                    <View style={styles.setIndexBadge}>
                      <Text style={styles.setIndexText}>{set.setNumber}.</Text>
                    </View>

                    {/* Ismétlésszám */}
                    <View style={styles.setCell}>
                      <Text style={styles.cellSub}>{i18n.t('plan.editSetsModal.repsShort')}</Text>
                      <View style={styles.miniStepper}>
                        <TouchableOpacity
                          onPress={() => handleUpdateSetReps(idx, -1)}
                          style={styles.miniStepBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.miniStepText}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.miniInput}
                          keyboardType="number-pad"
                          value={String(set.reps)}
                          selectTextOnFocus
                          onChangeText={(t) => handleDirectRepsInput(idx, t)}
                        />
                        <TouchableOpacity
                          onPress={() => handleUpdateSetReps(idx, 1)}
                          style={styles.miniStepBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.miniStepText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Súly */}
                    <View style={styles.setCell}>
                      <Text style={styles.cellSub}>{i18n.t('plan.editSetsModal.weightShort')}</Text>
                      <View style={styles.miniStepper}>
                        <TouchableOpacity
                          onPress={() => handleUpdateSetWeight(idx, -2.5)}
                          style={styles.miniStepBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.miniStepText}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.miniInput}
                          keyboardType="decimal-pad"
                          value={String(set.weightKg)}
                          selectTextOnFocus
                          onChangeText={(t) => handleDirectWeightInput(idx, t)}
                        />
                        <TouchableOpacity
                          onPress={() => handleUpdateSetWeight(idx, 2.5)}
                          style={styles.miniStepBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.miniStepText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Sorozat törlése */}
                    {sets.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveSet(idx)}
                        style={styles.deleteSetBtn}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF6B81" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* 3. Pihenőidő választó */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="time-outline" size={15} color={Colors.accent.blue} />
                <Text style={styles.sectionLabel}>{i18n.t('plan.editSetsModal.restTimeLabel')}</Text>
              </View>
              <View style={styles.chipsRow}>
                {REST_TIME_OPTIONS.map((sec) => {
                  const isSelected = restSeconds === sec;
                  return (
                    <TouchableOpacity
                      key={sec}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setRestSeconds(sec)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {sec} {i18n.t('plan.editSetsModal.secSuffix')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Összegző kártya */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{i18n.t('plan.editSetsModal.totalVolume')}</Text>
                <Text style={styles.summaryValue}>
                  {totalVolume.toLocaleString()} kg
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <TouchableOpacity
                  style={styles.labelWithInfoRow}
                  activeOpacity={0.7}
                  onPress={() => setShow1RMInfo((prev) => !prev)}
                >
                  <Text style={styles.summaryLabel}>{i18n.t('plan.editSetsModal.est1RM')}</Text>
                  <Ionicons name="information-circle-outline" size={14} color={Colors.accent.blue} />
                </TouchableOpacity>
                <Text style={[styles.summaryValue, { color: Colors.accent.amber }]}>
                  {best1RM > 0 ? `${best1RM} kg` : '—'}
                </Text>
              </View>
            </View>

            {/* Lenyitható 1RM magyarázat */}
            {show1RMInfo && (
              <View style={styles.oneRMInfoBox}>
                <View style={styles.oneRMInfoHeader}>
                  <Ionicons name="bulb-outline" size={16} color={Colors.accent.amber} />
                  <Text style={styles.oneRMInfoTitle}>{i18n.t('plan.1rmExplanationTitle')}</Text>
                </View>
                <Text style={styles.oneRMInfoText}>{i18n.t('plan.1rmExplanationBody')}</Text>
              </View>
            )}
          </ScrollView>

          {/* Alsó műveleti gombok */}
          <View
            style={[
              styles.sheetFooter,
              { paddingBottom: isKeyboardVisible ? 16 : BOTTOM_NAV_PADDING },
            ]}
          >
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>{i18n.t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{i18n.t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F182E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 0,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  sheetSubtitle: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginTop: 3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: SCREEN_HEIGHT * 0.65,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionCard: {
    backgroundColor: '#152038',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionLabel: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  uniformInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  uniformInputBlock: {
    flex: 1,
  },
  miniLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1528',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    height: 42,
  },
  stepBtn: {
    width: 38,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    includeFontPadding: false,
  },
  stepperInput: {
    flex: 1,
    height: 42,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  applyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  setsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  setsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addSetHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
  },
  addSetHeaderText: {
    color: Colors.accent.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  setsTable: {
    gap: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1528',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  setIndexBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setIndexText: {
    color: Colors.accent.blue,
    fontSize: 12,
    fontWeight: '800',
    includeFontPadding: false,
  },
  setCell: {
    flex: 1,
  },
  cellSub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 3,
  },
  miniStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15223C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 38,
    overflow: 'hidden',
  },
  miniStepBtn: {
    width: 28,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  miniStepText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
  },
  miniInput: {
    flex: 1,
    height: 38,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  deleteSetBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0D1528',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(74, 184, 248, 0.15)',
    borderColor: Colors.accent.blue,
  },
  chipText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#152038',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  labelWithInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  oneRMInfoBox: {
    backgroundColor: 'rgba(74, 184, 248, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.22)',
  },
  oneRMInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  oneRMInfoTitle: {
    color: Colors.accent.amber,
    fontSize: 13,
    fontWeight: '700',
  },
  oneRMInfoText: {
    color: '#B5C2D2',
    fontSize: 12,
    lineHeight: 18,
  },
  summaryValue: {
    color: Colors.text.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#0F182E',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtnText: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
