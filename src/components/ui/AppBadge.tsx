import React from 'react';
import { View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppText } from './AppText';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline';

export function AppBadge({ label, tone = 'default' }: { label: string; tone?: Tone }) {
  const c = useColors();
  const toneStyles: Record<Tone, { bg: string; fg: string; border?: string }> = {
    default: { bg: c.accentSoft, fg: c.accent, border: c.accentBorder },
    neutral: { bg: c.softNeutral, fg: c.textMuted, border: c.softNeutralBorder },
    success: { bg: c.softSuccess, fg: c.success, border: c.softSuccessBorder },
    warning: { bg: c.softWarning, fg: c.warning, border: c.softWarningBorder },
    danger: { bg: c.softDanger, fg: c.danger, border: c.softDangerBorder },
    info: { bg: c.softInfo, fg: c.info, border: c.softInfoBorder },
    outline: { bg: 'transparent', fg: c.text, border: c.border },
  };
  const t = toneStyles[tone];
  return (
    <View style={{
      borderRadius: radius.badge,
      paddingHorizontal: 10,
      paddingVertical: 3,
      alignSelf: 'flex-start',
      backgroundColor: t.bg,
      borderWidth: t.border ? 1 : 0,
      borderColor: t.border,
    }}>
      <AppText style={{ fontSize: typography.micro, fontFamily: fonts.bold, fontWeight: '700', color: t.fg, writingDirection: 'rtl' }}>
        {label}
      </AppText>
    </View>
  );
}
