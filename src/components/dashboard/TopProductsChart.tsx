import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';
import { Text } from '@/components/ui/AppText';
import { numberText } from '@/utils/format';
import { DashboardSection } from './DashboardSection';

type ProductRow = {
  product_name?: string;
  name?: string;
  total_sold?: number;
};

type Props = {
  products: ProductRow[];
};

export function TopProductsChart({ products }: Props) {
  const c = useColors();
  const slice = products.slice(0, 8);

  const maxValue = useMemo(
    () => Math.max(...slice.map((p) => Number(p.total_sold ?? 0)), 1),
    [slice],
  );
  const sparse = slice.length > 0 && slice.length < 3;

  return (
    <DashboardSection
      title="أفضل المنتجات"
      hint="حسب الكمية المباعة"
      icon="star"
      iconTone="success"
      badge={`${slice.length}`}
      badgeTone="success"
    >
      <View
        style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}
      >
        {slice.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: c.text }]}>لا توجد مبيعات منتجات بعد</Text>
            <Text style={[styles.emptyHint, { color: c.textMuted }]}>ستظهر البيانات عند تسجيل مبيعات.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {slice.map((p, i) => {
              const qty = Number(p.total_sold ?? 0);
              const pct = Math.max(4, (qty / maxValue) * 100);
              const name = String(p.product_name ?? p.name ?? '—');
              return (
                <View key={`${name}-${i}`} style={styles.row}>
                  <View style={[styles.rank, { backgroundColor: c.softPrimary, borderColor: c.accentBorder }]}>
                    <Text style={[styles.rankText, { color: c.accent }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.rowBody}>
                    <View style={[styles.nameRow, flexRow]}>
                      <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={[styles.qty, { color: c.text }]}>{numberText(qty)}</Text>
                    </View>
                    <View style={[styles.track, { backgroundColor: c.surfaceMuted }]}>
                      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: c.primary }]} />
                    </View>
                  </View>
                </View>
              );
            })}
            {sparse ? (
              <Text style={[styles.sparseHint, { color: c.textMuted }]}>
                بيانات محدودة — {numberText(slice.length)} منتج فقط
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    width: '100%',
    overflow: 'hidden',
  },
  empty: {
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.body,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: typography.tiny,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  row: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.sm,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: typography.tiny,
    fontFamily: fonts.bold,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  nameRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...textStart,
    flex: 1,
    fontSize: typography.small,
    fontFamily: fonts.bold,
  },
  qty: {
    fontSize: typography.small,
    fontFamily: fonts.extraBold,
    writingDirection: 'ltr',
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    minWidth: 4,
  },
  sparseHint: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
});
