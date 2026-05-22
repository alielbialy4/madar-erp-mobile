import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_NAV_HEIGHT, TAB_BAR_FLOAT_GAP, TAB_BAR_MIN_BOTTOM_INSET } from '@/constants/tabBar';

/** Bottom padding so scrollable content clears the floating tab bar */
export function useTabBarBottomInset(extra = 0): number {
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_INSET);
  return BOTTOM_NAV_HEIGHT + TAB_BAR_FLOAT_GAP + safeBottom + extra;
}
