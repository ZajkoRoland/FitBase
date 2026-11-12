import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import {
  PlanDurationType,
  PlanStructureCategory,
  WorkoutPlanStructure,
} from '@/models/WorkoutPlanStructure';

export type PlanCreationMode = 'ai' | 'custom';

export interface BuildPlanModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelectStructure: (category: PlanStructureCategory, mode: PlanCreationMode) => void;
}

export const BuildPlanModal: React.FC<BuildPlanModalProps> = ({
  visible,
  onClose,
  onSelectStructure,
}) => {
  const { t } = useLanguage();
  const animValue = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedId, setSelectedId] = useState<PlanDurationType>('1_week');
  const [creationMode, setCreationMode] = useState<PlanCreationMode>('custom');

  const categories = WorkoutPlanStructure.CATEGORIES;
  const selectedCategory = WorkoutPlanStructure.getCategory(selectedId);

  useEffect(() => {
    if (visible) {
      setStep(1);
      isDismissing.current = false;
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, animValue]);

  const handleDismiss = (callback: () => void) => {
    isDismissing.current = true;
    Animated.timing(animValue, {
      toValue: 0,
      duration: 150,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      isDismissing.current = false;
      callback();
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

  const handleConfirmSelect = () => {
    handleDismiss(() => onSelectStructure(selectedCategory, creationMode));
  };

  return (
    <Modal
      transparent
      visible={visible || isDismissing.current}
      animationType="none"
      onRequestClose={() => handleDismiss(onClose)}
    >
      <View style={styles.overlay}>
        {/* Sötétített háttér */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => handleDismiss(onClose)} />
        </Animated.View>

        {/* Edzésterv készítő kártya */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Fejléc */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextCol}>
              <View style={styles.stepIndicatorRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>
                    {t('plan.build.stepBadge', { step })}
                  </Text>
                </View>
              </View>
              <Text style={styles.title}>
                {step === 1 ? t('plan.build.step1Title') : t('plan.build.step2Title')}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {step === 1
                  ? t('plan.build.step1Subtitle')
                  : t('plan.build.step2Subtitle', {
                      category: selectedCategory.title,
                      title: selectedCategory.title,
                    })}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleDismiss(onClose)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={18} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          </View>

          {/* 1. LÉPÉS: Időtartam kiválasztása */}
          {step === 1 && (
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              <View style={styles.categoriesList}>
                {categories.map((cat) => {
                  const isSelected = cat.id === selectedId;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.8}
                      style={[
                        styles.categoryCard,
                        isSelected ? styles.categoryCardSelected : styles.categoryCardUnselected,
                      ]}
                      onPress={() => setSelectedId(cat.id)}
                    >
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardTitleGroup}>
                          <View
                            style={[
                              styles.iconWrapper,
                              cat.id === '1_week'
                                ? styles.iconWrapperBlue
                                : cat.id === '2_week'
                                ? styles.iconWrapperAmber
                                : styles.iconWrapperGreen,
                            ]}
                          >
                            <Ionicons
                              name={cat.iconName}
                              size={18}
                              color={
                                cat.id === '1_week'
                                  ? Colors.accent.blue
                                  : cat.id === '2_week'
                                  ? Colors.accent.amber
                                  : Colors.accent.green
                              }
                            />
                          </View>
                          <View style={styles.cardTitleTextCol}>
                            <Text style={styles.categoryTitle}>{cat.title}</Text>
                            <Text style={styles.categorySubtitle}>{cat.subtitle}</Text>
                          </View>
                        </View>

                        {/* Jelvény */}
                        <View
                          style={[
                            styles.badge,
                            isSelected ? styles.badgeSelected : styles.badgeDefault,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              isSelected ? styles.badgeTextSelected : styles.badgeTextDefault,
                            ]}
                          >
                            {cat.badge}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.descriptionText}>{cat.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* 2. LÉPÉS: Módszer kiválasztása */}
          {step === 2 && (
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              <View style={styles.methodsList}>
                {/* 1. lehetőség: Egyedi edzésterv */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.methodCard,
                    creationMode === 'custom'
                      ? styles.methodCardSelectedCustom
                      : styles.methodCardUnselected,
                  ]}
                  onPress={() => setCreationMode('custom')}
                >
                  <View style={styles.methodTopRow}>
                    <View style={styles.cardTitleGroup}>
                      <View style={[styles.methodIconCircle, styles.methodIconBlue]}>
                        <Ionicons name="create-outline" size={20} color={Colors.accent.blue} />
                      </View>
                      <View style={styles.cardTitleTextCol}>
                        <Text style={styles.methodTitle}>{t('plan.build.customTitle')}</Text>
                        <Text style={styles.methodSubtitle}>{t('plan.build.customSubtitle')}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        creationMode === 'custom' ? styles.badgeSelected : styles.badgeDefault,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          creationMode === 'custom'
                            ? styles.badgeTextSelected
                            : styles.badgeTextDefault,
                        ]}
                      >
                        {t('plan.build.customBadge')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.methodDescription}>
                    {t('plan.build.customDesc')}
                  </Text>
                </TouchableOpacity>

                {/* 2. lehetőség: AI által generált edzésterv */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.methodCard,
                    creationMode === 'ai'
                      ? styles.methodCardSelectedAi
                      : styles.methodCardUnselected,
                  ]}
                  onPress={() => setCreationMode('ai')}
                >
                  <View style={styles.methodTopRow}>
                    <View style={styles.cardTitleGroup}>
                      <View style={[styles.methodIconCircle, styles.methodIconPurple]}>
                        <Ionicons name="sparkles" size={20} color="#B57CFF" />
                      </View>
                      <View style={styles.cardTitleTextCol}>
                        <Text style={styles.methodTitle}>{t('plan.build.aiTitle')}</Text>
                        <Text style={styles.methodSubtitle}>{t('plan.build.aiSubtitle')}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        creationMode === 'ai' ? styles.badgeSelectedPurple : styles.badgeDefault,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          creationMode === 'ai'
                            ? styles.badgeTextSelectedPurple
                            : styles.badgeTextDefault,
                        ]}
                      >
                        {t('plan.build.aiBadge')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.methodDescription}>
                    {t('plan.build.aiDesc')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* Művelet gombok sora */}
          <View style={styles.buttonRow}>
            {step === 1 ? (
              <>
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.cancelButton}
                  onPress={() => handleDismiss(onClose)}
                >
                  <Text style={styles.cancelButtonText}>{t('plan.build.cancelBtn')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.nextButton}
                  onPress={() => setStep(2)}
                >
                  <View style={styles.btnContentRow}>
                    <Text style={styles.nextButtonText}>{t('plan.build.nextBtn')}</Text>
                    <Ionicons name="arrow-forward" size={15} color="#0D1528" />
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.backButton}
                  onPress={() => setStep(1)}
                >
                  <View style={styles.btnContentRow}>
                    <Ionicons name="arrow-back" size={15} color="#FFFFFF" />
                    <Text style={styles.backButtonText}>{t('plan.build.backBtn')}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.confirmButton,
                    creationMode === 'ai' ? styles.confirmButtonAi : styles.confirmButtonCustom,
                  ]}
                  onPress={handleConfirmSelect}
                >
                  {creationMode === 'ai' ? (
                    <View style={styles.btnContentRow}>
                      <Ionicons name="sparkles" size={15} color="#0D1528" />
                      <Text style={styles.confirmButtonText}>{t('plan.build.generateAiBtn')}</Text>
                    </View>
                  ) : (
                    <View style={styles.btnContentRow}>
                      <Ionicons name="checkmark" size={16} color="#0D1528" />
                      <Text style={styles.confirmButtonText}>{t('plan.build.createCustomBtn')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
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
    paddingHorizontal: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#152038',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTextCol: {
    flex: 1,
  },
  stepIndicatorRow: {
    marginBottom: 4,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.25)',
  },
  stepBadgeText: {
    color: Colors.accent.blue,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  scrollArea: {
    maxHeight: 330,
    marginBottom: 12,
  },
  categoriesList: {
    flexDirection: 'column',
    gap: 10,
    paddingBottom: 4,
  },
  categoryCard: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  categoryCardSelected: {
    backgroundColor: 'rgba(74, 184, 248, 0.10)',
    borderColor: Colors.accent.blue,
  },
  categoryCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    flexShrink: 1,
  },
  cardTitleTextCol: {
    flex: 1,
    flexShrink: 1,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapperBlue: {
    backgroundColor: 'rgba(74, 184, 248, 0.14)',
  },
  iconWrapperAmber: {
    backgroundColor: 'rgba(255, 184, 0, 0.14)',
  },
  iconWrapperGreen: {
    backgroundColor: 'rgba(52, 199, 89, 0.14)',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categorySubtitle: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  badgeDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  badgeSelected: {
    backgroundColor: 'rgba(74, 184, 248, 0.18)',
    borderColor: Colors.accent.blue,
  },
  badgeSelectedPurple: {
    backgroundColor: 'rgba(181, 124, 255, 0.18)',
    borderColor: '#B57CFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  badgeTextDefault: {
    color: Colors.text.secondary,
  },
  badgeTextSelected: {
    color: Colors.accent.blue,
  },
  badgeTextSelectedPurple: {
    color: '#B57CFF',
  },
  descriptionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
    marginLeft: 44,
  },
  methodsList: {
    flexDirection: 'column',
    gap: 12,
    paddingBottom: 4,
  },
  methodCard: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  methodCardSelectedCustom: {
    backgroundColor: 'rgba(74, 184, 248, 0.10)',
    borderColor: Colors.accent.blue,
  },
  methodCardSelectedAi: {
    backgroundColor: 'rgba(181, 124, 255, 0.10)',
    borderColor: '#B57CFF',
  },
  methodCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  methodTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  methodIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  methodIconBlue: {
    backgroundColor: 'rgba(74, 184, 248, 0.14)',
  },
  methodIconPurple: {
    backgroundColor: 'rgba(181, 124, 255, 0.14)',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  methodSubtitle: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  methodDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 17,
    marginLeft: 46,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  nextButton: {
    flex: 1.4,
    minHeight: 46,
    backgroundColor: Colors.accent.blue,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0D1528',
    textAlign: 'center',
  },
  backButton: {
    flex: 1,
    minHeight: 46,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1.65,
    minHeight: 46,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonCustom: {
    backgroundColor: Colors.accent.blue,
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonAi: {
    backgroundColor: '#B57CFF',
    shadowColor: '#B57CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  confirmButtonText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#0D1528',
    textAlign: 'center',
  },
});
