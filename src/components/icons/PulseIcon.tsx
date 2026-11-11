
import { Path } from 'react-native-svg';
import { BaseIcon } from './BaseIcon';

const PULSE_D = 'M3.43 12H8l1.63-6.86 3.1 13.72L14.83 12h5.74';

export class PulseIcon extends BaseIcon {
  protected renderShape(color: string, strokeWidth: number) {
    return (
      <Path
        d={PULSE_D}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
}
