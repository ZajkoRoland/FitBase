import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  analyticsService,
} from '@/services/AnalyticsService';
import { LoggedExerciseOption } from '@/repositories/AnalyticsRepository';
import { ExerciseProgressChart } from '@/components/analytics/ExerciseProgressChart';

export const ExerciseProgressionSection: React.FC = () => {
  const { t, i18n } = useLanguage();
  const [exercises, setExercises] = useState<LoggedExerciseOption[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('barbell-bench-press');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    analyticsService
      .getLoggedExercises()
      .then((list) => {
        if (!isMounted) return;
        setExercises(list);
        if (list.length > 0) {
          // Ha a kiválasztott gyakorlat nincs a listában, az első elemet választjuk ki
          if (!list.some((item) => item.slug === selectedSlug)) {
            setSelectedSlug(list[0].slug);
          }
        }
      })
      .catch((err) => {
        console.warn('[ExerciseProgressionSection] Error loading exercises:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedExercise = useMemo(() => {
    return exercises.find((item) => item.slug === selectedSlug);
  }, [exercises, selectedSlug]);

  const selectedTitle = useMemo(() => {
    if (!selectedExercise) return '';
    return i18n.translateExerciseTitle(selectedExercise.title, selectedExercise.slug);
  }, [selectedExercise, i18n]);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={styles.iconCircle}>
            <Ionicons name="trending-up" size={16} color={Colors.accent.blue} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>{t('analytics.section.title')}</Text>
            <Text style={styles.sectionSubtitle}>{t('analytics.section.subtitle')}</Text>
          </View>
        </View>
      </View>

      {/* Görgethető gyakorlatválasztó címkék */}
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="small" color={Colors.accent.blue} />
        </View>
      ) : exercises.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          {exercises.map((item) => {
            const isSelected = item.slug === selectedSlug;
            const localizedName = i18n.translateExerciseTitle(item.title, item.slug);
            return (
              <TouchableOpacity
                key={item.slug}
                activeOpacity={0.75}
                onPress={() => setSelectedSlug(item.slug)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <Ionicons
                  name="barbell-outline"
                  size={13}
                  color={isSelected ? Colors.accent.blue : 'rgba(255, 255, 255, 0.4)'}
                />
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextActive]}
                  numberOfLines={1}
                >
                  {localizedName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Idővonal diagram */}
      <View style={styles.chartWrapper}>
        <ExerciseProgressChart
          slug={selectedSlug}
          exerciseTitle={selectedTitle}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  headerRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },
  loaderBox: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScroll: {
    marginBottom: 12,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(74, 184, 248, 0.16)',
    borderColor: 'rgba(74, 184, 248, 0.45)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chartWrapper: {
    paddingHorizontal: 20,
  },
});

