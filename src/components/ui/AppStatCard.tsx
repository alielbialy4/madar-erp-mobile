import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { textStart } from '@/constants/layout';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

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

const toneSoft = {
  primary: colors.accentSoft,
  success: colors.softSuccess,
  warning: colors.softWarning,
  danger: colors.softDanger,
  info: colors.softInfo,
};

const toneIcon = {
  primary: colors.accent,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
};

const tierRing = {
  primary: colors.accent,
  secondary: colors.border,
};

export function AppStatCard({ label, value, hint, tone = 'primary', tier = 'primary', icon }: Props) {
  const isPrimary = tier === 'primary';
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

const styles = StyleSheet.create({
  card: {
    minWidth: 148,
    flex: 1,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.xxxl,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
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
    color: colors.textMuted,
    fontSize: typography.small,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
  value: {
    ...textStart,
    color: colors.text,
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
    color: colors.textCaption,
    fontSize: typography.tiny,
    fontFamily: fonts.regular,
  },
});
