import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius } from '@/constants/spacing';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
  rounded?: boolean;
};

export function AppSkeleton({ width = '100%', height = 16, style, rounded }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        rounded ? styles.rounded : undefined,
        { width, height, opacity },
        style,
      ]}
    />
  );
}

export function AppSkeletonCard() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.card}>
      <AppSkeleton height={14} width="40%" />
      <AppSkeleton height={28} width="65%" style={styles.gap} />
      <AppSkeleton height={12} width="80%" style={styles.gap} />
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    base: { backgroundColor: c.borderSubtle, borderRadius: radius.md },
    rounded: { borderRadius: radius.pill },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: 16,
      gap: 8,
    },
    gap: { marginTop: 8 },
  });
}
