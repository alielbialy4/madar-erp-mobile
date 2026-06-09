import { APP_IS_RTL } from '@/bootstrap/rtl';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/** App is Arabic-only — use APP_IS_RTL, not I18nManager.isRTL (false on Expo web). */
export const isRtl = APP_IS_RTL;

/** Off-screen X inside drawerShellLtr — positive slides panel past the right edge. */
export function drawerClosedTranslateX(width: number): number {
  return width;
}

export function drawerOpenTranslateX(): number {
  return 0;
}

export function chevronForwardIcon(): keyof typeof MaterialIcons.glyphMap {
  return isRtl ? 'chevron-left' : 'chevron-right';
}

export function backArrowIcon(): keyof typeof MaterialIcons.glyphMap {
  return isRtl ? 'arrow-forward' : 'arrow-back';
}

export {
  flexRow,
  flexRowReverse,
  flexCol,
  rootRtl,
  screenRtl,
  rtlDirection,
  textRtlBase,
  textStart,
  textAlignStart,
  textCenter,
  textEnd,
  textAlignEnd,
  textLtr,
  inputTextAlign,
  alignStart,
  alignEnd,
  edgeHorizontal,
  insetHorizontal,
  rtlMargin,
  rtlPadding,
  modalRtl,
  drawerShellLtr,
  contentAreaRtl,
  sidebarAreaRtl,
  tabletShellRow,
} from '@/constants/layout';
