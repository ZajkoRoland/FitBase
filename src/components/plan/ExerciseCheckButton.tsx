import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface ExerciseCheckButtonProps {
  /** Whether the exercise is marked as completed */
  readonly isCompleted?: boolean;
  /** Optional callback triggered on press */
  readonly onToggle?: (newState: boolean) => void;
  /** Size in pixels (default 24) */
  readonly size?: number;
  /** Whether the checkbox is read-only / disabled */
  readonly disabled?: boolean;
}

/**
 * ExerciseCheckButton
 *
 * Isolated completion indicator button:
 * - Uncompleted: Subtle translucent circle with glowing border
 * - Completed: Filled with vibrant emerald green (#10B981) + sharp white checkmark
 * - Disabled: Read-only display of completion status (toggling restricted)
 */
export const ExerciseCheckButton: React.FC<ExerciseCheckButtonProps> = ({
  isCompleted = false,
  onToggle,
  size = 24,
  disabled = false,
}) => {
  const handlePress = () => {
    if (!disabled && onToggle) {
      onToggle(!isCompleted);
    }
  };

  const borderRadius = size / 2;

  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      onPress={disabled ? undefined : handlePress}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius,
        },
        isCompleted ? styles.completedCircle : styles.uncompletedCircle,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isCompleted }}
      accessibilityLabel={isCompleted ? 'Mark exercise uncompleted' : 'Mark exercise completed'}
    >
      {isCompleted && (
        <Svg
          width={Math.round(size * 0.58)}
          height={Math.round(size * 0.58)}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M20 6L9 17l-5-5" />
        </Svg>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncompletedCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 2,
    borderColor: 'rgba(74, 184, 248, 0.35)',
  },
  completedCircle: {
    backgroundColor: '#10B981', // Emerald green
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
});
