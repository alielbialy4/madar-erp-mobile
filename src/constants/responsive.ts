import { Dimensions, Platform } from 'react-native';

export type Breakpoint = 'phone' | 'largePhone' | 'tablet' | 'largeTablet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function getBreakpoint(w: number = SCREEN_WIDTH): Breakpoint {
  if (w >= 1200) return 'largeTablet';
  if (w >= 900) return 'tablet';
  if (w >= 600) return 'largePhone';
  return 'phone';
}

export function isTablet(w: number = SCREEN_WIDTH): boolean {
  return w >= 900;
}

export function isLargePhone(w: number = SCREEN_WIDTH): boolean {
  return w >= 600 && w < 900;
}

export const DEVICE = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isTablet: SCREEN_WIDTH >= 900,
  isPhone: SCREEN_WIDTH < 900,
  isLargePhone: SCREEN_WIDTH >= 600 && SCREEN_WIDTH < 900,
  isSmallPhone: SCREEN_WIDTH < 380,
  isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',
};

export const responsive = {
  columns: {
    phone: 1,
    largePhone: 2,
    tablet: 3,
    largeTablet: 4,
  },
  gridGap: {
    phone: 12,
    largePhone: 14,
    tablet: 16,
    largeTablet: 18,
  },
  cardPadding: {
    phone: 16,
    largePhone: 18,
    tablet: 20,
    largeTablet: 24,
  },
  sideNavWidth: 280,
  tabletMinSplit: 900,
  /** Apple HIG / Material minimum touch target */
  minTouchTarget: 44,
};
