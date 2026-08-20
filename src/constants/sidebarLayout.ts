export const SIDEBAR_WIDTH = 280;

/** Keep a peek of the app behind the mobile drawer. */
export const SIDEBAR_DRAWER_PEEK = 72;

export function drawerWidthForScreen(screenWidth: number): number {
  return Math.min(SIDEBAR_WIDTH, Math.max(248, screenWidth - SIDEBAR_DRAWER_PEEK));
}

export const SIDEBAR_MUTED = 'rgba(255,255,255,0.52)';

export const SIDEBAR_BORDER = 'rgba(255,255,255,0.08)';

export const SIDEBAR_FOOTER_BTN_BG = 'rgba(255,255,255,0.06)';

export const SIDEBAR_ICON_ACTIVE_BG = 'rgba(51, 102, 255, 0.28)';

export const SIDEBAR_ICON_IDLE_BG = 'rgba(255,255,255,0.04)';

export const SIDEBAR_ITEM_ACTIVE_BG = 'rgba(255,255,255,0.1)';

export const SIDEBAR_ITEM_PRESSED_BG = 'rgba(255,255,255,0.06)';
