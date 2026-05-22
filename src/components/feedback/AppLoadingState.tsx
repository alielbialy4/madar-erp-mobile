import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppText } from '@/components/ui/AppText';
import { AppSkeletonList } from './AppSkeletonList';

type Props = {
  message?: string;
  variant?: 'spinner' | 'skeleton';
  skeletonRows?: number;
};

export function AppLoadingState({ message = 'جاري التحميل...', variant = 'spinner', skeletonRows = 6 }: Props) {
  const c = useColors();

  if (variant === 'skeleton') {
    return (
      <View style={{ flex: 1 }}>
        <AppSkeletonList rows={skeletonRows} />
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge, gap: spacing.md }}>
      <ActivityIndicator size="large" color={c.accent} />
      <AppText style={{
        fontSize: typography.body, fontFamily: fonts.medium,
        color: c.textMuted, textAlign: 'center', writingDirection: 'rtl',
      }}>
        {message}
      </AppText>
    </View>
  );
}
