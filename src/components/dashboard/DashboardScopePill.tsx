import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/ui/AppText';

type Props = {
  label: string;
  dotColor?: string;
};

export function DashboardScopePill({ label, dotColor }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c, dotColor), [c, dotColor]);

  return (
    <View style={styles.pill}>
      <View style={styles.dot} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>, dotColor?: string) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: dotColor ?? c.accent,
      shadowColor: dotColor ?? c.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 2,
    },
    text: {
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      color: c.text,
      writingDirection: 'rtl',
    },
  });
}
