import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';

export type PoseType = 'start' | 'peak';

export interface ExercisePoseMotionPlayerProps {
  readonly startImageUrl?: string | null;
  readonly peakImageUrl?: string | null;
  readonly exerciseTitle?: string;
  readonly cycleDurationMs?: number;
  readonly height?: number;
  readonly containerStyle?: StyleProp<ViewStyle>;
}

// Gyakorlat mozgás animáló komponens: folyamatos áttűnéssel váltogat
// a gyakorlat kiinduló és csúcsponti képe között (Plan kártyán és a Könyvtárban).
export function ExercisePoseMotionPlayer({
  startImageUrl,
  peakImageUrl,
  exerciseTitle,
  cycleDurationMs = 2000,
  height = 200,
  containerStyle,
}: ExercisePoseMotionPlayerProps): React.JSX.Element {
  const { t } = useLanguage();
  const displayExerciseTitle = exerciseTitle ?? t('library.exerciseDefault');

  const [activePose, setActivePose] = useState<PoseType>('start');
  const activePoseRef = useRef<PoseType>(activePose);
  activePoseRef.current = activePose;

  // Animációs érték: 0 = kezdő póz látható, 1 = csúcsponti állás
  const crossfadeAnim = useRef(new Animated.Value(0)).current;

  const hasBothPoses = Boolean(startImageUrl && peakImageUrl);
  const singleImageUrl = startImageUrl || peakImageUrl;

  useEffect(() => {
    if (!hasBothPoses) {
      return;
    }

    let isMounted = true;

    const intervalId = setInterval(() => {
      if (!isMounted) return;

      const nextPose: PoseType = activePoseRef.current === 'start' ? 'peak' : 'start';
      activePoseRef.current = nextPose;
      setActivePose(nextPose);

      Animated.timing(crossfadeAnim, {
        toValue: nextPose === 'peak' ? 1 : 0,
        duration: 400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, cycleDurationMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [hasBothPoses, cycleDurationMs, crossfadeAnim]);

  const handleSelectPose = (pose: PoseType) => {
    activePoseRef.current = pose;
    setActivePose(pose);
    Animated.timing(crossfadeAnim, {
      toValue: pose === 'peak' ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Tartalék nézet, ha nem érhető el kép a gyakorlathoz
  if (!startImageUrl && !peakImageUrl) {
    return (
      <View style={[styles.container, { height }, containerStyle]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{t('library.noImagePreview')}</Text>
        </View>
      </View>
    );
  }

  // Statikus nézet egyetlen elérhető kép esetén
  if (!hasBothPoses && singleImageUrl) {
    return (
      <View style={[styles.container, { height }, containerStyle]}>
        <View style={[styles.imageWrapper, { height }]}>
          <Image
            source={{ uri: singleImageUrl }}
            style={styles.heroImage}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={200}
            accessibilityLabel={t('library.posePreviewA11y', { title: displayExerciseTitle })}
          />
        </View>
      </View>
    );
  }

  // Áttűnés átlátszóságának számítása
  const startOpacity = crossfadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const peakOpacity = crossfadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.container, { height }, containerStyle]}>
      {/* Gyakorlat képek áttűnése */}
      <View style={[styles.imageWrapper, { height }]}>
        {startImageUrl && (
          <Animated.View style={[styles.imageLayer, { opacity: startOpacity }]}>
            <Image
              source={{ uri: startImageUrl }}
              style={styles.heroImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              accessibilityLabel={t('library.poseStartA11y', { title: displayExerciseTitle })}
            />
          </Animated.View>
        )}

        {peakImageUrl && (
          <Animated.View style={[styles.imageLayer, { opacity: peakOpacity }]}>
            <Image
              source={{ uri: peakImageUrl }}
              style={styles.heroImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              accessibilityLabel={t('library.posePeakA11y', { title: displayExerciseTitle })}
            />
          </Animated.View>
        )}
      </View>

      {/* Kezdő és csúcspont váltó gombok */}
      {hasBothPoses && (
        <View style={styles.poseSelectorRow}>
          <Pressable
            style={[
              styles.poseButton,
              activePose === 'start' && styles.poseButtonActive,
            ]}
            onPress={() => handleSelectPose('start')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ selected: activePose === 'start' }}
          >
            <Text
              style={[
                styles.poseText,
                activePose === 'start' && styles.poseTextActive,
              ]}
            >
              {t('library.poseStart')}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.poseButton,
              activePose === 'peak' && styles.poseButtonActive,
            ]}
            onPress={() => handleSelectPose('peak')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ selected: activePose === 'peak' }}
          >
            <Text
              style={[
                styles.poseText,
                activePose === 'peak' && styles.poseTextActive,
              ]}
            >
              {t('library.posePeak')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#DAF1FD',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  imageWrapper: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#DAF1FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '92%',
    height: '92%',
    borderRadius: 12,
  },
  poseSelectorRow: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 21, 40, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 3,
    gap: 4,
    zIndex: 3,
  },
  poseButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  poseButtonActive: {
    backgroundColor: Colors.accent.blue,
  },
  poseText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  poseTextActive: {
    color: '#08101E',
    fontWeight: '700',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: Colors.text.ghost,
    fontSize: 12,
  },
});
