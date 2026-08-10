import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { APP_IS_RTL } from '@/bootstrap/rtl';

/** Mirrors I18nManager after locale hydrate/reload (ar → RTL, en/fr → LTR). */
export const isRtl = APP_IS_RTL;

/** App text direction after locale hydrate/reload — use instead of hardcoding 'rtl'. */
export const appWritingDirection: TextStyle['writingDirection'] = isRtl ? 'rtl' : 'ltr';
const writingDirection = appWritingDirection;
const webStartAlign = isRtl ? 'right' : 'left';
const webEndAlign = isRtl ? 'left' : 'right';
const appViewDirection: NonNullable<ViewStyle['direction']> = isRtl ? 'rtl' : 'ltr';

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

/** Main content column — app text direction inside the LTR tablet shell row. */
export const contentAreaRtl: ViewStyle = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  direction: appViewDirection,
};

/** Persistent sidebar column — app text direction inside the LTR tablet shell row. */
export const sidebarAreaRtl: ViewStyle = {
  flexShrink: 0,
  minHeight: 0,
  direction: appViewDirection,
};

/** Content views that previously hard-locked `direction: 'rtl'`. */
export const appContentDirection: ViewStyle = {
  direction: appViewDirection,
};

export const flexRowReverse: ViewStyle = { flexDirection: 'row-reverse' };

export const flexCol: ViewStyle = { flexDirection: 'column' };

/** Base app text direction — separate from textAlign. */
export const textRtlBase: TextStyle = {
  writingDirection,
};

/**
 * Logical start — with forceRTL, `start` mirrors; on web use physical start from dir.
 */
export const textAlignStart: TextStyle = {
  ...textRtlBase,
  textAlign: (Platform.OS === 'web' ? webStartAlign : 'start') as TextStyle['textAlign'],
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
  textAlign: (Platform.OS === 'web' ? webEndAlign : 'end') as TextStyle['textAlign'],
};

export const textAlignEnd: TextStyle = {
  ...textRtlBase,
  textAlign: (Platform.OS === 'web' ? webEndAlign : 'end') as TextStyle['textAlign'],
};

export const textEnd: TextStyle = {
  ...textAlignEnd,
};

/** Physical textAlign for StyleSheets that cannot spread textStart. */
export const appTextAlignStart = textAlignStart.textAlign!;
export const appTextAlignEnd = textAlignEnd.textAlign!;

/** TextInput — physical start for current app direction. */
export const inputTextAlign = (isRtl ? 'right' : 'left') as 'left' | 'right';

export const inputTextAlignNumeric = (
  Platform.OS === 'web' ? (isRtl ? 'left' : 'right') : isRtl ? 'right' : 'left'
) as 'left' | 'right';

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
