import React from 'react';
import { Circle, Line } from 'react-native-svg';
import { BaseIcon, IconProps } from './BaseIcon';

/**
 * FilterIcon
 *
 * Implements the equalizer/filter slider icon used in the Exercise Library header.
 */
export class FilterIcon extends BaseIcon<IconProps> {
  protected override renderShape(color: string, strokeWidth: number): React.ReactNode {
    return (
      <>
        <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Circle cx="8" cy="6" r="2.5" fill={color} />

        <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Circle cx="16" cy="12" r="2.5" fill={color} />

        <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Circle cx="10" cy="18" r="2.5" fill={color} />
      </>
    );
  }
}
