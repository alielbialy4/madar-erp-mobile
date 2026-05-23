import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/ui/AppText';

export function AppSectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: { ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    title: {
      ...textStart,
      flex: 1,
      color: c.text,
      fontSize: typography.cardTitle,
      fontFamily: fonts.bold,
      fontWeight: '700',
    },
  });
}
