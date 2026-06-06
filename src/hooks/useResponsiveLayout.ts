import { useWindowDimensions } from 'react-native';
import { getBreakpoint, isTablet, responsive } from '@/constants/responsive';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);
  const tablet = isTablet(width);

  return {
    width,
    height,
    breakpoint,
    isTablet: tablet,
    isPhone: !tablet,
    isSmallPhone: width < 380,
    isLandscape: width > height,
    columns: responsive.columns[breakpoint],
    gridGap: responsive.gridGap[breakpoint],
    cardPadding: responsive.cardPadding[breakpoint],
    minTouchTarget: responsive.minTouchTarget,
  };
}
