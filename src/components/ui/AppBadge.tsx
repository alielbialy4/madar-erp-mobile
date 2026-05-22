import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline';

const toneMap = {
  default: { bg: colors.softPrimary, fg: colors.primary },
  neutral: { bg: colors.softNeutral, fg: colors.textMuted },
  success: { bg: colors.softSuccess, fg: '#15803D' },
  warning: { bg: colors.softWarning, fg: '#B45309' },
  danger: { bg: colors.softDanger, fg: '#DC2626' },
  info: { bg: colors.softInfo, fg: '#2563EB' },
  outline: { bg: 'transparent', fg: colors.text },
};

export function AppBadge({ label, tone = 'default' }: { label: string; tone?: Tone }) {
  const t = toneMap[tone];
  return (
    <View style={[styles.badge, tone === 'outline' ? styles.outlineBorder : undefined, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  outlineBorder: { borderWidth: 1, borderColor: colors.border },
  text: {
    fontSize: typography.tiny,
    fontFamily: fonts.bold,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
});
