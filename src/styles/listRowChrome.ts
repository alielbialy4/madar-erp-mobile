import { StyleSheet } from 'react-native';
import type { AppColors } from '@/constants/colors';
import { elevation } from '@/constants/elevation';
import { flexRow } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';

/** Shared card-style list row chrome — used by AppListItem, AppResourceRow, AppDomainCard */
export function createListRowChrome(c: AppColors) {
  return StyleSheet.create({
    card: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      minHeight: 56,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      ...elevation(c, 'sm'),
    },
    cardPressed: {
      backgroundColor: c.surfaceMuted,
      borderColor: c.border,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.softPrimary,
    },
    content: { flex: 1, gap: 3 },
    trailing: { alignItems: 'flex-end', gap: spacing.xs },
  });
}
