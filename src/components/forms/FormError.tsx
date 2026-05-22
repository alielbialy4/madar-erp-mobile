import React, { useMemo } from 'react';
import { textStart } from '@/constants/layout';
import { StyleSheet } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export function FormError({ message }: { message?: string | null }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    error: { color: c.danger, fontSize: typography.small, ...textStart, fontWeight: '700' },
  });
}
