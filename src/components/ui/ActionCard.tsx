import React from 'react';
import { Pressable, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { textStart, flexRow } from '@/constants/layout';
import { AppText } from './AppText';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

export function ActionCard({ title, subtitle, right, onPress }: Props) {
  const c = useColors();

  const content = (
    <View style={{
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.lg,
    }}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={{
          color: c.text,
          fontSize: typography.body,
          fontFamily: fonts.bold,
          fontWeight: '700',
          ...textStart,
        }} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={{
            color: c.textCaption,
            fontSize: typography.micro,
            ...textStart,
          }} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}
