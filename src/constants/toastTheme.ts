import type { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { AppColors } from '@/constants/colors';
import {
  HERO_CHIP_BG_SUBTLE,
  HERO_CHIP_BORDER,
  HERO_CHIP_BORDER_STRONG,
  HERO_MUTED_FG,
  HERO_PANEL_BG,
  HERO_PANEL_SHADOW,
} from '@/constants/dashboardHeroTheme';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export const TOAST_DURATION_MS = 3200;
export const TOAST_STACK_OFFSET = 8;
export const TOAST_MAX_VISIBLE = 2;

export const TOAST_SHELL = {
  backgroundColor: HERO_PANEL_BG,
  borderColor: HERO_CHIP_BORDER,
  ...HERO_PANEL_SHADOW,
} as const;

export const TOAST_ICON_CIRCLE = {
  backgroundColor: HERO_CHIP_BG_SUBTLE,
  borderColor: HERO_CHIP_BORDER_STRONG,
} as const;

export const TOAST_MESSAGE_COLOR = '#F8FAFC';
export const TOAST_ACTION_BG = HERO_CHIP_BG_SUBTLE;
export const TOAST_ACTION_BORDER = HERO_CHIP_BORDER_STRONG;
export const TOAST_ACTION_FG = HERO_MUTED_FG;

export function toastToneStyle(c: AppColors, tone: ToastTone): { accent: string; icon: IconName } {
  switch (tone) {
    case 'success':
      return { accent: c.success, icon: 'check-circle' };
    case 'error':
      return { accent: c.danger, icon: 'error-outline' };
    case 'warning':
      return { accent: c.warning, icon: 'warning-amber' };
    default:
      return { accent: c.info, icon: 'info-outline' };
  }
}
