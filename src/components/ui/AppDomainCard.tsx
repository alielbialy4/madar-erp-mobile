import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { AppText } from './AppText';
import { AppBadge } from './AppBadge';
import { PressableScale } from './PressableScale';
import { chevronForwardIcon } from '@/utils/rtl';

type Variant = 'list' | 'compact' | 'metric';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  metric?: string;
  metricLabel?: string;
  leadingIcon?: keyof typeof MaterialIcons.glyphMap;
  leading?: React.ReactNode;
  badgeLabel?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  variant?: Variant;
  onPress?: () => void;
  style?: ViewStyle;
};

export function AppDomainCard({
  title,
  subtitle,
  meta,
  metric,
  metricLabel,
  leadingIcon,
  leading,
  badgeLabel,
  badgeTone,
  variant = 'list',
  onPress,
  style,
}: Props) {
  const c = useColors();
  const styles = useMemo(() => StyleSheet.create({
    card: {
      borderRadius: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: variant === 'compact' ? spacing.sm : spacing.md,
      gap: spacing.sm,
    },
    row: { ...flexRow, alignItems: 'center', gap: spacing.md },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.softPrimary,
    },
    body: { flex: 1, gap: 2 },
    title: {
      ...textStart,
      color: c.text,
      fontSize: variant === 'compact' ? typography.small : typography.body,
      fontFamily: fonts.bold,
      fontWeight: '700',
    },
    subtitle: { ...textStart, color: c.textMuted, fontSize: typography.small },
    meta: { ...textStart, color: c.textCaption, fontSize: typography.tiny },
    metricRow: { ...flexRow, alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
    metricValue: {
      ...textStart,
      color: c.accent,
      fontSize: variant === 'metric' ? typography.metric : typography.body,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
    },
    metricLabel: { ...textStart, color: c.textMuted, fontSize: typography.tiny },
    trailing: { alignItems: 'flex-end', gap: spacing.xs },
  }), [c, variant]);

  const inner = (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        {leading ?? (leadingIcon ? (
          <View style={styles.iconWrap}>
            <MaterialIcons name={leadingIcon} size={variant === 'compact' ? 18 : 20} color={c.accent} />
          </View>
        ) : null)}
        <View style={styles.body}>
          <AppText style={styles.title} numberOfLines={2}>{title}</AppText>
          {subtitle ? <AppText style={styles.subtitle} numberOfLines={2}>{subtitle}</AppText> : null}
          {meta ? <AppText style={styles.meta} numberOfLines={1}>{meta}</AppText> : null}
        </View>
        <View style={styles.trailing}>
          {metric ? <AppText style={styles.metricValue}>{metric}</AppText> : null}
          {badgeLabel ? <AppBadge label={badgeLabel} tone={badgeTone} /> : null}
          {onPress ? <MaterialIcons name={chevronForwardIcon()} size={20} color={c.textCaption} /> : null}
        </View>
      </View>
      {metricLabel ? (
        <View style={styles.metricRow}>
          <AppText style={styles.metricLabel}>{metricLabel}</AppText>
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return inner;
  return <PressableScale onPress={onPress}>{inner}</PressableScale>;
}
