import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface OnboardingOptionCardProps {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onSelect: () => void;
  subtitle?: string;
  variant?: 'default' | 'final';
}

// Választókártya az onboarding folyamatban
export const OnboardingOptionCard: React.FC<OnboardingOptionCardProps> = ({
  label,
  iconName,
  selected,
  onSelect,
  subtitle,
  variant = 'default',
}) => {
  const isFinal = variant === 'final';
  const activeColor = isFinal ? Colors.accent.green : '#4FC3F7';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && (isFinal ? styles.cardSelectedFinal : styles.cardSelectedDefault),
      ]}
      onPress={onSelect}
      activeOpacity={0.75}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={styles.leftRow}>
        {iconName ? (
          <View
            style={[
              styles.iconCircle,
              selected && (isFinal ? styles.iconCircleSelectedFinal : styles.iconCircleSelectedDefault),
            ]}
          >
            <Ionicons
              name={iconName}
              size={20}
              color={selected ? activeColor : '#7A8FA8'}
            />
          </View>
        ) : null}

        <View style={styles.textColumn}>
          <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View
        style={[
          styles.radio,
          selected && {
            backgroundColor: activeColor,
            borderColor: activeColor,
          },
        ]}
      >
        {selected ? <Ionicons name="checkmark-sharp" size={14} color="#091120" /> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E1628',
    borderWidth: 1.2,
    borderColor: '#1B2942',
    borderRadius: 24,
    minHeight: 82,
    paddingVertical: 17,
    paddingHorizontal: 20,
    marginBottom: 14,
    width: '100%',
  },
  cardSelectedDefault: {
    borderWidth: 1.8,
    borderColor: '#4FC3F7',
    backgroundColor: '#10253E',
  },
  cardSelectedFinal: {
    borderWidth: 1.8,
    borderColor: Colors.accent.green,
    backgroundColor: 'rgba(0, 230, 118, 0.09)',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#152036',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelectedDefault: {
    backgroundColor: '#17385B',
  },
  iconCircleSelectedFinal: {
    backgroundColor: 'rgba(0, 230, 118, 0.16)',
  },
  textColumn: {
    flex: 1,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#E8EEF5',
    letterSpacing: -0.1,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 12.5,
    color: '#6B7F99',
    marginTop: 3,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#263854',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
