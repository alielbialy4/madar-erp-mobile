import { designColors } from '@/constants/colors';
/** Guaranteed dark navy shell — matches front `.dashboard-hero-panel` / sidebar family. */
export const HERO_PANEL_BG = designColors.navy;

export const HERO_CHIP_BG = designColors.navyPressed;

export const HERO_CHIP_BORDER = designColors.slate900;

export const HERO_CHIP_BORDER_STRONG = designColors.slate800;

export const HERO_CHIP_BG_SUBTLE = designColors.deepPanel;

export const HERO_MUTED_FG = 'rgba(226,232,240,0.72)';

export const HERO_ACTIONS_CONTAINER_BORDER = designColors.slate900;

export const HERO_ACTIONS_CONTAINER_BG = designColors.navyPressed;

export const HERO_PRIMARY_CTA_BG = designColors.white;

export const HERO_PRIMARY_CTA_SHADOW = {
  shadowColor: designColors.black,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
} as const;

export const HERO_PANEL_SHADOW = {
  shadowColor: designColors.black,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 24,
  elevation: 8,
} as const;
