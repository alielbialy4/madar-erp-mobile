import React from 'react';
import { View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function AppErrorState({ message = 'حدث خطأ أثناء تحميل البيانات', onRetry }: Props) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge, gap: spacing.md, paddingHorizontal: spacing.xxl }}>
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: c.softDanger, alignItems: 'center', justifyContent: 'center',
      }}>
        <MaterialIcons name="error-outline" size={32} color={c.danger} />
      </View>
      <AppText style={{
        fontSize: typography.subtitle, fontFamily: fonts.bold, fontWeight: '700',
        color: c.text, textAlign: 'center', writingDirection: 'rtl',
      }}>
        عذراً، حدث خطأ
      </AppText>
      <AppText style={{
        fontSize: typography.body, color: c.textMuted, textAlign: 'center', writingDirection: 'rtl',
        lineHeight: 22, maxWidth: 280,
      }}>
        {message}
      </AppText>
      {onRetry ? <AppButton title="إعادة المحاولة" variant="outline" onPress={onRetry} size="sm" /> : null}
    </View>
  );
}
