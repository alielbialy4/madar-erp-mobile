import React from 'react';
import { View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppText } from './AppText';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline';

const toneStyles: Record<Tone, { bg: string; fg: string }> = {
  default: { bg: '#EBF0FF', fg: '#3366FF' },
  neutral: { bg: '#F0F2F8', fg: '#5E6B82' },
  success: { bg: '#ECFDF5', fg: '#059669' },
  warning: { bg: '#FFFBEB', fg: '#B45309' },
  danger: { bg: '#FEF1F1', fg: '#DC2626' },
  info: { bg: '#EFF6FF', fg: '#2563EB' },
  outline: { bg: 'transparent', fg: '#0C1222' },
};

export function AppBadge({ label, tone = 'default' }: { label: string; tone?: Tone }) {
  const c = useColors();
  const t = toneStyles[tone];
  return (
    <View style={{
      borderRadius: radius.badge,
      paddingHorizontal: 10,
      paddingVertical: 3,
      alignSelf: 'flex-start',
      backgroundColor: t.bg,
      ...(tone === 'outline' ? { borderWidth: 1, borderColor: c.border } : {}),
    }}>
      <AppText style={{ fontSize: typography.micro, fontFamily: fonts.bold, fontWeight: '700', color: t.fg, writingDirection: 'rtl' }}>
        {label}
      </AppText>
    </View>
  );
}
