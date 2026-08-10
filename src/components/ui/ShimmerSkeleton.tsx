import React from 'react';
import { ViewStyle } from 'react-native';
import { MotiView } from '@/lib/moti';
import { useColors } from '@/hooks/useColors';
import { radius } from '@/constants/spacing';

interface ShimmerSkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
}

export function ShimmerSkeleton({
  width = '100%',
  height = 20,
  radius = 8,
  style,
}: ShimmerSkeletonProps) {
  const c = useColors();

  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{
        type: 'timing',
        duration: 800,
        loop: true,
        repeatReverse: true,
      }}
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: c.surfaceMuted,
        },
        style as any,
      ]}
    />
  );
}

export function ShimmerSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerSkeleton
          key={i}
          height={72}
          radius={radius.card}
          style={{ marginBottom: 10 }}
        />
      ))}
    </>
  );
}
