import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { createDashboardStyles } from '@/components/dashboard/dashboardStyles';
import { spacing } from '@/constants/spacing';

export function ProductInsightsSkeleton() {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  const block = (key: string | number, h: number, w?: `${number}%` | number) => (
    <View key={key} style={[ds.skeleton, { height: h, width: w ?? '100%' }]} />
  );

  return (
    <View style={{ gap: spacing.lg }}>
      {block('hero', 100)}
      <View style={{ ...ds.kpiGridSecondary, flexWrap: 'wrap', gap: spacing.sm }}>
        {[1, 2, 3, 4].map((i) => block(`kpi-${i}`, 88, isTablet ? '23%' : '48%'))}
      </View>
      {block('table', 200)}
    </View>
  );
}
