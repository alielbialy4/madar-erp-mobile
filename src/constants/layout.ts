import type { TextStyle, ViewStyle } from 'react-native';
import { I18nManager } from 'react-native';
import { colors } from './colors';

/** Applied on app shell — pairs with I18nManager.forceRTL */
export const rootRtl: ViewStyle = {
  flex: 1,
  direction: 'rtl',
};

/** Every screen/content root should use this */
export const screenRtl: ViewStyle = {
  flex: 1,
  direction: 'rtl',
};

/** Row follows reading direction (mirrors automatically when isRTL) */
export const flexRow: ViewStyle = { flexDirection: 'row' };

export const flexCol: ViewStyle = { flexDirection: 'column' };

/** Arabic / UI copy */
export const textStart: TextStyle = {
  textAlign: I18nManager.isRTL ? 'right' : 'left',
  writingDirection: 'rtl',
};

export const textCenter: TextStyle = {
  textAlign: 'center',
  writingDirection: 'rtl',
};

/** Numbers, SKUs, barcodes, invoice IDs */
export const textLtr: TextStyle = {
  textAlign: 'left',
  writingDirection: 'ltr',
};

/** Trailing edge text in mixed rows (rare) */
export const textEnd: TextStyle = {
  textAlign: I18nManager.isRTL ? 'left' : 'right',
  writingDirection: 'rtl',
};

export const inputTextAlign = I18nManager.isRTL ? ('right' as const) : ('left' as const);

export const alignStart: ViewStyle = { alignItems: 'flex-start' };
export const alignEnd: ViewStyle = { alignItems: 'flex-end' };

/** Safe area / horizontal padding — logical edges */
export const edgeHorizontal = ['left', 'right'] as const;

/** Full-width horizontal inset (FAB bars, footers) */
export const insetHorizontal: ViewStyle = {
  start: 0,
  end: 0,
  paddingStart: 0,
  paddingEnd: 0,
};

export const posShellBg = colors.background;
