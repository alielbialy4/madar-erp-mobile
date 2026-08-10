import type { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

export type AlertTone = 'warning' | 'danger' | 'info' | 'success';
export type AlertIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Shared chrome for banner / inline warning surfaces. */
export const ALERT_BANNER = {
  iconSize: 18,
  iconWell: 28,
  gap: spacing.sm,
  paddingX: spacing.md,
  paddingY: 10,
  radius: radius.lg,
  titleSize: typography.label,
  messageSize: typography.helper,
  lineHeight: 20,
  borderWidth: 1,
} as const;

/** Shared proportions for ConfirmDialog / alert cards. */
export const ALERT_DIALOG = {
  maxWidth: 460,
  iconWell: 52,
  glyphSize: 28,
  /** Extra-roomy inner padding. */
  padding: spacing.massive,
  gap: spacing.xxxl,
  screenInset: spacing.huge,
  titleSize: typography.sectionTitle,
  messageSize: typography.body,
  messageLineHeight: 24,
  actionMinHeight: 44,
  actionMinWidth: 112,
} as const;

export function alertTonePalette(c: AppColors, tone: AlertTone) {
  switch (tone) {
    case 'danger':
      return {
        bg: c.softDanger,
        border: c.softDangerBorder,
        fg: c.danger,
        icon: 'error-outline' as AlertIconName,
      };
    case 'info':
      return {
        bg: c.softInfo,
        border: c.softInfoBorder,
        fg: c.info,
        icon: 'info-outline' as AlertIconName,
      };
    case 'success':
      return {
        bg: c.softSuccess,
        border: c.softSuccessBorder,
        fg: c.success,
        icon: 'check-circle-outline' as AlertIconName,
      };
    default:
      return {
        bg: c.softWarning,
        border: c.softWarningBorder,
        fg: c.warning,
        icon: 'warning-amber' as AlertIconName,
      };
  }
}
