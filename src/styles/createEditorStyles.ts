import { StyleSheet } from 'react-native';
import type { AppColors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';

export function createEditorStyles(c: AppColors) {
  return StyleSheet.create({
    section: { gap: spacing.sm },
    row: {
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: c.surface,
    },
    rowHeader: { gap: spacing.xs },
    inlineGap: { gap: spacing.sm },
  });
}
