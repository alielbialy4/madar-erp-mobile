import { I18nManager, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/** App is Arabic-only; web may report isRTL=false while layout uses dir=rtl */
export const isRtl = I18nManager.isRTL || Platform.OS === 'web';

/**
 * Drawer anchored to the physical right edge (Arabic menu).
 * translateX is not mirrored by the layout engine — use screen coordinates.
 */
export function drawerClosedTranslateX(width: number): number {
  return width;
}

export function drawerOpenTranslateX(): number {
  return 0;
}

/** Chevron pointing toward "forward" / drill-down in RTL reading direction */
export function chevronForwardIcon(): keyof typeof MaterialIcons.glyphMap {
  return isRtl ? 'chevron-left' : 'chevron-right';
}

/** Back navigation arrow */
export function backArrowIcon(): keyof typeof MaterialIcons.glyphMap {
  return isRtl ? 'arrow-forward' : 'arrow-back';
}

export { flexRow, flexCol, rootRtl, screenRtl, textStart, textCenter, textEnd, textLtr, inputTextAlign, alignStart, alignEnd, edgeHorizontal, insetHorizontal } from '@/constants/layout';
