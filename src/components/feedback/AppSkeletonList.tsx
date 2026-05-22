import React from 'react';
import { View } from 'react-native';
import { AppSkeleton, AppSkeletonCard } from '@/components/ui/AppSkeleton';
import { spacing } from '@/constants/spacing';

type Props = {
  rows?: number;
  variant?: 'rows' | 'cards';
};

export function AppSkeletonList({ rows = 6, variant = 'rows' }: Props) {
  if (variant === 'cards') {
    return (
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
          <AppSkeletonCard key={`sk-card-${i}`} />
        ))}
      </View>
    );
  }

  return (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={`sk-row-${i}`} style={{ gap: spacing.sm }}>
          <AppSkeleton height={18} width="55%" />
          <AppSkeleton height={14} width="80%" />
        </View>
      ))}
    </View>
  );
}
