import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { APP_IS_RTL } from '@/bootstrap/rtl';

/** Single RTL source — Arabic-only app; do not use I18nManager.isRTL (frozen at module load). */
export const isRtl = APP_IS_RTL;

/**
 * Shell views — flex only. Layout mirroring comes from I18nManager.forceRTL (see rtl.ts).
 * Do NOT set direction here — stacks with forceRTL and double-mirrors text/layout.
 */
export const rootRtl: ViewStyle = { flex: 1 };

export const screenRtl: ViewStyle = { flex: 1 };

/** No-op placeholder — forceRTL mirrors flex; kept for call-site compatibility. */
export const rtlDirection: ViewStyle = {};

/** Modal roots — flex only; forceRTL handles mirroring. */
export const modalRtl: ViewStyle = { flex: 1 };

/**
 * Modal drawer shell — physical LTR so right-anchored panels land on screen right.
 * Pair with sidebarAreaRtl on drawer content for Arabic text.
 */
export const drawerShellLtr: ViewStyle = {
  flex: 1,
  direction: 'ltr',
};

/** Horizontal row — mirrors under forceRTL. */
export const flexRow: ViewStyle = { flexDirection: 'row' };

/**
 * Tablet shell row: physical LTR so [content | sidebar] → sidebar on the RIGHT.
 * Content column uses contentAreaRtl.
 */
export const tabletShellRow: ViewStyle = {
  flex: 1,
  ...flexRow,
  minHeight: 0,
  direction: 'ltr',
};

/** Main content column — RTL inside the LTR tablet shell row. */
export const contentAreaRtl: ViewStyle = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  direction: 'rtl',
};

/** Persistent sidebar column — RTL inside the LTR tablet shell row. */
export const sidebarAreaRtl: ViewStyle = {
  flexShrink: 0,
  minHeight: 0,
  direction: 'rtl',
};

export const flexRowReverse: ViewStyle = { flexDirection: 'row-reverse' };

export const flexCol: ViewStyle = { flexDirection: 'column' };

/** Base Arabic text direction — separate from textAlign. */
export const textRtlBase: TextStyle = {
  writingDirection: 'rtl',
};

/**
 * Logical start — in RTL layout (forceRTL), `start` = visual right on native.
 * Web uses physical right (CSS dir=rtl).
 */
export const textAlignStart: TextStyle = {
  ...textRtlBase,
  textAlign: (Platform.OS === 'web' ? 'right' : 'start') as TextStyle['textAlign'],
};

/** Legacy alias. */
export const textStart: TextStyle = {
  ...textAlignStart,
};

export const textCenter: TextStyle = {
  ...textRtlBase,
  textAlign: 'center',
};

/**
 * Numbers / LTR — logical end in RTL layout = visual left on native.
 */
export const textLtr: TextStyle = {
  writingDirection: 'ltr',
  textAlign: (Platform.OS === 'web' ? 'left' : 'end') as TextStyle['textAlign'],
};

export const textAlignEnd: TextStyle = {
  ...textRtlBase,
  textAlign: (Platform.OS === 'web' ? 'left' : 'end') as TextStyle['textAlign'],
};

export const textEnd: TextStyle = {
  ...textAlignEnd,
};

/** TextInput — physical right for Arabic (works with forceRTL and direction:rtl parents). */
export const inputTextAlign = 'right' as const;

export const inputTextAlignNumeric = (Platform.OS === 'web' ? 'left' : 'right') as 'left' | 'right';

export const alignStart: ViewStyle = { alignItems: 'flex-start' };
export const alignEnd: ViewStyle = { alignItems: 'flex-end' };
export const alignCenter: ViewStyle = { alignItems: 'center' };
export const justifyCenter: ViewStyle = { justifyContent: 'center' };

export const edgeHorizontal = ['left', 'right'] as const;

export const APP_HEADER_HEIGHT = 68;
export const OFFLINE_BANNER_HEIGHT = 36;

export const insetHorizontal: ViewStyle = {
  paddingStart: 0,
  paddingEnd: 0,
};

export function rtlMargin(marginSide: 'start' | 'end', value: number): ViewStyle {
  return marginSide === 'start' ? { marginStart: value } : { marginEnd: value };
}

export function rtlPadding(paddingSide: 'start' | 'end', value: number): ViewStyle {
  return paddingSide === 'start' ? { paddingStart: value } : { paddingEnd: value };
}
