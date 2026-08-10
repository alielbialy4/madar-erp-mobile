import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/ui/AppText';
import { appWritingDirection } from '@/constants/layout';

type Props = {
  label: string;
  dotColor?: string;
  variant?: 'default' | 'hero';
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
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: dotColor ?? c.accent,
    },
    text: {
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      color: c.text,
      writingDirection: appWritingDirection,
    },
  });
}
