import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { money } from '@/utils/format';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/ui/AppText';
import { DashboardSection } from './DashboardSection';

type BranchRow = Record<string, unknown>;

export function BranchPerformanceChart({ branches }: { branches: BranchRow[] }) {
  const c = useColors();
  const rows = useMemo(
    () => branches
      .map((branch) => ({
        name: String(branch.name ?? 'فرع'),
        today: Number(branch.today_revenue ?? 0),
        month: Number(branch.month_revenue ?? 0),
      }))
      .sort((a, b) => b.month - a.month)
      .slice(0, 10),
    [branches],
  );

  if (!rows.length) return null;

  const maxMonth = Math.max(...rows.map((row) => row.month), 1);
  const topToday = [...rows].sort((a, b) => b.today - a.today)[0];
  const monthTotal = rows.reduce((sum, row) => sum + row.month, 0);

  if (monthTotal === 0 && topToday.today === 0) {
    return (
      <DashboardSection
        title="أداء الفروع"
        hint="مقارنة مباشرة بين إيراد اليوم وإجمالي الشهر"
        icon="buildings"
        iconTone="accent"
        badge={`${branches.length}`}
      >
        <View style={[styles.noData, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}> 
          <Text style={[styles.noDataTitle, { color: c.text }]}>لا توجد إيرادات فروع في الفترة الحالية</Text>
          <Text style={[styles.noDataText, { color: c.textMuted }]}>القيم المستلمة من الخادم تساوي صفرًا؛ لم تُستبدل ببيانات تقديرية.</Text>
        </View>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection
      title="أداء الفروع"
      hint="مقارنة مباشرة بين إيراد اليوم وإجمالي الشهر"
      icon="buildings"
      iconTone="accent"
      badge={`${branches.length}`}
    >
      <View style={[styles.surface, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}> 
        <View style={[styles.summary, { borderBottomColor: c.borderSubtle }]}> 
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: c.textMuted }]}>إجمالي الشهر</Text>
            <Text style={[styles.summaryValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(monthTotal)}</Text>
          </View>
          <View style={[styles.summaryItem, styles.summaryDivider, { borderStartColor: c.borderSubtle }]}> 
            <Text style={[styles.summaryLabel, { color: c.textMuted }]}>الأعلى اليوم</Text>
            <Text style={[styles.summaryValue, { color: c.text }]} numberOfLines={1}>{topToday.name}</Text>
            <Text style={[styles.summaryMeta, { color: c.textMuted }]}>{money(topToday.today)}</Text>
          </View>
        </View>

        <View style={[styles.columnHeader, { borderBottomColor: c.borderSubtle }]}> 
          <Text style={[styles.headerBranch, { color: c.textCaption }]}>الفرع</Text>
          <Text style={[styles.headerAmount, { color: c.textCaption }]}>اليوم</Text>
          <Text style={[styles.headerAmount, { color: c.textCaption }]}>الشهر</Text>
        </View>

        {rows.map((row, index) => {
          const share = Math.max(row.month > 0 ? 3 : 0, (row.month / maxMonth) * 100);
          return (
            <View
              key={`${row.name}-${index}`}
              style={[styles.row, index < rows.length - 1 && { borderBottomColor: c.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <View style={styles.branchCell}>
                <View style={styles.branchTitleRow}>
                  <Text style={[styles.rank, { color: c.textCaption }]}>{index + 1}</Text>
                  <Text style={[styles.branchName, { color: c.text }]} numberOfLines={1}>{row.name}</Text>
                </View>
                <View style={[styles.track, { backgroundColor: c.surfaceMuted }]}> 
                  <View style={[styles.fill, { width: `${share}%`, backgroundColor: c.primary }]} />
                </View>
              </View>
              <Text style={[styles.amount, { color: row.today > 0 ? c.text : c.textCaption }]} numberOfLines={1}>{money(row.today)}</Text>
              <Text style={[styles.amount, styles.monthAmount, { color: c.text }]} numberOfLines={1}>{money(row.month)}</Text>
            </View>
          );
        })}
        {branches.length > rows.length ? (
          <Text style={[styles.moreNote, { color: c.textMuted }]}>يعرض أعلى {rows.length} فروع حسب إيراد الشهر.</Text>
        ) : null}
      </View>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  surface: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, overflow: 'hidden' },
  summary: { ...flexRow, borderBottomWidth: StyleSheet.hairlineWidth, padding: spacing.md },
  summaryItem: { flex: 1, minWidth: 0, gap: 2 },
  summaryDivider: { borderStartWidth: StyleSheet.hairlineWidth, paddingStart: spacing.md },
  summaryLabel: { ...textStart, fontFamily: fonts.medium, fontSize: typography.caption },
  summaryValue: { ...textStart, fontFamily: fonts.extraBold, fontSize: typography.body },
  summaryMeta: { ...textStart, fontFamily: fonts.medium, fontSize: typography.micro },
  columnHeader: { ...flexRow, alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBranch: { ...textStart, flex: 1, fontFamily: fonts.bold, fontSize: typography.micro },
  headerAmount: { width: 92, ...textLtr, fontFamily: fonts.bold, fontSize: typography.micro },
  row: { ...flexRow, minHeight: 68, alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  branchCell: { flex: 1, minWidth: 0, gap: spacing.xs },
  branchTitleRow: { ...flexRow, alignItems: 'center', gap: spacing.xs },
  rank: { width: 18, fontFamily: fonts.bold, fontSize: typography.micro },
  branchName: { ...textStart, flex: 1, fontFamily: fonts.bold, fontSize: typography.small },
  track: { height: 4, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  amount: { width: 92, ...textLtr, fontFamily: fonts.bold, fontSize: typography.caption },
  monthAmount: { fontFamily: fonts.extraBold },
  moreNote: { ...textStart, padding: spacing.md, fontFamily: fonts.regular, fontSize: typography.caption },
  noData: { minHeight: 108, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md },
  noDataTitle: { fontFamily: fonts.bold, fontSize: typography.body, textAlign: 'center' },
  noDataText: { fontFamily: fonts.regular, fontSize: typography.caption, textAlign: 'center', lineHeight: 18 },
});
