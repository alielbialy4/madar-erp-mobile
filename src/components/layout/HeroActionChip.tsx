import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import { flexRow } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import {
  HERO_CHIP_BG_SUBTLE,
  HERO_CHIP_BORDER_STRONG,
  HERO_PRIMARY_CTA_BG,
  HERO_PRIMARY_CTA_SHADOW,
} from '@/constants/dashboardHeroTheme';
import { useColors } from '@/hooks/useColors';

type IconName = keyof typeof MaterialIcons.glyphMap;

type Props = {
  label: string;
  icon?: IconName;
  variant?: 'primary' | 'secondary';
  /** Stretch to fill an equal-width slot in a row. */
  fill?: boolean;
  onPress: () => void;
};

export function HeroActionChip({ label, icon, variant = 'secondary', fill, onPress }: Props) {
  const c = useColors();
  const isPrimary = variant === 'primary';
  const styles = useMemo(() => createStyles(c, isPrimary, fill), [c, isPrimary, fill]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && { transform: [{ scale: 0.96 }] }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon ? (
        <MaterialIcons name={icon} size={18} color={isPrimary ? c.sidebar : c.sidebarForeground} />
      ) : null}
      <AppText style={styles.label} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

function createStyles(c: ReturnType<typeof useColors>, isPrimary: boolean, fill?: boolean) {
  return StyleSheet.create({
    chip: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: fill ? spacing.sm : spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.xl,
      ...(fill ? { flex: 1, minWidth: 0 } : {}),
      ...(isPrimary
        ? { backgroundColor: HERO_PRIMARY_CTA_BG, ...HERO_PRIMARY_CTA_SHADOW }
        : {
            backgroundColor: HERO_CHIP_BG_SUBTLE,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: HERO_CHIP_BORDER_STRONG,
          }),
    },
    label: {
      fontSize: 13,
      fontFamily: isPrimary ? fonts.bold : fonts.medium,
      color: isPrimary ? c.sidebar : c.sidebarForeground,
    },
  });
}
