import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityVolumeChart } from './ActivityVolumeChart';
import { BodyProgressCard } from './BodyProgressCard';
import { ExerciseProgressionSection } from './ExerciseProgressionSection';
import { StatsMetricsGrid } from './StatsMetricsGrid';
import { WeeklyConsistencyTracker } from './WeeklyConsistencyTracker';

interface StatisticsModalProps {
  visible: boolean;
  onClose: () => void;
}

// Részletes statisztikai modálablak
export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top > 0 ? insets.top : 16,
          },
        ]}
      >
        {/* Fejléc sáv */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('statistics.closeA11y')}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
            <Text style={styles.backText}>{t('statistics.backProfile')}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('statistics.title')}</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Görgethető tartalom */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom, 48) + 24,
            },
          ]}
        >
          {/* 1. Főbb teljesítménymutatók rácsa */}
          <StatsMetricsGrid />

          {/* 2. Heti cél és napi követő */}
          <WeeklyConsistencyTracker />

          {/* 3. 5 hetes aktivitási diagram */}
          <ActivityVolumeChart />

          {/* 4. Gyakorlat fejlődési diagram */}
          <ExerciseProgressionSection />

          {/* 5. Testsúly alakulása */}
          <BodyProgressCard />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.navy,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    minWidth: 70,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
});
