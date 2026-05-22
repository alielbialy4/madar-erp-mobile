import { spacing } from './spacing';

/** Floating dock visual height */
export const TAB_BAR_DOCK_HEIGHT = 78;

/** Horizontal inset from screen edges */
export const TAB_BAR_HORIZONTAL_MARGIN = spacing.lg;

/** Gap between dock bottom and screen bottom (above home indicator) */
export const TAB_BAR_FLOAT_GAP = spacing.sm;

/** Center POS orb extends above the dock */
export const TAB_BAR_POS_LIFT = 22;

/** Minimum safe-area fallback */
export const TAB_BAR_MIN_BOTTOM_INSET = spacing.sm;

/**
 * Total vertical space reserved under scrollable content.
 * dock + float gap + typical safe area — use `useTabBarBottomInset()` at runtime.
 */
/** Content inset: dock + float gap + raised POS */
export const BOTTOM_NAV_HEIGHT = TAB_BAR_DOCK_HEIGHT + TAB_BAR_FLOAT_GAP + TAB_BAR_POS_LIFT;

export const TAB_BAR_BASE_INSET = BOTTOM_NAV_HEIGHT;
