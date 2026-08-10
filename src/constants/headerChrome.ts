import { radius, spacing } from '@/constants/spacing';

/** Shared chrome for web-like app header (Navbar + BranchSwitcher + POS bars). */
export const HEADER_CHROME = {
  /** Content row height (web h-14). */
  rowHeight: 56,
  horizontalPaddingPhone: spacing.md,
  horizontalPaddingTablet: spacing.lg,
  gapPhone: spacing.xs,
  gapTablet: spacing.sm,

  actionSize: 36,
  actionIconSize: 20,
  actionRadius: radius.lg,

  pillMaxWidth: 280,
  /** Comfortable default width so text doesn't collapse next to sync tools. */
  pillPreferWidth: 220,
  pillMinHeight: 36,
  pillHeight: 36,
  pillRadius: radius.xl,
  pillPaddingX: 10,
  pillPaddingY: 4,
  pillIconWell: 28,
  pillIconSize: 14,
  pillCodeFontSize: 10,
  iconOnlySize: 36,

  syncCardRadius: radius.xl,
  syncCardMinHeight: 36,
  statusDot: 8,

  sheetIconWell: 32,
  sheetIconSize: 16,
  sheetRowRadius: radius.lg,

  separatorHeight: 22,
  avatarSize: 28,
  immersiveChipSize: 40,
} as const;
