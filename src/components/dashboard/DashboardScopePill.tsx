import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { HERO_CHIP_BG, HERO_CHIP_BORDER } from '@/constants/dashboardHeroTheme';
import { Text } from '@/components/ui/AppText';

type Props = {
  label: string;
  dotColor?: string;
  variant?: 'default' | 'hero';
};

export function DashboardScopePill({ label, dotColor, variant = 'default' }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c, dotColor, variant), [c, dotColor, variant]);

  return (
    <View style={styles.pill}>
      <View style={styles.dot} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>, dotColor?: string, variant: 'default' | 'hero' = 'default') {
  const isHero = variant === 'hero';
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: isHero ? HERO_CHIP_BG : c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isHero ? HERO_CHIP_BORDER : c.borderSubtle,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: dotColor ?? c.accent,
      shadowColor: dotColor ?? c.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isHero ? 0.65 : 0.4,
      shadowRadius: isHero ? 6 : 4,
      elevation: 2,
    },
    text: {
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      color: isHero ? c.sidebarForeground : c.text,
      writingDirection: 'rtl',
    },
  });
}
