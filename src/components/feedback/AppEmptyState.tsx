import React from 'react';
import { View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppText } from '@/components/ui/AppText';

type Props = {
  title?: string;
  message?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  action?: React.ReactNode;
};

export function AppEmptyState({ title = 'لا توجد بيانات', message, icon = 'inbox', action }: Props) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge, gap: spacing.md, paddingHorizontal: spacing.xxl }}>
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: c.surfaceMuted, alignItems: 'center', justifyContent: 'center',
      }}>
        <MaterialIcons name={icon} size={32} color={c.textCaption} />
      </View>
      <AppText style={{
        fontSize: typography.subtitle, fontFamily: fonts.bold, fontWeight: '700',
        color: c.text, textAlign: 'center', writingDirection: 'rtl',
      }}>
        {title}
      </AppText>
      {message ? (
        <AppText style={{
          fontSize: typography.body, color: c.textMuted, textAlign: 'center', writingDirection: 'rtl',
          lineHeight: 22, maxWidth: 280,
        }}>
          {message}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}
