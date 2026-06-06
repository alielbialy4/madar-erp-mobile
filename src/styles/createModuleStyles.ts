import { StyleSheet } from 'react-native';
import type { AppColors } from '@/constants/colors';
import { elevation } from '@/constants/elevation';
import { flexRow, textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

/** Unified module styles — heroes, lists, forms, sheets */
export function createModuleStyles(c: AppColors) {
  return StyleSheet.create({
    page: { gap: spacing.xl },
    sectionBlock: { gap: spacing.md },

    heroOuter: {
      borderRadius: radius.xxxl,
      overflow: 'hidden',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...elevation(c, 'lg'),
    },
    heroCompact: {
      borderRadius: radius.xxl,
      overflow: 'hidden',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...elevation(c, 'sm'),
    },
    heroAccent: { height: 5, backgroundColor: c.primary },
    heroBody: { padding: spacing.lg, gap: spacing.md },
    heroBodyCompact: { padding: spacing.md, gap: spacing.sm },
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

    statPill: {
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
    statPillValue: {
      fontSize: typography.body,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },
    statPillLabel: {
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textMuted,
    },

    sectionCard: {
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      padding: spacing.lg,
      gap: spacing.md,
      ...elevation(c, 'sm'),
    },
    sectionHeader: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    sectionTitle: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },

    listRow: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
    },
    listRowPressed: { backgroundColor: c.surfaceMuted },

    filterBar: { gap: spacing.sm, paddingBottom: spacing.sm },
    filterRow: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },

    stickyFooter: {
      ...flexRow,
      gap: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      backgroundColor: c.surface,
    },

    sheetHeader: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },

    detailHero: {
      borderRadius: radius.xxxl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      padding: spacing.lg,
      gap: spacing.sm,
      ...elevation(c, 'md'),
    },
    detailAmount: {
      ...textStart,
      fontSize: typography.metric,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.text,
    },
    fieldRow: {
      ...flexRow,
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingBottom: spacing.sm,
    },
    fieldLabel: {
      ...textStart,
      color: c.textMuted,
      fontSize: typography.small,
      minWidth: 112,
    },
    fieldValue: {
      ...textStart,
      color: c.text,
      fontSize: typography.body,
      fontWeight: '700',
      flex: 1,
    },
  });
}

export type ModuleStyles = ReturnType<typeof createModuleStyles>;
