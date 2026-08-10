import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { getProductLayoutTier, isProductTablet } from '@/constants/productLayout';

export type ModuleHeaderStat = {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  stats?: ModuleHeaderStat[];
  actions?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  compact?: boolean;
};

export function ModuleHeader({ eyebrow, title, subtitle, stats, actions, onRefresh, refreshing, compact }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const tier = getProductLayoutTier(width);
  const tablet = isProductTablet(tier);
  const dense = compact || tier === 'compactPhone';
  const styles = useMemo(() => createStyles(c, { tablet, dense }), [c, dense, tablet]);

  const refreshAction = onRefresh ? (
    <Pressable
      onPress={onRefresh}
      disabled={refreshing}
      accessibilityRole="button"
      accessibilityLabel="تحديث البيانات"
      style={({ pressed }) => [styles.refreshAction, pressed && styles.pressed, refreshing && styles.disabled]}
    >
      {refreshing ? (
        <ActivityIndicator size="small" color={c.textMuted} />
      ) : (
        <MaterialIcons name="refresh" size={18} color={c.textMuted} />
      )}
      {!dense ? <AppText style={styles.refreshLabel}>تحديث</AppText> : null}
    </Pressable>
  ) : null;

  return (
    <View style={styles.root}>
      <View style={styles.headingRow}>
        <View style={styles.copy}>
          {eyebrow ? <AppText style={styles.eyebrow}>{eyebrow}</AppText> : null}
          <AppText style={styles.title} numberOfLines={2}>{title}</AppText>
          {subtitle ? <AppText style={styles.subtitle} numberOfLines={dense ? 2 : 3}>{subtitle}</AppText> : null}
        </View>
        {refreshAction}
      </View>

      {stats?.length ? (
        <View style={styles.summaryRail}>
          {stats.map((stat, index) => (
            <View key={`${stat.label}-${index}`} style={[styles.stat, index > 0 && styles.statDivider]}>
              <AppText style={[styles.statValue, { color: toneColor(c, stat.tone) }]} numberOfLines={1} adjustsFontSizeToFit>
                {stat.value}
              </AppText>
              <AppText style={styles.statLabel} numberOfLines={2}>{stat.label}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      {actions ? <View style={styles.actionRail}>{actions}</View> : null}
    </View>
  );
}

function toneColor(c: ReturnType<typeof useColors>, tone: ModuleHeaderStat['tone']): string {
  if (tone === 'success') return c.success;
  if (tone === 'warning') return c.warning;
  if (tone === 'danger') return c.danger;
  return c.text;
}

function createStyles(c: ReturnType<typeof useColors>, opts: { tablet: boolean; dense: boolean }) {
  return StyleSheet.create({
    root: {
      gap: opts.dense ? spacing.sm : spacing.md,
      paddingVertical: opts.dense ? spacing.sm : spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    headingRow: {
      ...flexRow,
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.lg,
    },
    copy: { flex: 1, minWidth: 0, gap: spacing.xs },
    eyebrow: {
      ...textStart,
      color: c.textCaption,
      fontFamily: fonts.bold,
      fontSize: typography.micro,
      letterSpacing: 0.6,
    },
    title: {
      ...textStart,
      color: c.text,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      fontSize: opts.tablet ? 24 : opts.dense ? 19 : 21,
      lineHeight: opts.tablet ? 32 : 28,
    },
    subtitle: {
      ...textStart,
      color: c.textMuted,
      fontFamily: fonts.regular,
      fontSize: typography.small,
      lineHeight: 20,
    },
    summaryRail: {
      ...flexRow,
      minHeight: 62,
      alignItems: 'stretch',
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    stat: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      gap: 1,
      paddingHorizontal: opts.tablet ? spacing.md : spacing.sm,
    },
    statValue: {
      ...textLtr,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      fontSize: typography.cardTitle,
      lineHeight: 22,
    },
    statLabel: {
      ...textStart,
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: typography.caption,
      lineHeight: 15,
    },
    statDivider: { borderStartWidth: StyleSheet.hairlineWidth, borderStartColor: c.border },
    actionRail: { ...flexRow, alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
    refreshAction: {
      ...flexRow,
      minHeight: 40,
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    refreshLabel: { color: c.textMuted, fontFamily: fonts.bold, fontSize: typography.caption },
    pressed: { backgroundColor: c.surfaceMuted },
    disabled: { opacity: 0.55 },
  });
}
