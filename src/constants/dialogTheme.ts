import type { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { AppColors } from '@/constants/colors';
import { ALERT_DIALOG } from '@/constants/alertChrome';
import { elevation } from '@/constants/elevation';
import { radius } from '@/constants/spacing';

export type DialogTone = 'danger' | 'primary' | 'warning' | 'info';
export type DialogIconName = ComponentProps<typeof MaterialIcons>['name'];

export const DIALOG_MAX_WIDTH = ALERT_DIALOG.maxWidth;
export const DIALOG_ICON_SIZE = ALERT_DIALOG.iconWell;
export const DIALOG_GLYPH_SIZE = ALERT_DIALOG.glyphSize;

export function dialogToneStyle(
  c: AppColors,
  tone: DialogTone,
): {
  accent: string;
  softBg: string;
  softBorder: string;
  defaultIcon: DialogIconName;
  confirmVariant: 'primary' | 'danger';
} {
  switch (tone) {
    case 'danger':
      return {
        accent: c.danger,
        softBg: c.softDanger,
        softBorder: c.softDangerBorder,
        defaultIcon: 'error-outline',
        confirmVariant: 'danger',
      };
    case 'warning':
      return {
        accent: c.warning,
        softBg: c.softWarning,
        softBorder: c.softWarningBorder,
        defaultIcon: 'warning-amber',
        confirmVariant: 'primary',
      };
    case 'info':
      return {
        accent: c.info,
        softBg: c.softInfo,
        softBorder: c.softInfoBorder,
        defaultIcon: 'info-outline',
        confirmVariant: 'primary',
      };
    default:
      return {
        accent: c.primary,
        softBg: c.primarySoftMuted,
        softBorder: c.primarySoftBorder,
        defaultIcon: 'help-outline',
        confirmVariant: 'primary',
      };
  }
}

export function dialogCardStyle(c: AppColors) {
  return {
    backgroundColor: c.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: c.border,
    padding: ALERT_DIALOG.padding,
    gap: ALERT_DIALOG.gap,
    width: '100%' as const,
    maxWidth: DIALOG_MAX_WIDTH,
    ...elevation(c, 'xl'),
  };
}
