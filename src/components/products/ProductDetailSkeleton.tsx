import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { createDashboardStyles } from '@/components/dashboard/dashboardStyles';
import { spacing } from '@/constants/spacing';

export function ProductDetailSkeleton() {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const { width } = useWindowDimensions();
  const isTabletLandscape = width >= 900;

  const block = (key: string | number, h: number, w?: `${number}%` | number) => (
    <View key={key} style={[ds.skeleton, { height: h, width: w ?? '100%' }]} />
  );

  const sectionHeader = (key: string) => (
    <View key={key} style={{ gap: spacing.xs, marginTop: spacing.lg }}>
      {block(`${key}-title`, 20, '55%')}
      {block(`${key}-sub`, 14, '70%')}
    </View>
  );

  return (
    <View style={{ gap: spacing.md, paddingTop: spacing.sm }}>
      {sectionHeader('stock')}
      {block('stock-card', 180)}

      {sectionHeader('pricing')}
      {block('pricing-card', 140)}

      {sectionHeader('identity')}
      {block('identity-card', 120)}

      {sectionHeader('pos')}
      <View style={{ flexDirection: isTabletLandscape ? 'row' : 'column', gap: spacing.md }}>
        {block('pos-a', 100, isTabletLandscape ? '48%' : '100%')}
        {block('pos-b', 100, isTabletLandscape ? '48%' : '100%')}
      </View>

      {sectionHeader('extra')}
      <View style={{ flexDirection: isTabletLandscape ? 'row' : 'column', gap: spacing.md }}>
        {block('extra-a', 80, isTabletLandscape ? '48%' : '100%')}
        {block('extra-b', 80, isTabletLandscape ? '48%' : '100%')}
      </View>
    </View>
  );
}
