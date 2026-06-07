import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/components/ui/AppIcon';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { AppText } from '@/components/ui/AppText';

type IconName = Parameters<typeof AppIcon>[0]['name'];

export type ModuleHeroStat = { label: string; value: string | number; tone?: 'default' | 'success' | 'warning' | 'danger' };

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  stats?: ModuleHeroStat[];
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: React.ReactNode;
  compact?: boolean;
};

export function ModuleHero({ eyebrow, title, subtitle, stats, onRefresh, refreshing, actions, compact }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c, compact), [c, compact]);

  return (
    <View style={styles.heroOuter}>
      <LinearGradient
        colors={[c.accent + '12', c.accent + '03', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.heroAccent} />
      <View style={styles.heroBody}>
        {eyebrow ? <AppText style={styles.heroEyebrow}>{eyebrow}</AppText> : null}
        <View style={{ ...flexRow, alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText style={styles.heroTitle}>{title}</AppText>
            {subtitle ? <AppText style={styles.heroSubtitle}>{subtitle}</AppText> : null}
          </View>
          {onRefresh ? (
            <Pressable onPress={onRefresh} style={styles.statPill} accessibilityRole="button" accessibilityLabel="تحديث">
              {refreshing ? <ActivityIndicator size="small" color={c.accent} /> : <AppIcon name="arrow-clockwise" size={16} color={c.textMuted} />}
            </Pressable>
          ) : null}
        </View>
        {stats?.length ? (
          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statPill}>
                <AppText style={styles.statPillValue}>{stat.value}</AppText>
                <AppText style={styles.statPillLabel}>{stat.label}</AppText>
              </View>
            ))}
          </View>
        ) : null}
        {actions ? <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>{actions}</View> : null}
      </View>
    </View>
  );
}

function createStyles(c: AppColors, compact?: boolean) {
  return StyleSheet.create({
    heroOuter: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
      borderRadius: radius.xxxl,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
    },
    heroAccent: {
      height: 3,
      backgroundColor: c.accent,
    },
    heroBody: {
      padding: compact ? spacing.md : spacing.lg,
      gap: compact ? spacing.sm : spacing.md,
    },
    heroEyebrow: {
      ...textStart,
      fontSize: 11,
      fontFamily: fonts.bold,
      color: c.accent,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    heroTitle: {
      ...textStart,
      fontSize: compact ? 18 : 22,
      fontFamily: fonts.extraBold,
      color: c.text,
      letterSpacing: -0.5,
      lineHeight: compact ? 24 : 30,
    },
    heroSubtitle: {
      ...textStart,
      fontSize: 14,
      fontFamily: fonts.regular,
      color: c.textMuted,
      lineHeight: 20,
    },
    statPill: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
    },
    statPillValue: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: c.text,
    },
    statPillLabel: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: c.textMuted,
    },
  });
}
