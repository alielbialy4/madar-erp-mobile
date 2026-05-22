import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { getBreakpoint } from '@/constants/responsive';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const breakpoint = useMemo(() => getBreakpoint(width), [width]);
  const isTablet = width >= 900;
  const isPhone = width < 900;
  const isLargePhone = width >= 600 && width < 900;
  const isLandscape = width > height;
  const columns = useMemo(() => {
    if (width >= 1200) return 4;
    if (width >= 900) return 3;
    if (width >= 600) return 2;
    return 1;
  }, [width]);
  const gridColumns = useMemo(() => {
    if (width >= 1200) return 4;
    if (width >= 900) return 3;
    if (width >= 600) return 2;
    return 2;
  }, [width]);

  return {
    width,
    height,
    breakpoint,
    isTablet,
    isPhone,
    isLargePhone,
    isLandscape,
    columns,
    gridColumns,
  };
}

export function useResponsiveColumns(phone = 1, largePhone = 2, tablet = 3) {
  const { width } = useWindowDimensions();
  return useMemo(() => {
    if (width >= 1200) return tablet + 1;
    if (width >= 900) return tablet;
    if (width >= 600) return largePhone;
    return phone;
  }, [largePhone, phone, tablet, width]);
}
