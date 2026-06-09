import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { DashboardDataTable, type DashboardTableColumn } from '@/components/dashboard/DashboardDataTable';
import { dateText, numberText } from '@/utils/format';
import { movementTypeLabel } from './productInsightsUtils';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { InsightsMovements, MovementType } from '@/types/productInsights';
import { Text } from '@/components/ui/AppText';

type Props = {
  movements: InsightsMovements;
  showBranchColumn?: boolean;
  onPageChange: (page: number) => void;
  loading?: boolean;
};

function movementTone(type: MovementType): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default' {
  switch (type) {
    case 'sale':
      return 'success';
    case 'refund':
    case 'purchase_return':
      return 'warning';
    case 'damage':
      return 'danger';
    case 'purchase':
      return 'info';
    default:
      return 'neutral';
  }
}

export function ProductInsightsMovementsTable({
  movements,
  showBranchColumn = true,
  onPageChange,
  loading = false,
}: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { data, pagination } = movements;

  const columns = useMemo((): DashboardTableColumn[] => {
    const base: DashboardTableColumn[] = [
      { key: 'date', label: 'التاريخ', flex: 1.3 },
      { key: 'type', label: 'نوع الحركة', width: 100 },
    ];
    if (showBranchColumn) base.push({ key: 'branch', label: 'الفرع', flex: 1 });
    base.push(
      { key: 'warehouse', label: 'المخزن', flex: 1 },
      { key: 'delta', label: 'وحدة ±', align: 'end', width: 72 },
      { key: 'reference', label: 'المرجع', width: 88 },
    );
    return base;
  }, [showBranchColumn]);

  const rows = useMemo(
    () =>
      data.map((row) => {
        const sign = row.delta > 0 ? '+' : '';
        const deltaColor = row.delta < 0 ? c.danger : c.success;
        const entry: Record<string, React.ReactNode> = {
          date: row.occurred_at ? dateText(row.occurred_at) : '—',
          type: <AppBadge label={movementTypeLabel(row.movement_type)} tone={movementTone(row.movement_type)} />,
          warehouse: row.warehouse_name ?? '—',
          delta: (
            <Text style={[styles.delta, { color: deltaColor }, textLtr]}>
              {sign}
              {numberText(row.delta)}
            </Text>
          ),
          reference: (
            <Text style={[styles.reference, textLtr]} numberOfLines={1}>
              {row.reference_id ? `#${row.reference_id}` : '—'}
            </Text>
          ),
        };
        if (showBranchColumn) entry.branch = row.branch_name ?? '—';
        return entry;
      }),
    [data, showBranchColumn, c.danger, c.success, styles.delta, styles.reference],
  );

  const canPrev = !loading && pagination.current_page > 1;
  const canNext = !loading && pagination.current_page < pagination.last_page;

  return (
    <View style={styles.wrap}>
      <DashboardDataTable
        title="حركات المخزون"
        hint="التغيير بالوحدات: + إدخال · − إخراج"
        badge={`${pagination.total} حركة`}
        columns={columns}
        rows={rows}
        emptyMessage="لا توجد حركات في هذه الفترة"
        footerHint={
          pagination.last_page > 1
            ? `صفحة ${pagination.current_page} من ${pagination.last_page}`
            : undefined
        }
      />
      {pagination.last_page > 1 ? (
        <View style={styles.pager}>
          <Pressable
            onPress={() => onPageChange(pagination.current_page - 1)}
            disabled={!canPrev}
            accessibilityRole="button"
            accessibilityLabel="الصفحة السابقة"
            style={({ pressed }) => [styles.pageBtn, !canPrev && styles.pageBtnDisabled, pressed && canPrev && { opacity: 0.85 }]}
          >
            <MaterialIcons name="chevron-right" size={22} color={canPrev ? c.text : c.textMuted} />
            <Text style={[styles.pageBtnText, !canPrev && { color: c.textMuted }]}>السابق</Text>
          </Pressable>
          <Text style={styles.pageInfo}>
            {pagination.current_page} / {pagination.last_page}
          </Text>
          <Pressable
            onPress={() => onPageChange(pagination.current_page + 1)}
            disabled={!canNext}
            accessibilityRole="button"
            accessibilityLabel="الصفحة التالية"
            style={({ pressed }) => [styles.pageBtn, !canNext && styles.pageBtnDisabled, pressed && canNext && { opacity: 0.85 }]}
          >
            <Text style={[styles.pageBtnText, !canNext && { color: c.textMuted }]}>التالي</Text>
            <MaterialIcons name="chevron-left" size={22} color={canNext ? c.text : c.textMuted} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    delta: {
      fontSize: typography.body,
      fontFamily: fonts.bold,
      textAlign: 'right',
    },
    reference: {
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    pager: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    pageBtn: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    pageBtnDisabled: { opacity: 0.5 },
    pageBtnText: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    pageInfo: {
      fontSize: typography.body,
      fontFamily: fonts.medium,
      color: c.textMuted,
      minWidth: 64,
      textAlign: 'center',
    },
  });
}
