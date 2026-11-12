import React from 'react';
import { Path } from 'react-native-svg';
import { BaseIcon, type IconProps } from './BaseIcon';

// Lefelé mutató nyíl
export class ChevronDownIcon extends BaseIcon<IconProps> {
  protected override renderShape(color: string, strokeWidth: number): React.ReactNode {
    return (
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
}
