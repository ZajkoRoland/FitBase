import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

export const MoonIcon = ({ color }: { color: string }) => (
  <View style={styles.moonWrapper}>
    <Svg width="16" height="16" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  </View>
);

export const WorkoutDotsIcon = () => (
  <View style={styles.dotsContainer}>
    <View style={[styles.dot, { backgroundColor: Colors.accent.blue }]} />
    <View style={[styles.dot, { backgroundColor: Colors.accent.blue, opacity: 0.7 }]} />
    <View style={[styles.dot, { backgroundColor: Colors.accent.blue, opacity: 0.4 }]} />
  </View>
);

const styles = StyleSheet.create({
  moonWrapper: {
    width: 28,
    height: 28,
    borderRadius: 24,
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
