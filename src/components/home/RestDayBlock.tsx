import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

export function RestDayBlock(): React.JSX.Element {
  return (
    <TouchableOpacity style={restStyle.container} activeOpacity={0.8}>
      <View style={restStyle.iconContainer}>
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={Colors.accent.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </Svg>
      </View>
      <View style={restStyle.textContainer}>
        <Text style={restStyle.title}>Rest Day</Text>
        <Text style={restStyle.subtitle}>Take a break, you've earned it!</Text>
      </View>
    </TouchableOpacity>
  );
}

const restStyle = StyleSheet.create({
  container: {
    backgroundColor: '#152038',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: '#1A2840',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#374F6B',
    fontSize: 13,
  }
});
