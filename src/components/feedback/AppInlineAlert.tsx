import React from 'react';
import { View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { textStart } from '@/constants/layout';

type Props = {
  message: string;
  tone?: 'warning' | 'info' | 'danger' | 'success';
};

export function AppInlineAlert({ message, tone = 'warning' }: Props) {
  const c = useColors();
  const palette = {
    warning: { bg: c.softWarning, border: c.softWarningBorder, fg: c.warning, icon: 'warning-amber' as const },
    info: { bg: c.softInfo, border: c.softInfoBorder, fg: c.info, icon: 'info-outline' as const },
    danger: { bg: c.softDanger, border: c.softDangerBorder, fg: c.danger, icon: 'error-outline' as const },
    success: { bg: c.softSuccess, border: c.softSuccessBorder, fg: c.success, icon: 'check-circle' as const },
  }[tone];

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.bg,
    }}>
      <MaterialIcons name={palette.icon} size={18} color={palette.fg} />
      <AppText style={{ ...textStart, flex: 1, color: c.text, fontFamily: fonts.medium, fontSize: typography.body }}>{message}</AppText>
    </View>
  );
}
