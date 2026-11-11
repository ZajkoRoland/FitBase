import React from 'react';
import Svg from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export abstract class BaseIcon<P extends IconProps = IconProps> extends React.PureComponent<P> {
  protected readonly viewBox: string = '0 0 24 24';

  static defaultProps: IconProps = {
    size: 24,
    color: '#FFFFFF',
    strokeWidth: 2,
  };

  protected abstract renderShape(color: string, strokeWidth: number): React.ReactNode;

  render() {
    const { size, color, strokeWidth } = this.props;

    return (
      <Svg width={size} height={size} viewBox={this.viewBox} fill="none">
        {this.renderShape(color!, strokeWidth!)}
      </Svg>
    );
  }
}
