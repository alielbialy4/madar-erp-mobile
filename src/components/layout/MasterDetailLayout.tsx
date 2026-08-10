import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { isTablet } from '@/constants/responsive';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';

type Props = {
  master: React.ReactNode;
  detail?: React.ReactNode | null;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Master pane width on tablet. */
  masterWidth?: number;
  /** Force enable/disable; defaults to width ≥ 900. */
  enabled?: boolean;
};

/**
 * Tablet resource master/detail — never a stretched phone column.
 * On phone, renders master only (caller handles navigation).
 */
export function MasterDetailLayout({
  master,
  detail,
  emptyTitle = 'اختر عنصرًا',
  emptyMessage = 'ستظهر التفاصيل هنا دون مغادرة القائمة.',
  masterWidth = 400,
  enabled,
}: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const split = enabled ?? isTablet(width);

  if (!split) {
    return <View style={styles.fill}>{master}</View>;
  }

  return (
    <View style={[styles.split, { backgroundColor: c.surfaceMuted }]}>
      <View
        style={[
          styles.master,
          {
            width: masterWidth,
            maxWidth: Math.min(masterWidth, Math.round(width * 0.42)),
            backgroundColor: c.background,
            borderEndColor: c.borderSubtle,
          },
        ]}
      >
        {master}
      </View>
      <View style={[styles.detail, { backgroundColor: c.background }]}>
        {detail ?? (
          <View style={styles.empty}>
            <AppText style={[styles.emptyTitle, { color: c.text }]}>{emptyTitle}</AppText>
            <AppText style={[styles.emptyMessage, { color: c.textMuted }]}>{emptyMessage}</AppText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
  split: {
    ...flexRow,
    flex: 1,
    minHeight: 0,
    alignItems: 'stretch',
  },
  master: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 0,
    borderEndWidth: StyleSheet.hairlineWidth,
  },
  detail: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...textStart,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    fontSize: typography.sectionTitle,
  },
  emptyMessage: {
    ...textStart,
    fontFamily: fonts.regular,
    fontSize: typography.small,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  emptyCard: {
    borderRadius: radius.surface,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
