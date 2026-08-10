import { StyleSheet } from 'react-native';
import type { AppColors } from '@/constants/colors';
import { flexRow } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';

/** Shared operational list-row chrome — grouped by rules, not floating cards. */
export function createListRowChrome(c: AppColors) {
  return StyleSheet.create({
    card: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 56,
      borderRadius: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    cardPressed: {
      backgroundColor: c.surfaceMuted,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.control,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    content: { flex: 1, gap: 3 },
    trailing: { alignItems: 'flex-end', gap: spacing.xs },
  });
}
