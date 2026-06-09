import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ProductInsightsMetric } from './ProductInsightsMetric';
import type { DetailField } from './productDetailSections';
import { spacing } from '@/constants/spacing';

type Props = {
  title: string;
  icon: string;
  hint?: string;
  fields: DetailField[];
  columns?: 1 | 2;
  variant?: 'card' | 'flat';
  children?: React.ReactNode;
};

function MetricsGrid({
  fields,
  columns,
}: {
  fields: DetailField[];
  columns: 1 | 2;
}) {
  const { width, height } = useWindowDimensions();
  const isTabletLandscape = width >= 900 && width > height;
  const useTwoCol = columns === 2 && isTabletLandscape;

  return (
    <View style={[styles.grid, useTwoCol && styles.gridTwoCol]}>
      {fields.map((f) => (
        <View key={f.label} style={[styles.cell, useTwoCol && styles.cellHalf]}>
          <ProductInsightsMetric label={f.label} value={f.value} kind={f.kind} tone={f.tone} />
        </View>
      ))}
    </View>
  );
}

export function DetailInfoCard({
  title,
  icon,
  hint,
  fields,
  columns = 1,
  variant = 'card',
  children,
}: Props) {
  if (!fields.length && !children) return null;

  const body = (
    <>
      {fields.length > 0 ? <MetricsGrid fields={fields} columns={columns} /> : null}
      {children ? <View style={styles.children}>{children}</View> : null}
    </>
  );

  if (variant === 'flat') {
    return <View style={styles.flatWrap}>{body}</View>;
  }

  return (
    <DashboardSection title={title} hint={hint} icon={icon} iconTone="info">
      {body}
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  flatWrap: { gap: spacing.sm },
  grid: { gap: spacing.sm },
  gridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cell: { width: '100%' },
  cellHalf: { width: '48%' },
  children: { gap: spacing.sm, paddingTop: spacing.xs },
});
