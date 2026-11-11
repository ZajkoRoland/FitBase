import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import type { ExerciseSummary } from '@/types/exercise';

export interface ExerciseCardProps {
  exercise: ExerciseSummary;
  onPress: (exercise: ExerciseSummary) => void;
}

export function ExerciseCard({ exercise, onPress }: ExerciseCardProps): React.JSX.Element {
  const { t, i18n } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const maxCardWidth = Math.floor((windowWidth - 32 - 12) / 2);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        { maxWidth: maxCardWidth },
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(exercise)}
    >
      <View style={styles.imageWrapper}>
        {exercise.image_url ? (
          <Image
            source={{ uri: exercise.image_url }}
            style={styles.image}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{t('library.noImage')}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.title} numberOfLines={2}>
          {i18n.translateExerciseTitle(exercise.name, exercise.slug)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    backgroundColor: Colors.background.elevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 180,
    overflow: 'hidden',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: Colors.border.active,
  },
  imageWrapper: {
    width: '100%',
    height: 116,
    backgroundColor: '#DAF1FD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.text.ghost,
    fontSize: 12,
  },
  footer: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
