import type { TextStyle, ViewStyle } from 'react-native';
import { I18nManager, Platform } from 'react-native';
import { fonts } from '@/constants/fonts';

const rtlViewDirection: ViewStyle = Platform.OS === 'web' ? {} : { direction: 'rtl' };

export const rootRtl: ViewStyle = {
  flex: 1,
  ...rtlViewDirection,
};

export const screenRtl: ViewStyle = {
  flex: 1,
  ...rtlViewDirection,
};

export const rtlDirection: ViewStyle = {
  ...rtlViewDirection,
};

export const flexRow: ViewStyle = { flexDirection: 'row' };

export const flexCol: ViewStyle = { flexDirection: 'column' };

const textRtlBase: TextStyle = {
  writingDirection: 'rtl',
};

export const textStart: TextStyle = {
  ...textRtlBase,
  textAlign: I18nManager.isRTL ? 'right' : 'left',
};

export const textCenter: TextStyle = {
  ...textRtlBase,
  textAlign: 'center',
};

export const textLtr: TextStyle = {
  fontFamily: fonts.regular,
  textAlign: 'left',
  writingDirection: 'ltr',
};

export const textEnd: TextStyle = {
  ...textRtlBase,
  textAlign: I18nManager.isRTL ? 'left' : 'right',
};

export const inputTextAlign = I18nManager.isRTL ? ('right' as const) : ('left' as const);

export const alignStart: ViewStyle = { alignItems: 'flex-start' };
export const alignEnd: ViewStyle = { alignItems: 'flex-end' };
export const alignCenter: ViewStyle = { alignItems: 'center' };
export const justifyCenter: ViewStyle = { justifyContent: 'center' };

export const edgeHorizontal = ['left', 'right'] as const;

/** Approximate AppHeader height for KeyboardAvoidingView offset on iOS. */
export const APP_HEADER_HEIGHT = 68;

/** Approximate OfflineBanner height when visible. */
export const OFFLINE_BANNER_HEIGHT = 36;

export const insetHorizontal: ViewStyle = {
  start: 0,
  end: 0,
  paddingStart: 0,
  paddingEnd: 0,
};

export function rtlMargin(marginSide: 'start' | 'end', value: number): ViewStyle {
  if (marginSide === 'start') {
    return I18nManager.isRTL ? { marginLeft: value } : { marginRight: value };
  }
  return I18nManager.isRTL ? { marginRight: value } : { marginLeft: value };
}
