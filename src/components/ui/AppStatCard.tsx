import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/ui/AppText';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

type Tier = 'primary' | 'secondary';

type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  tier?: Tier;
  icon?: React.ReactNode;
};

export function AppStatCard({ label, value, hint, tone = 'primary', tier = 'primary', icon }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const isPrimary = tier === 'primary';

  const toneSoft: Record<Tone, string> = {
    primary: c.accentSoft,
    success: c.softSuccess,
    warning: c.softWarning,
    danger: c.softDanger,
    info: c.softInfo,
  };

  const toneIcon: Record<Tone, string> = {
    primary: c.accent,
    success: c.success,
    warning: c.warning,
    danger: c.danger,
    info: c.info,
  };

  const tierRing: Record<Tier, string> = {
    primary: c.accent,
    secondary: c.border,
  };

  return (
    <View
      style={[
        styles.card,
        isPrimary ? styles.primaryCard : styles.secondaryCard,
        { borderColor: tierRing[tier] },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: toneSoft[tone] }]}>
        {icon ? (
          icon
        ) : (
          <View style={[styles.dot, { backgroundColor: toneIcon[tone] }]} />
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, isPrimary ? styles.valuePrimary : styles.valueSecondary]}>
        {value}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      minWidth: 148,
      flex: 1,
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderRadius: radius.xxxl,
      padding: spacing.lg,
      ...Platform.select({
        ios: {
          shadowColor: c.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 1,
          shadowRadius: 3,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    primaryCard: {
      minHeight: 108,
    },
    secondaryCard: {
      minHeight: 100,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    dot: { width: 12, height: 12, borderRadius: 6 },
    label: {
      ...textStart,
      color: c.textMuted,
      fontSize: typography.small,
      fontFamily: fonts.medium,
      fontWeight: '600',
    },
    value: {
      ...textStart,
      color: c.text,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
    },
    valuePrimary: {
      fontSize: 26,
    },
    valueSecondary: {
      fontSize: typography.pageTitle,
    },
    hint: {
      ...textStart,
      color: c.textCaption,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
    },
  });
}
