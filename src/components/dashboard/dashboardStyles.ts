import { Platform, StyleSheet } from 'react-native';
import type { AppColors } from '@/constants/colors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

export type KpiTone = 'accent' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export const KPI_TONE_STYLES: Record<
  KpiTone,
  { bg: keyof AppColors | string; border: keyof AppColors | string; icon: keyof AppColors | string }
> = {
  accent: { bg: 'softPrimary', border: 'accentBorder', icon: 'accent' },
  success: { bg: 'softSuccess', border: 'softSuccessBorder', icon: 'success' },
  info: { bg: 'softInfo', border: 'softInfoBorder', icon: 'info' },
  warning: { bg: 'softWarning', border: 'softWarningBorder', icon: 'warning' },
  danger: { bg: 'softDanger', border: 'softDangerBorder', icon: 'danger' },
  neutral: { bg: 'surfaceMuted', border: 'borderSubtle', icon: 'textMuted' },
};

export function createDashboardStyles(c: AppColors) {
  const elevation = Platform.select({
    ios: {
      shadowColor: c.shadowMd,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: { elevation: 4 },
    default: {},
  });

  const softElevation = Platform.select({
    ios: {
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  });

  return StyleSheet.create({
    page: { gap: spacing.xl, paddingHorizontal: spacing.lg },
    sectionBlock: { gap: spacing.md },

    heroOuter: {
      borderRadius: radius.xxxl,
      overflow: 'hidden',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...elevation,
    },
    heroGradientBand: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 120,
      backgroundColor: c.primarySoftMuted,
      opacity: 0.55,
    },
    heroAccent: {
      height: 5,
      backgroundColor: c.primary,
    },
    heroBody: { padding: spacing.lg, gap: spacing.md },
    heroEyebrow: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.accent,
      letterSpacing: 0.3,
    },
    heroTitle: {
      ...textStart,
      fontSize: 22,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.5,
      lineHeight: 30,
    },
    heroSubtitle: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.regular,
      color: c.textMuted,
      lineHeight: 22,
    },
    heroMetaRow: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    refreshPill: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    refreshText: {
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    chipRow: { gap: spacing.sm },
    chipScroll: { gap: spacing.sm, paddingVertical: spacing.xs },
    actionChip: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.xl,
      borderWidth: 1,
    },
    actionChipPrimary: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    actionChipOutline: {
      backgroundColor: c.surface,
      borderColor: c.border,
    },
    actionChipText: {
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
      writingDirection: 'rtl',
    },

    scopePill: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    scopePillText: {
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
      writingDirection: 'rtl',
    },
    scopeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    sectionHeader: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    sectionTitleRow: { ...flexRow, alignItems: 'center', gap: spacing.sm, flex: 1 },
    sectionIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },
    sectionHint: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textCaption,
    },

    kpiGrid: { ...flexRow, flexWrap: 'wrap', gap: spacing.md },
    kpiGridPrimary: { ...flexRow, flexWrap: 'nowrap', gap: spacing.sm, alignItems: 'flex-start', width: '100%' },
    kpiGridSecondary: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },
    kpiCell: { flexGrow: 1, flexBasis: '47%', minWidth: 156 },
    kpiCellPrimary: { flex: 1, flexBasis: 0, minWidth: 0, maxWidth: '25%', alignSelf: 'flex-start' },
    kpiCellTablet: { flexBasis: '23%', minWidth: 140 },
    kpiCellSecondary: { flexGrow: 1, flexBasis: '31%', minWidth: 100 },
    kpiCellSecondaryTablet: { flexBasis: '15%', minWidth: 96 },
    kpiCellWide: { flexBasis: '100%', minWidth: '100%' },
    sectionLabel: {
      ...textStart,
      fontSize: 11,
      fontFamily: fonts.bold,
      color: c.textMuted,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    widgetStack: {
      gap: spacing.xl,
      width: '100%',
    },
    widgetGridTablet: {
      ...flexRow,
      direction: 'ltr',
      alignItems: 'stretch',
      gap: spacing.md,
      width: '100%',
    },
    widgetMain: { flex: 2, minWidth: 0, direction: 'rtl', width: '100%' },
    widgetSide: { flex: 1, minWidth: 0, maxWidth: 360, gap: spacing.md, direction: 'rtl', width: '100%' },
    dataGridTablet: {
      ...flexRow,
      direction: 'ltr',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    dataGridCell: { flex: 1, minWidth: 0, direction: 'rtl' },

    kpiCard: {
      borderRadius: radius.xxl,
      borderWidth: 1,
      padding: spacing.lg,
      gap: spacing.md,
      minHeight: 112,
      ...softElevation,
    },
    kpiTop: { ...flexRow, justifyContent: 'space-between', alignItems: 'flex-start' },
    kpiIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kpiLabel: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.medium,
      fontWeight: '600',
      color: c.textMuted,
    },
    kpiValue: {
      ...textStart,
      fontSize: 24,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.5,
    },
    kpiHint: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textCaption,
    },

    surfaceCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      overflow: 'hidden',
      ...softElevation,
    },
    cardHead: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      gap: 4,
    },
    cardBody: { padding: spacing.lg },
    cardTitle: {
      ...textStart,
      fontSize: typography.cardTitle,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },
    cardSubtitle: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textMuted,
    },

    listRow: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderSubtle,
    },
    listRowIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listRowBody: { flex: 1, minWidth: 0, gap: 2 },
    listRowTitle: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },
    listRowSub: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textMuted,
    },
    listRowMeta: {
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
      textAlign: 'left',
      writingDirection: 'ltr',
    },

    metricStrip: {
      ...flexRow,
      gap: spacing.sm,
      padding: spacing.lg,
    },
    metricBox: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.surfaceMuted,
      gap: spacing.xs,
    },
    metricValue: {
      fontSize: typography.pageTitle,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
    },
    metricLabel: {
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    detailRow: {
      ...flexRow,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderSubtle,
    },
    detailLabel: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.medium,
      color: c.textMuted,
      flex: 1,
    },
    detailValue: {
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
      textAlign: 'left',
      writingDirection: 'ltr',
      flexShrink: 1,
    },

    emptyBox: {
      padding: spacing.xxxl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: typography.small,
      fontFamily: fonts.medium,
      color: c.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    skeleton: {
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.lg,
    },
  });
}
