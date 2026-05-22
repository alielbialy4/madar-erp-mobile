import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export function useResponsiveColumns(phone = 1, largePhone = 2, tablet = 3) {
  const { width } = useWindowDimensions();
  return useMemo(() => {
    if (width >= 900) return tablet + 1;
    if (width >= 700) return tablet;
    if (width >= 420) return largePhone;
    return phone;
  }, [largePhone, phone, tablet, width]);
}
