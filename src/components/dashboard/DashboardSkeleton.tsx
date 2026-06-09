import React, { useMemo } from 'react';
import { View, useWindowDimensions, type DimensionValue } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { createDashboardStyles } from './dashboardStyles';
import { spacing } from '@/constants/spacing';

type Variant = 'global' | 'branch' | 'cashier';

type Props = {
  variant?: Variant;
};

export function DashboardSkeleton({ variant = 'global' }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  const block = (key: string | number, h: number, w?: DimensionValue) => (
    <View key={key} style={[ds.skeleton, { height: h, width: w ?? '100%' }]} />
  );

  return (
    <View style={ds.page}>
      {block('hero', 120)}
      {variant === 'global' ? (
        <>
          {block('global-label-1', 14, 120)}
          <View style={ds.kpiGridPrimary}>
            {[1, 2, 3, 4].map((i) => block(`global-kpi-${i}`, 96, isTablet ? '23%' : '25%'))}
          </View>
          {block('global-label-2', 14, 140)}
          <View style={ds.kpiGridSecondary}>
            {[1, 2, 3, 4, 5, 6].map((i) => block(`global-sec-${i}`, 80, isTablet ? '15%' : '31%'))}
          </View>
          <View style={isTablet ? ds.widgetGridTablet : ds.widgetStack}>
            <View style={isTablet ? ds.widgetMain : undefined}>{block('global-trend', 220)}</View>
            {isTablet ? (
              <View style={ds.widgetSide}>{block('global-products', 220)}</View>
            ) : (
              block('global-products', 180)
            )}
          </View>
        </>
      ) : variant === 'branch' ? (
        <>
          <View style={ds.kpiGridPrimary}>
            {[1, 2, 3, 4].map((i) => block(`branch-kpi-${i}`, 96, isTablet ? '23%' : '25%'))}
          </View>
          <View style={isTablet ? ds.widgetGridTablet : ds.widgetStack}>
            <View style={isTablet ? ds.widgetMain : undefined}>{block('branch-trend', 200)}</View>
            {isTablet ? (
              <View style={ds.widgetSide}>
                {block('branch-shift', 120)}
                {block('branch-dining', 100)}
              </View>
            ) : (
              <>
                {block('branch-shift', 120)}
                {block('branch-dining', 100)}
              </>
            )}
          </View>
        </>
      ) : (
        <>
          {block('cashier-shift', 140)}
          <View style={ds.kpiGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => block(`cashier-kpi-${i}`, 88, isTablet ? '31%' : '47%'))}
          </View>
        </>
      )}
      <View style={{ height: spacing.md }} />
    </View>
  );
}
