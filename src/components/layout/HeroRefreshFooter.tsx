import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { HERO_CHIP_BG, HERO_CHIP_BORDER, HERO_MUTED_FG } from '@/constants/dashboardHeroTheme';
import { useColors } from '@/hooks/useColors';

type Props = {
  metaText?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  refreshLabel?: string;
};

export function HeroRefreshFooter({
  metaText,
  onRefresh,
  isLoading,
  refreshLabel = 'تحديث',
}: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  if (!metaText && !onRefresh) return null;

  return (
    <View style={styles.row}>
      {metaText ? (
        <View style={styles.metaPill}>
          <AppText style={styles.meta}>{metaText}</AppText>
        </View>
      ) : null}
      {onRefresh ? (
        <Pressable
          onPress={onRefresh}
          disabled={isLoading}
          style={({ pressed }) => [styles.refreshBtn, flexRow, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={refreshLabel}
        >
          {isLoading ? <ActivityIndicator size="small" color={c.sidebarForeground} /> : null}
          <MaterialIcons name="refresh" size={16} color={c.sidebarForeground} />
          <AppText style={styles.refreshLabel}>{refreshLabel}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      width: '100%',
      flexWrap: 'wrap',
    },
    metaPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
      backgroundColor: HERO_CHIP_BG,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: HERO_CHIP_BORDER,
      maxWidth: '100%',
    },
    meta: {
      ...textStart,
      fontSize: 11,
      fontFamily: fonts.medium,
      color: HERO_MUTED_FG,
      writingDirection: 'ltr',
    },
    refreshBtn: {
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: HERO_CHIP_BG,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: HERO_CHIP_BORDER,
      alignItems: 'center',
    },
    refreshLabel: {
      fontSize: 12,
      fontFamily: fonts.bold,
      color: c.sidebarForeground,
    },
  });
}
