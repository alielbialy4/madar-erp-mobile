import { StyleSheet } from 'react-native';
import type { AppColors } from '@/constants/colors';
import { flexRow, textCenter, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

export function createInventoryUiStyles(c: AppColors) {
  return StyleSheet.create({
    chipsWrap: {
      ...flexRow,
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    filterPillWithIcon: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
    },
    sectionHeaderRow: {
      ...flexRow,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    linkAction: {
      ...textStart,
      color: c.accent,
      fontFamily: fonts.bold,
      fontWeight: '700',
      fontSize: typography.small,
    },
    hint: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textMuted,
      lineHeight: 20,
    },
    formNote: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textCaption,
      lineHeight: 20,
    },
    errorInline: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.medium,
      color: c.danger,
    },
    successInline: {
      ...textCenter,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.success,
    },
    dualFieldRow: {
      ...flexRow,
      gap: spacing.sm,
      alignItems: 'flex-start',
    },
    badgeTitleRow: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
  });
}
