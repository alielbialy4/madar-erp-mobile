import React from 'react';
import { View } from 'react-native';
import { AppSkeleton, AppSkeletonCard } from '@/components/ui/AppSkeleton';
import { AppSkeletonList } from './AppSkeletonList';
import { spacing } from '@/constants/spacing';

/** KPI row skeleton for dashboard / report heroes */
export function AppSkeletonKpiRow({ count = 3 }: { count?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={`kpi-sk-${i}`} style={{ flex: 1, gap: spacing.xs }}>
          <AppSkeleton height={12} width="60%" />
          <AppSkeleton height={22} width="80%" />
        </View>
      ))}
    </View>
  );
}

/** Form section card skeleton */
export function AppSkeletonFormSection() {
  return (
    <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
      <AppSkeletonCard />
      <AppSkeletonCard />
    </View>
  );
}

/** Detail hero skeleton */
export function AppSkeletonDetailHero() {
  return (
    <View style={{ padding: spacing.lg, gap: spacing.md, alignItems: 'center' }}>
      <AppSkeleton height={64} width={64} style={{ borderRadius: 32 }} />
      <AppSkeleton height={24} width="55%" />
      <AppSkeleton height={16} width="40%" />
    </View>
  );
}

export { AppSkeletonList };
