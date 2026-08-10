import React from 'react';
import { View } from 'react-native';
import { AppButton, AppText } from '@/components/ui';
import { MadarSurface } from '@/components/madar';
import { AppEmptyState, AppLoadingState } from '@/components/feedback';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { ReportSectionHeader } from './ReportKpiRow';

export type ReportColumnDef = {
  key: string;
  label: string;
  align?: 'start' | 'end';
  render?: (value: unknown, row: Record<string, unknown>, rowIndex: number) => React.ReactNode;
};

type Props = {
  title: string;
  description?: string;
  columns: ReportColumnDef[];
  rows: Record<string, unknown>[];
  loading?: boolean;
  emptyMessage?: string;
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
};

function cellValue(col: ReportColumnDef, row: Record<string, unknown>, rowIndex: number): React.ReactNode {
  const raw = row[col.key];
  if (col.render) return col.render(raw, row, rowIndex);
  const text = raw == null || raw === '' ? '—' : String(raw);
  return <AppText style={col.align === 'end' ? textLtr : textStart}>{text}</AppText>;
}

export function ReportTableSection({
  title,
  description,
  columns,
  rows,
  loading,
  emptyMessage = 'لا توجد نتائج',
  page,
  perPage,
  total,
  onPageChange,
}: Props) {
  const c = useColors();
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  return (
    <View style={{ gap: spacing.md }}>
      <ReportSectionHeader title={title} description={description} />
      {loading && !rows.length ? <AppLoadingState /> : null}
      {!loading && !rows.length ? <AppEmptyState title={emptyMessage} /> : null}
      {rows.map((row, index) => {
        const seq = (page - 1) * perPage + index + 1;
        return (
          <MadarSurface key={String(row.id ?? row.product_id ?? `${page}-${index}`)} style={{ gap: spacing.sm }}>
            <View style={{ ...flexRow, justifyContent: 'space-between' }}>
              <AppText style={{ color: c.textMuted, ...textLtr }}>#{seq}</AppText>
            </View>
            {columns.map((col) => (
              <View key={col.key} style={{ ...flexRow, justifyContent: 'space-between', gap: spacing.sm }}>
                <AppText style={{ color: c.textMuted, ...textStart }}>{col.label}</AppText>
                <View style={{ flex: 1, alignItems: col.align === 'end' ? 'flex-end' : 'flex-start' }}>
                  {cellValue(col, row, index)}
                </View>
              </View>
            ))}
          </MadarSurface>
        );
      })}
      {total > perPage ? (
        <View style={{ ...flexRow, justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
          <AppButton title="السابق" variant="secondary" disabled={page <= 1 || loading} onPress={() => onPageChange(page - 1)} />
          <AppText style={textLtr}>
            {page} / {lastPage}
          </AppText>
          <AppButton title="التالي" variant="secondary" disabled={page >= lastPage || loading} onPress={() => onPageChange(page + 1)} />
        </View>
      ) : null}
    </View>
  );
}
