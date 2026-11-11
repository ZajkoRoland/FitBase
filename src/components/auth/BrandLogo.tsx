import { PulseIcon } from '@/components/icons/PulseIcon';
import { Colors } from '@/constants/Colors';
import { StyleSheet, View } from 'react-native';

const BADGE_SIZE = 55;
const ICON_SIZE = 29;

interface BrandLogoProps {
  size?: number;
}

export function BrandLogo({ size = BADGE_SIZE }: BrandLogoProps) {
  const iconSize = Math.round((size / BADGE_SIZE) * ICON_SIZE);
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel="FitBase logo"
    >
      <PulseIcon size={iconSize} color={Colors.accent.sky} strokeWidth={2.14} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.border.navy,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 17px rgba(79, 195, 247, 0.4)',
  },
});
