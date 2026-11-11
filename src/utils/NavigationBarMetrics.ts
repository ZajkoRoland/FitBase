export type NavigationMode = 'three-button' | 'gesture';

export interface TabBarDimensions {
  mode: NavigationMode;
  height: number;
  paddingBottom: number;
  paddingTop: number;
}

/**
 * NavigationBarMetrics
 *
 * Android system navigation modes (3-button vs gesture navigation)
 * based on window insets, and dynamically computing pixel-perfect dimensions for the tab bar.
 */
export class NavigationBarMetrics {

  public static getNavigationMode(bottomInset: number): NavigationMode {
    if (bottomInset > 0 && bottomInset <= 32) {
      return 'gesture';
    }
    return 'three-button';
  }

  public static calculateDimensions(bottomInset: number): TabBarDimensions {
    const mode = this.getNavigationMode(bottomInset);

    if (mode === 'gesture') {
      return {
        mode,
        height: 60 + bottomInset,
        paddingBottom: bottomInset + 8,
        paddingTop: 3,
      };
    }

    if (bottomInset > 32) {
      return {
        mode,
        height: 60 + bottomInset,
        paddingBottom: bottomInset + 8,
        paddingTop: 3,
      };
    }

    return {
      mode,
      height: 64,
      paddingBottom: 14,
      paddingTop: 3,
    };
  }
}
