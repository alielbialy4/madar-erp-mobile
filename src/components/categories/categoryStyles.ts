import { Platform, StyleSheet } from 'react-native';
import type { AppColors } from '@/constants/colors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

export function createCategoryStyles(c: AppColors) {
  const cardShadow = Platform.select({
    ios: {
      shadowColor: c.shadowMd,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 3 },
    default: {},
  });

  return StyleSheet.create({
    pageHeader: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs },
    statsRow: { ...flexRow, gap: spacing.sm },
    statBox: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      gap: 4,
    },
    statBoxCompact: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.lg,
    },
    statValueCompact: {
      fontSize: typography.sectionTitle,
    },
    statValue: {
      fontSize: typography.pageTitle,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.text,
    },
    statLabel: {
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    searchWrap: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    searchInput: { flex: 1, minHeight: 40 },
    filterScroll: { gap: spacing.sm, paddingVertical: spacing.xs },
    filterPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
    },
    filterPillActive: {
      backgroundColor: c.softPrimary,
      borderColor: c.accentBorder,
    },
    filterText: {
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.textMuted,
      writingDirection: 'rtl',
    },
    filterTextActive: { color: c.accent },
    listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
    listSeparator: { height: spacing.sm },
    categoryCard: {
      borderRadius: radius.xxl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      overflow: 'hidden',
      ...cardShadow,
    },
    cardPressable: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
    cardTop: { ...flexRow, alignItems: 'center', gap: spacing.sm },
    cardChevron: { paddingStart: spacing.xs, minWidth: 28, alignItems: 'center', justifyContent: 'center' },
    thumb: { width: 56, height: 56, borderRadius: radius.lg },
    thumbPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
    },
    cardBody: { flex: 1, minWidth: 0, gap: spacing.xs },
    cardTitle: {
      ...textStart,
      fontSize: typography.cardTitle,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },
    cardDesc: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textMuted,
    },
    cardMeta: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textCaption,
    },
    cardActions: {
      ...flexRow,
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderSubtle,
    },
    actionBtn: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
      justifyContent: 'center',
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
    },
    actionBtnPrimary: {
      backgroundColor: c.softPrimary,
    },
    actionText: {
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.textMuted,
      writingDirection: 'rtl',
    },
    actionTextPrimary: { color: c.accent },
    sectionLabel: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.textMuted,
    },
  });
}
